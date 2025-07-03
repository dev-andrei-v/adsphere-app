import logging

import uvicorn
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import threading
import time

from config import env
from config.env import RUN_WEB_SCRAPING
from rabbitmq.consumer import start_rabbitmq_consumer
from seed.olx_api import fetch_ads
from services.ad_recommendation import refresh_ads_cache, CACHE_DURATION_SECONDS
from util.ad_enhancer import TitleRequest, ad_enhancer, DescriptionRequest

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=start_rabbitmq_consumer, daemon=True).start()
    threading.Thread(target=run_external_ads_seed, daemon=True).start()
    threading.Thread(target=schedule_cache_refresh, daemon=True).start()
    yield
app = FastAPI(lifespan=lifespan, root_path="/api")

@app.get("/")
async def root():
    return {"message": "AdSphere AI API is up and running"}

@app.post("/enhance-ad/title")
async def enhance_title(request: TitleRequest):
    print(request)
    try:
        result = ad_enhancer.enhance_ad_title(request.title, request.description)
        return result
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhance-ad/description")
async def enhance_description(request: DescriptionRequest):
    try:
        result = ad_enhancer.enhance_ad_description(request.description, min_chars=request.min_chars, title=request.title)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/user-recommendations/{user_id}')
async def get_user_recommendations(user_id: str, limit: int = 4):
    from services.ad_recommendation import get_user_recommendations
    try:
        recommendations = get_user_recommendations(user_id, limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/user-recommendations/{ad_id}/user/{user_id}')
async def get_recommendations_for_ad(ad_id: str, user_id: str, limit: int = 8):
    from services.ad_recommendation import get_recommendations_for_ad
    try:
        recommendations = get_recommendations_for_ad(ad_id, limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=env.APP_PORT, reload=True)


def run_external_ads_seed():
    if RUN_WEB_SCRAPING:
        logger.info("🔄 Web scraping is enabled, starting external ads seed in 20s")
        time.sleep(20)  # Wait for RabbitMQ
        while True:
            logger.info("🔄 Fetching ads from OLX API")
            try:
                fetch_ads()
            except Exception as e:
                logger.error(f"❌ Failed to fetch ads: {e}")
            logger.info("✅ Ads fetch completed, waiting for 10 minutes before next run")
            time.sleep(600)

def schedule_cache_refresh():
    refresh_ads_cache()
    threading.Timer(CACHE_DURATION_SECONDS, schedule_cache_refresh).start()