from typing import Optional

from pydantic import BaseModel

from ai.openai_ad_enhancer import OpenAIAdEnhancer

class TitleRequest(BaseModel):
    title: str
    description: str

class DescriptionRequest(BaseModel):
    title: str
    description: str
    min_chars: int = 200

ad_enhancer = OpenAIAdEnhancer()