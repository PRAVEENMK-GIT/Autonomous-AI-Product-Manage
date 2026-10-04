import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.documents import router as documents_router
from app.api.health import router as health_router
from app.api.insights import router as insights_router
from app.api.reports import router as reports_router
from app.api.themes import router as themes_router
from app.db.mongo import disconnect_mongo, init_mongo

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection
    init_mongo()
    yield
    # Disconnect MongoDB
    disconnect_mongo()


app = FastAPI(
    title="Autonomous AI Product Manager API",
    description="Discovery & Research Intelligence Engine (Objective 1 MVP)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Optional API Key verification
@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    configured_key = os.getenv("API_KEY", "").strip()
    # Skip auth for health, docs, and schema endpoints
    open_paths = ["/health", "/docs", "/openapi.json", "/redoc"]
    if configured_key and request.url.path not in open_paths and not request.url.path.startswith("/docs"):
        client_key = request.headers.get("X-API-Key")
        if client_key != configured_key:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or missing API key", "code": "UNAUTHORIZED"},
            )
    response = await call_next(request)
    return response


# Validation error handler to match standard { detail, code } error format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": msg, "code": "VALIDATION_ERROR"},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = getattr(exc, "code", "HTTP_ERROR")
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 422:
        code = "UNPROCESSABLE_ENTITY"
    elif exc.status_code == 409:
        code = "CONFLICT"
    elif exc.status_code == 502:
        code = "BAD_GATEWAY"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"

    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail, "code": code},
    )


# Include routers
app.include_router(health_router)
app.include_router(documents_router)
app.include_router(insights_router)
app.include_router(themes_router)
app.include_router(reports_router)
