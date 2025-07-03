import json
from typing import Any
import requests

from ai.ad_enhancer import AdEnhancerAI
from config.env import OLLAMA_API, OLLAMA_MODEL

class OllamaAdEnhancer(AdEnhancerAI):
    """
    AI ad enhancer implementation using Ollama.
    """

    def enhance_ad_title(self, title: str) -> dict[str, Any]:
        prompt = f"""
        Primești un titlu de anunț neformatat în limba română.
        
        Rescrie-l într-un stil profesionist, natural și atractiv, potrivit pentru o platformă de anunțuri. Scrie titlul direct, fără ghilimele, fără explicații, fără comentarii sau justificări. Nu adăuga nimic altceva în afară de titlul final.
        
        Titlu inițial: {title}
        Titlu rescris:
        """

        response = requests.post(OLLAMA_API, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        })

        response_json = json.loads(response.text)
        if response.status_code == 404 and "error" in response_json:
            raise Exception(f"OLLAMA server error: {response_json['error']}")

        return {
            "enhanced_title": response_json.get("response", "").strip(),
            "original_title": title,
            "duration_sec": round(response_json.get("total_duration", 0) / 1_000_000_000, 3),
        }

    def enhance_ad_description(self, description: str, min_chars: int = 200) -> dict[str, Any]:
        prompt = f"""
        Primești o descriere scurtă pentru un anunț în limba română, scrisă de un utilizator.

        Rescrie descrierea într-un stil clar, profesionist și coerent, potrivit pentru o platformă de anunțuri online.

        Scrie doar descrierea rescrisă — fără explicații, comentarii, justificări sau texte auxiliare. Nu adăuga ghilimele. Nu adăuga introduceri precum „Aici este descrierea...” sau „Note: ...”. Nu inventa detalii. Nu adăuga nimic în plus.

        Descriere inițială: {description}
        Descriere rescrisă:
        """

        response = requests.post(OLLAMA_API, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        })

        response_json = json.loads(response.text)
        if response.status_code == 404 and "error" in response_json:
            raise Exception(f"OLLAMA server error: {response_json['error']}")

        return {
            "enhanced_description": response_json.get("response", "").strip(),
            "original_description": description,
            "duration_sec": round(response_json.get("total_duration", 0) / 1_000_000_000, 3),
        }
