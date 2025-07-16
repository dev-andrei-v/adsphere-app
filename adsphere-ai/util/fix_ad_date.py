import random
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from db.mongodb import db, DbCollection

start_date = datetime(2025, 4, 12)
end_date = datetime(2025, 6, 14)

delta = end_date - start_date
total_seconds = int(delta.total_seconds())

ads_cursor = db[DbCollection.ADS].find({
    "updatedAt": {"$gte": datetime(2025, 6, 10)}  # doar cele recente
})

updated = 0
for ad in ads_cursor:
    random_updated_seconds = random.randint(0, total_seconds)
    updated_at = start_date + timedelta(seconds=random_updated_seconds)

    back_days = random.randint(1, 20)
    created_at = updated_at - timedelta(days=back_days)

    db[DbCollection.ADS].update_one(
        {"_id": ObjectId(ad["_id"])},
        {
            "$set": {
                "createdAt": created_at,
                "updatedAt": updated_at
            }
        }
    )
    updated += 1

print(f"✅ Updated {updated} ads with realistic createdAt/updatedAt.")
