import datetime
import logging
import time

import requests
from bson import ObjectId
import random
rand=random.Random()
from config.logservice import AdStatus
from db.mongodb import DbCollection, db
from slugify import slugify
from dateutil.parser import parse
from seed.olx_image_utils import is_olx_placeholder
from rabbitmq.publisher import RabbitMqPublisher

logger = logging.getLogger("external-seed")

API_URL = "https://www.olx.ro/apigateway/graphql"
CATEGORY_META_URL = "https://categories.olxcdn.com/posting/v1/categories/{id}?brand=olxro&lang=ro"

LISTING_ADS_QUERY = """
query ListingSearchQuery(
  $searchParameters: [SearchParameter!] = {key: "", value: ""}
) {
  clientCompatibleListings(searchParameters: $searchParameters) {
    __typename
    ... on ListingSuccess {
      __typename
      data {
        id
        location {
          city {
            id
            name
            normalized_name
            _nodeId
          }
          district {
            id
            name
            normalized_name
            _nodeId
          }
          region {
            id
            name
            normalized_name
            _nodeId
          }
        }
        last_refresh_time
        delivery {
          rock {
            active
            mode
            offer_id
          }
        }
        created_time
        category {
          id
          type
          _nodeId
        }
        contact {
          courier
          chat
          name
          negotiation
          phone
        }
        business
        omnibus_pushup_time
        photos {
          link
          height
          rotation
          width
        }
        promotion {
          highlighted
          top_ad
          options
          premium_ad_page
          urgent
          b2c_ad_page
        }
        protect_phone
        shop {
          subdomain
        }
        title
        status
        url
        user {
          id
          uuid
          _nodeId
          about
          b2c_business_page
          banner_desktop
          banner_mobile
          company_name
          created
          is_online
          last_seen
          logo
          logo_ad_page
          name
          other_ads_enabled
          photo
          seller_type
          social_network_account_type
        }
        offer_type
        params {
          key
          name
          type
          value {
            __typename
            ... on GenericParam {
              key
              label
            }
            ... on CheckboxesParam {
              label
              checkboxParamKey: key
            }
            ... on PriceParam {
              value
              type
              previous_value
              previous_label
              negotiable
              label
              currency
              converted_value
              converted_previous_value
              converted_currency
              arranged
              budget
            }
            ... on SalaryParam {
              from
              to
              arranged
              converted_currency
              converted_from
              converted_to
              currency
              gross
              type
            }
            ... on ErrorParam {
              message
            }
          }
        }
        _nodeId
        description
        external_url
        key_params
        partner {
          code
        }
        map {
          lat
          lon
          radius
          show_detailed
          zoom
        }
        safedeal {
          allowed_quantity
          weight_grams
        }
        valid_to_time
      }
      metadata {
        filter_suggestions {
          category
          label
          name
          type
          unit
          values {
            label
            value
          }
          constraints {
            type
          }
          search_label
        }
        search_id
        total_elements
        visible_total_count
        source
        search_suggestion {
          url
          type
          changes {
            category_id
            city_id
            distance
            district_id
            query
            region_id
            strategy
            excluded_category_id
          }
        }
        facets {
          category {
            id
            count
            label
            url
          }
          category_id_1 {
            count
            id
            label
            url
          }
          category_id_2 {
            count
            id
            label
            url
          }
          category_without_exclusions {
            count
            id
            label
            url
          }
          category_id_3_without_exclusions {
            id
            count
            label
            url
          }
          city {
            count
            id
            label
            url
          }
          district {
            count
            id
            label
            url
          }
          owner_type {
            count
            id
            label
            url
          }
          region {
            id
            count
            label
            url
          }
          scope {
            id
            count
            label
            url
          }
        }
        new
        promoted
      }
      links {
        first {
          href
        }
        next {
          href
        }
        previous {
          href
        }
        self {
          href
        }
      }
    }
    ... on ListingError {
      __typename
      error {
        code
        detail
        status
        title
        validation {
          detail
          field
          title
        }
      }
    }
  }
}

"""

