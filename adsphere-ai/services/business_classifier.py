from joblib import load

import os

from ml.train_business_classifier import preprocess

model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "trained_models", "business_classifier.joblib")
model = load(model_path)

def predict_user_type(title: str, description: str) -> dict:
    text = preprocess(title + " " + description)
    prediction = model.predict([text])[0]
    probability = model.predict_proba([text])[0]
    return {
        "prediction": prediction,
        "probability": {
            "non-business": float(probability[0]),
            "business": float(probability[1])
        }
    }