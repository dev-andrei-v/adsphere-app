import requests
from PIL import Image
import imagehash
from io import BytesIO
from db.mongodb import DbCollection, db

PLACEHOLDER_HASHES = [
    'c2d0844f6b3cfd25'
]
def get_image_hash(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    return str(imagehash.phash(img))

def is_olx_placeholder(url):
    try:
        img_hash = get_image_hash(url)
        return img_hash in PLACEHOLDER_HASHES
    except Exception as e:
        print(f"Error downloading or hashing image: {e}")
        return False 


def remove_olx_img_from_adsphere_db():
    ads_cursor = list(db[DbCollection.ADS].find({"images": {"$exists": True, "$ne": []}}))
    for ad in ads_cursor:
        images = ad.get("images", [])
        if not images:
            continue

        new_images = []
        for img in images:
            if not is_olx_placeholder(img['url']):
                new_images.append(img)

        if len(new_images) < len(images):
            db[DbCollection.ADS].update_one(
                {"_id": ad["_id"]},
                {"$set": {"images": new_images}}
            )
            print(f"Updated ad {ad['_id']} with {len(new_images)} images.")
        else:
            print(f"No changes for ad {ad['_id']}.")

if __name__ == "__main__":
    print("Starting to remove OLX placeholder images from Adsphere DB...")
    remove_olx_img_from_adsphere_db()