localities_cursor = db[DbCollection.LOCALITIES].find()
LOCALITIES = list(localities_cursor)

OLX_CATEGORIES_MAP_TO_ADSPHERE = {
    "1641": {
        "id": "6847499c98ba8b36d346c8cb",
        "name": "Accesorii auto",
    },
    "84": {
        "id": "6846d0d4aada00e28d889ee7",
        "name": "Autoturisme",
    },
    "1639": {
        "id": "6847495f98ba8b36d346c895",
        "name": "Piese auto",
    },
    "282": {
        "id": "68474a9198ba8b36d346cac6",
        "name": "Electrocasnice",
    },
    "1870": {
        "id": "684749ea98ba8b36d346c993",
        "name": "Laptopuri și PC-uri",
    },
    "1668": {
        "id": "68474a8598ba8b36d346caa5",
        "name": "TV / Audio / Video",
    },
    "101": {
        "id": "684749ae98ba8b36d346c8f3",
        "name": "Telefoane mobile",
    },
    "1949": {
        "id": "68474bdb8aafad77dc68b6a5",
        "name": "Cosmetice"
    },
    "1083": {
        "id": "68474abf98ba8b36d346cb7c",
        "name": "Îmbrăcăminte"
    },
    "1087": {
        "id": "68474ac798ba8b36d346cb9d",
        "name": "Încălțăminte"
    },
    "3103": {
        "id": "68474aa598ba8b36d346cb19",
        "name": "Decorațiuni"
    },
    "163": {
        "id": "68474aac98ba8b36d346cb3a",
        "name": "Echipamente grădină"
    },
    "3051": {
        "id": "68474a9c98ba8b36d346caf8",
        "name": "Mobilier"
    },
    "3214": {
        "id": "68474ab598ba8b36d346cb5b",
        "name": "Unelte"
    },
    "911": {
        "id": "68474c078aafad77dc68b74a",
        "name": "Imobiliare - De vânzare"
    },
    "913": {
        "id": "68474c148aafad77dc68b76b",
        "name": "Imobiliare - De închiriat"
    },
    "907": { # Garsoniere
        "id": "68474c078aafad77dc68b74a",
        "name": "Imobiliare - De vânzare"
    },
    "909": { # Garsoniere
        "id": "68474c148aafad77dc68b76b",
        "name": "Imobiliare - De închiriat"
    },
    "709": {
        "id": "68474e528aafad77dc68c0a2",
        "name": "Terenuri"
    },
    "1557": {
        "id": "68474bfd8aafad77dc68b729",
        "name": "Curățenie"
    },
    "2726": {
        "id": "68474be58aafad77dc68b6c6",
        "name": "Reparații și mentenanță"
    },
    "2722": {
        "id": "68474bf48aafad77dc68b708",
        "name": "IT & Web"
    },    "2723": {
        "id": "68474bf48aafad77dc68b708",
        "name": "IT & Web"
    },
    "2633": {
        "id": "68474bed8aafad77dc68b6e7",
        "name": "Transport & mutări"
    },
    "461": {
        "id": "68474eae8aafad77dc68c228",
        "name": "Biciclete și accesorii"
    },
    "1565": {
        "id": "68474eb48aafad77dc68c240",
        "name": "Camping / drumeții / pescuit"
    },
    "1567": {
        "id": "68474eb48aafad77dc68c240",
        "name": "Camping / drumeții / pescuit"
    },
    "1575": {
        "id": "68474eb48aafad77dc68c240",
        "name": "Camping / drumeții / pescuit"
    },
    "991": {
        "id": "68474ebf8aafad77dc68c270",
        "name": "Cărți & reviste"
    },
    "799": {
        "id": "68474ea88aafad77dc68c210",
        "name": "Echipamente sportive"
    },
    "995 ": {
        "id": "68474ec68aafad77dc68c288",
        "name": "Filme & muzică "
    },
    "993 ": { # Muzica
        "id": "68474ec68aafad77dc68c288",
        "name": "Filme & muzică "
    },
    "1884": {
      "id": "68474eba8aafad77dc68c258",
      "name": "Jocuri & console",
    },

    "52": {
        "id": "68474f718aafad77dc68c3b8",
        "name": "Domeniul hotelier & restaurante"
    },
    "1325": {
        "id": "68474f598aafad77dc68c370",
        "name": "Educatie / Training"
    },
    "1319": {
        "id": "68474f648aafad77dc68c388",
        "name": "IT & Telecom"
    },
    "1329": {
        "id": "68474f6a8aafad77dc68c3a0",
        "name": "Logistică"
    },
    "1323": {
        "id": "68474f528aafad77dc68c358",
        "name": "Relații clienți"
    },
    "1339": {
        "id": "684dcdce97f096df7d847829",
        "name": "Casieri / lucratori comerciali"
    }
}

