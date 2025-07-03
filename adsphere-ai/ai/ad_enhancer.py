from abc import ABC
from typing import Any


class AdEnhancerAI(ABC):
    """
    Abstract base class for AI-driven ad enhancement.
    """

    def enhance_ad_title(self, title: str) -> dict[str, Any]:
        """
        Enhance the ad title using AI.

        :param title: The original ad title.
        :return: A dictionary containing the enhanced title and metadata.
        """
        raise NotImplementedError("This method should be implemented by subclasses.")

    def enhance_ad_description(self, title: str, description: str, min_chars: int = 200) -> dict[str, Any]:
        """
        Enhance the ad description using AI.

        :param title: The ad title, which can be used to improve the description.
        :param description: The original ad description.
        :param min_chars: Minimum number of characters for the enhanced description.
        :return: A dictionary containing the enhanced description and metadata.
        """
        raise NotImplementedError("This method should be implemented by subclasses.")