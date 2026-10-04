import logging
import os
import mongoengine
import mongomock
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

_is_connected = False
_using_mock = False


def init_mongo() -> bool:
    """Initialize MongoDB connection via MongoEngine.
    Supports live MongoDB Atlas/local instances, and automatically falls back to
    in-memory mongomock if MONGO_URL is unset, starts with mongomock, or if live Mongo is unreachable.
    """
    global _is_connected, _using_mock
    mongo_url = os.getenv("MONGO_URL", "").strip()
    force_mock = os.getenv("USE_MOCK_MONGO", "false").lower() in ("true", "1", "yes")

    # If already connected, test connection
    try:
        if mongoengine.connection.get_connection():
            _is_connected = True
            return True
    except Exception:
        pass

    if force_mock or not mongo_url or mongo_url.startswith("mongomock"):
        logger.info("Initializing in-memory mongomock database")
        mongoengine.connect("pm_automation", mongo_client_class=mongomock.MongoClient, uuidRepresentation="standard")
        _is_connected = True
        _using_mock = True
        return True

    try:
        logger.info(f"Connecting to MongoDB at {mongo_url}")
        conn = mongoengine.connect(host=mongo_url, serverSelectionTimeoutMS=2000, uuidRepresentation="standard")
        # Verify connection by running a quick ping
        conn.admin.command("ping")
        _is_connected = True
        _using_mock = False
        logger.info("Successfully connected to live MongoDB")
        return True
    except (PyMongoError, Exception) as e:
        logger.warning(f"Could not connect to live MongoDB: {e}. Falling back to in-memory mongomock.")
        mongoengine.disconnect()
        mongoengine.connect("pm_automation", mongo_client_class=mongomock.MongoClient, uuidRepresentation="standard")
        _is_connected = True
        _using_mock = True
        return True


def disconnect_mongo() -> None:
    """Disconnect from MongoDB."""
    global _is_connected, _using_mock
    try:
        mongoengine.disconnect()
    except Exception:
        pass
    _is_connected = False
    _using_mock = False


def is_mongo_alive() -> bool:
    """Check if MongoDB connection is active and healthy."""
    global _is_connected
    try:
        conn = mongoengine.connection.get_connection()
        if conn is None:
            return False
        # If using mongomock, connection is always alive
        if _using_mock:
            return True
        conn.admin.command("ping")
        return True
    except Exception:
        return False
