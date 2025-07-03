import time
import logging
from bson import ObjectId
from db.mongodb import db, DbCollection
from config.logservice import log_to_db, LogType, AdStatus, LogAction
from util.ad_enhancer import ad_enhancer

logger = logging.getLogger(__name__)

def automated_ad_review(ad_id: str):
    logger.info(f"🔍 Starting automated review for adId: {ad_id}")
    object_id = _validate_object_id(ad_id)
    if not object_id:
        return

    ad = _retry_fetch_ad(object_id)
    if not ad:
        _log_not_found(ad_id)
        return

    _handle_ad_review(ad, object_id)

def _validate_object_id(ad_id: str):
    try:
        return ObjectId(ad_id)
    except Exception:
        logger.warning(f"⚠️ Invalid adId format: {ad_id}")
        return None

def _retry_fetch_ad(object_id):
    delay = 0.3
    for attempt in range(5):
        ad = db[DbCollection.ADS].find_one({"_id": object_id})
        if ad:
            return ad
        time.sleep(delay)
        delay *= 2
    return None

from services.business_classifier import predict_user_type

def _handle_ad_review(ad: dict, object_id: ObjectId):
    title = ad.get("title", "")
    description = ad.get("description", "")
    user = ad.get("user", {})
    externalSourceId = ad.get("externalSourceId", None)

    prediction = predict_user_type(title, description)
    predicted_type = prediction["prediction"]
    account_type = user.get("accountType")

    if externalSourceId is None:
        # First, enforce account vs predicted type rule
        if predicted_type == "business" and account_type != "USER_BUSINESS":
            _reject_ad(object_id, prediction)

        # Then do AI moderation
        else:
            verdict = ad_enhancer.moderate_ad(title, description).strip().upper()
            if verdict == "DA":
                _approve_ad(object_id, prediction, ai_moderate=True)
            else:
                _reject_ad(object_id, prediction)

    elif predicted_type == "business" and account_type == "USER_INDIVIDUAL":
        _reject_ad(object_id, prediction)
    else:
        _approve_ad(object_id, prediction)

def _approve_ad(object_id, prediction, ai_moderate=False):
    db[DbCollection.ADS].update_one(
        {"_id": object_id},
        {"$set": {"status": AdStatus.APPROVED.value}}
    )
    if prediction:
        is_business = prediction.get("prediction")  # np.True_/np.False_
        label = "business" if is_business else "non-business"

        prob = prediction.get("probability", {})
        business_prob = prob.get("business", 0)
        non_business_prob = prob.get("non-business", 0)

        msg = (
            f"✅ Ad {object_id} approved automatically as '{label}' "
            f"(business: {business_prob:.2%}, non-business: {non_business_prob:.2%})"
        )

        if ai_moderate:
            msg += " via AI moderation"

        logger.info(msg)

    logger.info(msg)
    log_to_db(msg, LogType.ACTION, LogAction.APPROVE_AD)

def _reject_ad(object_id, prediction, ai_moderate=False):
    db[DbCollection.ADS].update_one(
        {"_id": object_id},
        {"$set": {"status": AdStatus.REJECTED.value}}
    )
    reason = "AI moderation" if ai_moderate else "manual review"
    pred_label = "business" if prediction.get("prediction") else "non-business"
    prob = prediction.get("probability", {})
    business_prob = prob.get("business", 0)
    non_business_prob = prob.get("non-business", 0)

    msg = (
        f"❌ Ad {object_id} was rejected due to business mismatch "
        f"({pred_label}, probability: business={business_prob:.2%}, non-business={non_business_prob:.2%}) "
        f"via {reason}."
    )
    logger.warning(msg)
    log_to_db(msg, LogType.ACTION, LogAction.REJECT_AD)

def _log_not_found(ad_id):
    msg = f"❌ Advertisement with id {ad_id} not found after retries."
    logger.error(msg)
    log_to_db(msg, LogType.INFO)
