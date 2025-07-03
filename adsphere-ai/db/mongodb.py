from pymongo import MongoClient
from urllib.parse import urlparse
from config.env import MONGODB_URI, MONGODB_DB

client = MongoClient(MONGODB_URI)

db_name = MONGODB_DB
db = client[db_name]


class DbCollection:
    ADS = "ads"
    LOGS = "logs"
    USERS = "users"
    LOCALITIES = "localities"
    CATEGORIES = "categories"
    ADVIEWS = "adviews"
    FAVORITEADS = "favoriteads"

