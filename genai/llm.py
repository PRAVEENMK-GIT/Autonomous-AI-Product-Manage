import logging
import os
from typing import Optional
from langchain_openai import ChatOpenAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)


def is_llm_configured() -> bool:
    """Check if a real NVIDIA API key is configured."""
    key = os.getenv("NVIDIA_API_KEY", "").strip()
    return bool(key and not key.startswith("nvapi-your-key") and key != "dummy")


def get_llm(temperature: float = 0.0, timeout: int = 120) -> ChatOpenAI:
    """Return configured ChatOpenAI client pointing to NVIDIA API Catalog."""
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").strip()
    model = os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct").strip()

    if not api_key:
        api_key = "dummy-key-for-offline"

    return ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=temperature,
        timeout=timeout,
    )


# Exception retry decorator for LLM calls: up to 3 attempts with exponential backoff
llm_retry_decorator = retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,)),
)
