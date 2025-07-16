from openai import OpenAI
from typing import Any

from ai.ad_enhancer import AdEnhancerAI
from config.env import OPENAI_API_KEY, OPENAI_MODEL
from db.mongodb import DbCollection, db

client = OpenAI(api_key=OPENAI_API_KEY)

GENERAL_INSTRUCTIONS = """ 
            Rescrie titluri de anunțuri în stil profesionist și atractiv, în limba română.
            Adauga doar titlul rescris, fără explicații sau comentarii suplimentare.
            Fii concis si clar, pentru a atrage atenția utilizatorilor pe o platformă de anunțuri online.
            Sa fie cât mai profesional scris, ca un manager de marketing.
        """

class OpenAIAdEnhancer(AdEnhancerAI):
    """
    AI ad enhancer implementation using OpenAI (ChatGPT).
    """

    def enhance_ad_title(self, title: str, description: str = None) -> dict[str, Any]:
        prompt = (
            "Primești un titlu de anunț neformatat în limba română.\n"
            "Poti primi si descrierea anuntului si pe baza acesteia poti face un titlu potrivit daca nu primesti un titlu bun/relevant."
            "Rescrie-l într-un stil profesionist, natural și atractiv, potrivit pentru o platformă de anunțuri. "
            "Scrie titlul direct, fără ghilimele, fără explicații, fără comentarii sau justificări. Nu adăuga nimic altceva în afară de titlul final.\n\n"
            f"Descriere anunț (opțional): {description}\n"
            f"Titlu inițial: {title}\nTitlu rescris:"
        )

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system",
                 "content": GENERAL_INSTRUCTIONS},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=48
        )

        enhanced_title = response.choices[0].message.content.strip()
        duration_sec = response.response_ms / 1000 if hasattr(response, "response_ms") else 0

        return {
            "enhanced_title": enhanced_title,
            "original_title": title,
            "duration_sec": duration_sec,
        }


    def enhance_ad_description(self, description: str, min_chars: int = 200, title: str = None) -> dict[str, Any]:
        prompt = (
            "Primești o descriere scurtă pentru un anunț în limba română, scrisă de un utilizator.\n"
            "Primești și titlul anunțului, care poate fi folosit pentru a îmbunătăți descrierea.\n\n"
            "Rescrie descrierea într-un stil clar, profesionist și coerent, potrivit pentru o platformă de anunțuri online.\n\n"
            "Scrie doar descrierea rescrisă — fără explicații, comentarii, justificări sau texte auxiliare. "
            "Nu adăuga ghilimele. Nu adăuga introduceri precum „Aici este descrierea...” sau „Note: ...”. "
            "Poți să adaugi detalii suplimentare dacă este necesar, dar asigură-te că descrierea este coerentă și relevantă.\n"
            "De asemenea poți adauga când se termina o idee/ paragraf un enter pentru a face textul mai ușor de citit.\n"
            "Nu inventa detalii. Nu adăuga nimic în plus.\n\n"
            f"Titlu anunț (poate sa fie sau nu aici): {title}\n"
            f"Descriere inițială: {description}\nDescriere rescrisă:"
        )

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": GENERAL_INSTRUCTIONS},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=320 
        )

        enhanced_description = response.choices[0].message.content.strip()
        duration_sec = response.response_ms / 1000 if hasattr(response, "response_ms") else 0

        return {
            "enhanced_description": enhanced_description,
            "original_description": description,
            "duration_sec": duration_sec,
        }

    def moderate_ad(self, title: str, description: str) -> bool:
        prompt = (
            "Ești un moderator automat pentru o platformă de anunțuri online în limba română.\n"
            "Primești titlul și descrierea unui anunț scris de un utilizator. Scopul tău este să decizi dacă poate fi publicat sau nu.\n\n"
            "✅ Este permis:\n"
            "- Limbaj politicos sau informal\n"
            "- Publicitate de tip clasic\n"
            "- Descrieri scurte dar coerente\n\n"
            "⛔️ NU este permis:\n"
            "- Limbaj vulgar, injurii sau înjurături\n"
            "- Texte incoerente, aiurite, fără sens\n"
            "- Texte scrise integral cu majuscule\n"
            "- Greșeli grave de gramatică sau repetiții inutile\n"
            "- Informații ilegale sau instigatoare la ură\n\n"
            "Răspunde DOAR cu „DA” dacă poate fi publicat, sau „NU” dacă trebuie respins. Nu adăuga explicații.\n\n"
            f"Titlu: {title}\n"
            f"Descriere: {description}\n"
            "Poate fi publicat?"
        )

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Răspunde strict conform instrucțiunilor date. Nu adăuga alt text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=5
        )

        verdict = response.choices[0].message.content.strip().upper()
        return verdict == "DA"

    def guess_category_id(title: str) -> str | None:
        categories = list(db[DbCollection.CATEGORIES].find({"parentId": {"$ne": None}}))

        categories_prompt = "\n".join([f"- {cat['name']} (ID: {cat['_id']})" for cat in categories])

        prompt = (
            "Ești un asistent inteligent care ajută la clasificarea anunțurilor într-o platformă online.\n"
            "Ți se oferă titlul unui anunț și o listă de categorii secundare (cu denumiri și ID-uri).\n"
            "Trebuie să răspunzi cu ID-ul celei mai potrivite categorii pentru acel titlu.\n"
            "Răspunde DOAR cu un ID exact din listă, fără explicații sau alte cuvinte.\n\n"
            f"Titlu: {title}\n\n"
            f"Categorii disponibile:\n{categories_prompt}\n\n"
            "Cel mai potrivit ID este:"
        )

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Răspunde doar cu un ID din listă. Nu adăuga altceva."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=20
        )

        answer = response.choices[0].message.content.strip()
        matched_category = next((cat for cat in categories if str(cat['_id']) == answer), None)

        return str(matched_category['_id']) if matched_category else None