# Dicționar de formă: (nume_lower, județ_lower) → localitate
locality_map = {
    (loc['name'].strip().lower(), loc['county'].strip().lower()): loc
    for loc in LOCALITIES
}


def map_olx_location_to_locality(olx_location):
    city_data = olx_location.get('district') or olx_location.get('city')
    raw_city = city_data.get('name', '').strip()
    raw_county = olx_location['region']['name'].strip()

    if raw_county.lower() == 'bucuresti - ilfov':
        if 'sector' in raw_city.lower():
            county_name = 'Bucuresti'
            city_name = f"Bucuresti - {raw_city.title()}"
        else:
            county_name = 'Ilfov'
            city_name = raw_city.title()
    else:
        county_name = raw_county.title()
        city_name = raw_city.title()

    key = (city_name.lower(), county_name.lower())
    locality = locality_map.get(key)

    if locality:
        return {
            "_id": ObjectId(locality["_id"]),
            "name": locality["name"],
            "county": locality["county"],
            "latitude": locality.get("latitude"),
            "longitude": locality.get("longitude")
        }
    else:
        return None


def get_ads_from_olx(offset=0, limit=40, category_id=None):
    variables = {
        "searchParameters": [
            {"key": "offset", "value": str(offset)},
            {"key": "limit", "value": str(limit)},
            {"key": "filter_refiners", "value": "spell_checker"},
            {"key": "sl", "value": "1962f7e8422x3e5aec3e"}
        ]
    }

    if category_id is not None:
        variables["searchParameters"].append({"key": "category_id", "value": category_id})

    response = requests.post(API_URL, json={
        "query": LISTING_ADS_QUERY,
        "variables": variables
    }).json()
    try:
        return response['data']['clientCompatibleListings']['data']
    except:
        logger.error(f"Failed to get ads from external source: {response}")
        return {}


def extract_param(olx_ad, key):
    for param in olx_ad.get("params", []):
        if param['key'] == key:
            return param['value']
    return None


def get_random_user_id(is_business=False) -> str:
    """Get a random user ID from the database"""
    user_type = "USER_BUSINESS" if is_business else "USER_INDIVIDUAL"
    query = {"type": user_type}

    # Use MongoDB's $sample aggregation to get a random document
    pipeline = [
        {"$match": query},
        {"$sample": {"size": 1}}
    ]

    result = list(db[DbCollection.USERS].aggregate(pipeline))

    if result:
        return str(result[0]["_id"])
    else:
        raise ValueError(f"No user found with type: {user_type}")


