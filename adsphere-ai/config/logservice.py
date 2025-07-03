import datetime
import logging
from enum import Enum
from db.mongodb import db, DbCollection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SERVICE_NAME = "AdSphere AI Service"

class LogType(str, Enum):
    INFO = "INFO"
    ACTION = "ACTION"
    ERROR = "ERROR"

class AdStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"
    DELETED = "deleted"

class LogAction(str, Enum):
    APPROVE_AD = "approve_ad"
    REJECT_AD = "reject_ad"

def log_to_db(message: str, log_type: LogType, log_action: LogAction = None, by: str = SERVICE_NAME):
    try:
        db[DbCollection.LOGS].insert_one({
            "logType": log_type.value,
            "logAction": log_action.value if log_action else None,
            "message": message,
            "by": by,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
        })
    except Exception as e:
        logger.error(f"❌ Failed to log to database: {e}")
