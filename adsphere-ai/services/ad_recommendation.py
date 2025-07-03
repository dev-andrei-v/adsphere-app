import datetime
import json
import logging

from bson import ObjectId
from fastapi import HTTPException

from db.mongodb import db, DbCollection

logger = logging.getLogger(__name__)

def get_recommendations_for_ad(ad_id: str, user_id: str, limit: int = 4):
    pass

from bson import ObjectId

class MongoEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super().default(obj)

def get_user_recommendations_naive(user_id: str, limit: int = 8):
    # 1. Colectăm favorite
    favorite_ids = [
        doc["adId"]
        for doc in db[DbCollection.FAVORITEADS].find({"userId": ObjectId(user_id)})
    ]

    # 2. Colectăm ultimele 20 de vizualizări
    viewed_docs = db[DbCollection.ADVIEWS].find(
        {"userId": ObjectId(user_id)}
    ).sort("viewedAt", -1).limit(20)
    viewed_ids = [doc["adId"] for doc in viewed_docs]

    # 3. Combinăm și deduplicăm ID-urile anunțurilor cu care userul a interacționat
    interacted_ids = list(set(favorite_ids + viewed_ids))

    # 4. Extragem categoriile din anunțurile interacționate
    category_ids = []
    if interacted_ids:
        interacted_ads = list(db[DbCollection.ADS].find(
            {"_id": {"$in": interacted_ids}},
            {"categoryId": 1}
        ))
        category_ids = list({ad["categoryId"] for ad in interacted_ads if "categoryId" in ad})

    # 5. Recomandări din aceleași categorii
    recommendation_cursor = db[DbCollection.ADS].find({
        "status": "approved",
        **({"categoryId": {"$in": category_ids}} if category_ids else {})
    }).sort("viewCount", -1)

    # 6. Asigurăm unicitatea + limitarea rezultatelor
    recommendations = []
    seen_ids = set(interacted_ids)
    for ad in recommendation_cursor:
        if ad["_id"] not in seen_ids:
            recommendations.append(ad)
            seen_ids.add(ad["_id"])
        if len(recommendations) >= limit:
            break

    # 7. Fallback: dacă nu sunt suficiente, completăm cu cele mai populare anunțuri
    if len(recommendations) < limit:
        fallback_cursor = db[DbCollection.ADS].find({
            "status": "approved",
            "_id": {"$nin": list(seen_ids)}
        }).sort("viewCount", -1)

        for ad in fallback_cursor:
            recommendations.append(ad)
            seen_ids.add(ad["_id"])
            if len(recommendations) >= limit:
                break

    print("Recommendations for user {}: {}".format(user_id, recommendations))
    return json.loads(json.dumps(recommendations, cls=MongoEncoder))

romanian_stopwords = list("""
vreo acelea cata cita degraba lor alta tot ai dat despre peste bine dar foarte avea multi cit cat alt mai sa fie tu intrucat multe orice dintr dintre dintr-o dintr-un se intr intr-o intr-un niste multa insa il fost a abia nimic sub acel in altceva si avem altfel c ea acest li parca fi dintre unele m acestei mare cel este pe atitia atatia uneori acela iti astazi acestui o imi ele ceilalti pai fata noua sa-ti altul au i prin conform aceste anume azi k unul ala unei fara ei la aceeasi u inapoi acestea acesta aceasta catre sale asupra as aceea ba ale da le apoi aia suntem cum isi inainte s de cind cand cumva chiar acestia daca sunt care al numai cui sus tocmai prea cu mi eu doar niciodata nicidecum exact putini aiurea tuturor celor astfel atunci cîteva cateva cat ca sau fel intre acolo nostri ma mult una ceea iar iara sintem suntem ati din geaba sai caruia adica inca are aici ca ia nici d oricum asta carora face citiva cativa voi unor f atat toata alaturi cea nu totusi ce altii acum sint sunt capat mod deasupra cam vom b toate careia aceasta atit atat nimeni ii ci unde ul plus era sa-mi l spre dupa nou cele aceea un incit incat n cei or va deci acelasi atatea h vor decit decat noi cineva desi ceva j ului atitea atatea avut ar pina pana t atata unui el citi asa totul pentru atita v alti asemenea atatia te ne deja unii p atare cite cate cine cand toti vreun ori r alte lui ti ni aceia am
""".split())
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_ads_cache = {
    "ads": [],              # toate anunțurile aprobate
    "texts": [],            # lista de titluri+descrieri
    "vectorizer": None,     # instanța TfidfVectorizer
    "tfidf_matrix": None,   # matricea TF-IDF completă
    "timestamp": 0
}