def map_olx_to_adsphere(olx_ad, adsphere_category_id=None, random_date=False):
    ad_id = ObjectId()

    images = []
    if 'photos' in olx_ad:
        for idx, photo in enumerate(olx_ad['photos']):
            URL = photo['link'].replace('{width}', '800').replace('{height}', '600')
            if is_olx_placeholder(URL) is False:
                image = {
                    'url': photo['link'].replace('{width}', '800').replace('{height}', '600'),
                    'publicId': 'olx_' + str(olx_ad['id']) + '_' + str(idx),
                    'isFeatured': idx == 0
                }
                images.append(image)

    created_at_str = olx_ad.get('created_time')
    if created_at_str:
        created_at = parse(created_at_str)
    else:
        created_at = datetime.datetime.now()

    if random_date:
        random_days_ago = rand.randint(0, 15)
        random_seconds = rand.randint(0, 24 * 3600)
        created_at = datetime.datetime.now() - datetime.timedelta(days=random_days_ago, seconds=random_seconds)

    price = extract_param(olx_ad, 'price')
    updated_at_str = olx_ad.get('last_refresh_time')
    if updated_at_str:
        updated_at = parse(updated_at_str)
    else:
        updated_at = datetime.datetime.now()

    if price is not None and price['currency'] == 'EUR':
        price['currency'] = 'EURO'

    slug = f"{slugify(olx_ad['title'], lowercase=True)}-{str(ad_id)[-6:]}"
    if price is not None:
        price_type = 'fixed' if price.get('negotiable', False) else 'negotiable'
    else:
        price_type = None
    probability_to_set_other_price_type = 0.3
    if price_type == 'fixed' and rand.uniform(0,1) < probability_to_set_other_price_type:
        p_auction = 0.4
        p_exchange = 0.2
        p = rand.uniform(0, 1)
        if p < p_auction:
            price_type = 'auction'
        elif p < p_exchange:
            price_type = 'exchange'

    if price is None:
        price_type = 'not_specified'
        price_value = None
        currency = None
    else:
        price_value = price.get('value')
        currency = price.get('currency')
        if price_value is None:
            price_type = 'not_specified'
        elif price_value == 0:
            price_type = 'free'

    attributes = {}
    for param in olx_ad.get('params', []):
        if param['key'] == 'price':
            continue

        try:
            int(param['value']['key'])
            as_number = int(param['value']['key'])
            attributes[param['key']] = as_number
        except (ValueError, KeyError):
            try:
                attributes[param['key']] = param['value']['label']
            except KeyError:
                pass

    is_business = olx_ad.get('business', False)
    user_id = get_random_user_id(is_business=is_business)
    return {
        "_id": ad_id,
        "title": olx_ad['title'],
        "slug": slug,
        "description": olx_ad.get('description', ''),
        "price": price_value,
        "currency": currency,
        "priceType": price_type,
        "images": images,
        "categoryId": ObjectId(adsphere_category_id),
        "userId": ObjectId(user_id),
        "userAccountType": "USER_BUSINESS" if is_business else "USER_INDIVIDUAL",
        "locality": map_olx_location_to_locality(olx_ad['location']),
        "attributes": attributes,
        "status": AdStatus.PENDING.value,
        "externalSourceId": olx_ad['id'],
        "createdAt": created_at,
        "updatedAt": updated_at
    }


# Fetchs ads from all OLX categories and inserts them into the database
def fetch_ads():
    rabbitMqPublisher = RabbitMqPublisher()
    for category_id, category_data in OLX_CATEGORIES_MAP_TO_ADSPHERE.items():
        logger.info(f"Fetching ads for category {category_data['name']} ({category_id})...")

        # parse in batches till 1000
        offset = 0
        limit = 50

        while True:
            ads = get_ads_from_olx(offset=offset, limit=limit, category_id=category_id)
            if not ads:
                break

            for olx_ad in ads:
                try:
                    adsphere_ad = map_olx_to_adsphere(olx_ad, category_data['id'], random_date=True)
                    db[DbCollection.ADS].insert_one(adsphere_ad)
                    logger.info(f"✅ Ad {str(adsphere_ad['_id'])} inserted successfully.")
                    rabbitMqPublisher.publish(ad_id=str(adsphere_ad['_id']), created_at=adsphere_ad['createdAt'])
                    time.sleep(5)
                except Exception as e:
                    ad_id = olx_ad.get("id", "unknown")
                    logger.error(f"❌ Error processing OLX ad {ad_id}\nexception: {e}")

            offset += limit
            if offset >= 1000:
                logger.info(f"Reached limit of 1000 ads for category {category_data['name']}. Stopping.")
                break
            # sleep to avoid hitting API rate limits
            logger.info(f"Fetched {len(ads)} ads for category {category_data['name']} at offset {offset}.")
            time.sleep(30)

    rabbitMqPublisher.close()


