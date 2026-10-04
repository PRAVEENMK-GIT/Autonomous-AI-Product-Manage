from fastapi import APIRouter
from app.db.mongo import is_mongo_alive

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Liveness check and MongoDB connection status."""
    mongo_status = is_mongo_alive()
    return {
        "status": "ok",
        "mongo": mongo_status,
    }