def get_cached_ads_and_vectors():
    return _ads_cache["ads"], _ads_cache["vectorizer"], _ads_cache["tfidf_matrix"]

def get_user_recommendations(user_id: str, limit: int = 4):
    user_oid = ObjectId(user_id)

    # 1. ID-urile anunțurilor favorite și vizualizate
    favorite_ids = [
        doc["adId"]
        for doc in db[DbCollection.FAVORITEADS].find({"userId": user_oid})
    ]
    viewed_ids = [
        doc["adId"]
        for doc in db[DbCollection.ADVIEWS].find({"userId": user_oid}).sort("viewedAt", -1).limit(20)
    ]
    interacted_ids = list(set(favorite_ids + viewed_ids))

    if not interacted_ids:
        return []

    # 2. Preluăm anunțurile interacționate din DB (pot fi puține)
    interacted_ads = list(db[DbCollection.ADS].find(
        {"_id": {"$in": interacted_ids}},
        {"title": 1, "description": 1}
    ))

    interacted_texts = [
        f"{ad.get('title', '')} {ad.get('description', '')}"
        for ad in interacted_ads
    ]

    if not interacted_texts:
        return []

    # 3. Preluăm din cache toate anunțurile candidate + TF-IDF
    cached_ads, vectorizer, tfidf_matrix = get_cached_ads_and_vectors()

    if vectorizer is None or tfidf_matrix is None or not cached_ads:
        raise HTTPException(status_code=503, detail="Recommender cache is not ready.")

    # 4. Vectorizăm textele userului (fără refit!)
    interacted_vecs = vectorizer.transform(interacted_texts)

    # 5. Calculăm similarități
    similarities = cosine_similarity(interacted_vecs, tfidf_matrix)
    scores = similarities.mean(axis=0)

    # 6. Sortează cele mai relevante anunțuri
    top_indices = scores.argsort()[::-1]

    seen_ids = set(interacted_ids)
    recommendations = []
    for i in top_indices:
        ad = cached_ads[i]
        if ad["_id"] not in seen_ids:
            ad["_id"] = str(ad["_id"])
            recommendations.append(ad)
        if len(recommendations) >= limit:
            break

    unique_recommandations = {}
    for ad in recommendations:
        unique_recommandations[ad["_id"]] = ad  # păstrează ultimul (sau primul)

    return json.loads(json.dumps(list(unique_recommandations.values()), cls=MongoEncoder))


CACHE_DURATION_SECONDS = 300  # 5 minute


def refresh_ads_cache():
    global _ads_cache

    logger.info("refreshing ads cache")

    # 1. Preluăm anunțurile aprobate din DB
    ads = list(db[DbCollection.ADS].find(
        {"status": "approved"},
    ))

    # 2. Prelucrăm textele pentru TF-IDF
    texts = [f"{ad.get('title', '').strip()} {ad.get('description', '').strip()}" for ad in ads]

    # 3. TF-IDF vectorizare
    vectorizer = TfidfVectorizer(stop_words=list(romanian_stopwords))
    tfidf_matrix = vectorizer.fit_transform(texts)

    # 4. Salvăm în cache
    _ads_cache.update({
        "ads": ads,
        "texts": texts,
        "vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix,
        "timestamp": datetime.datetime.now().timestamp()
    })

    logger.info(f"Ads cache refreshed with {len(ads)} ads at {datetime.datetime.now().isoformat()}")