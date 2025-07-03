from urllib.parse import quote_plus

from dotenv import load_dotenv
import os

load_dotenv()

APP_PORT = int(os.getenv("APP_PORT", 8090))
MONGODB_HOST = os.getenv("MONGODB_HOST", "localhost")
MONGODB_PORT = int(os.getenv("MONGODB_PORT", 27017))
MONGODB_DB = os.getenv("MONGODB_DB", "adsphere")
MONGODB_USER = os.getenv("MONGODB_USER", "")
MONGODB_PASS = os.getenv("MONGODB_PASS", "")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "ads.process")
OLLAMA_API = os.getenv("OLLAMA_API", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")  # or 'gpt-4o' for GPT-4 Turbo
RUN_WEB_SCRAPING = os.getenv("RUN_WEB_SCRAPING", "true").lower() == "true"

if MONGODB_USER and MONGODB_PASS:
    user = quote_plus(MONGODB_USER)
    password = quote_plus(MONGODB_PASS)
    MONGODB_URI = f"mongodb://{user}:{password}@{MONGODB_HOST}:{MONGODB_PORT}/{MONGODB_DB}?authSource=admin"
else:
    MONGODB_URI = f"mongodb://{MONGODB_HOST}:{MONGODB_PORT}/{MONGODB_DB}"
