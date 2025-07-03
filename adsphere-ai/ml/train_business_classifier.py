import re
import pandas as pd
from joblib import dump
from matplotlib import pyplot as plt

def preprocess(text):
    if not isinstance(text, str):
        text = str(text)

    # Convert to lowercase
    text = text.lower()

    preserved = re.findall(r"\b\S+@\S+\.\w+\b", text) + re.findall(r"\b\S+\.(ro|com|net|biz|shop)\b", text)

    # Remove punctuation (keep only letters, numbers, spaces)
    text = re.sub(r"[^\w\s]", "", text)

    # Remove line breaks, tabs, multiple spaces
    text = re.sub(r"[\n\r\t]+", " ", text)
    text = re.sub(r"\s+", " ", text)

    text += " " + " ".join(preserved)
    # Trim leading/trailing spaces
    return text.strip()

def train_model():
    # ---------- Load dataset ----------
    df = pd.read_csv("./datasets/ads_business.csv")

    # Combine title + description
    df["text"] = df["title"].fillna("").apply(preprocess) + " " + df["description"].fillna("").apply(preprocess)
    df["business"] = df["business"].fillna("Unknown")

    # Optional: visualize distribution
    business_counts = df["business"].value_counts()

    plt.figure(figsize=(6, 6))
    plt.pie(
        business_counts,
        labels=business_counts.index,
        autopct='%1.1f%%',
        colors=['#66b3ff', '#ff9999'],
        startangle=90
    )
    plt.title("Distribuția anunțurilor Business vs Non-Business")
    plt.axis('equal')
    plt.tight_layout()
    plt.show()

    # ---------- Train/test split ----------
    from sklearn.model_selection import train_test_split
    X = df["text"]
    y = df["business"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # ---------- Build and train model ----------
    from sklearn.pipeline import make_pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB

    model = make_pipeline(TfidfVectorizer(), MultinomialNB())
    model.fit(X_train, y_train)

    # ---------- Evaluate ----------
    from sklearn.metrics import classification_report
    y_pred = model.predict(X_test)
    print("\n=== Classification Report ===\n")
    print(classification_report(y_test, y_pred))

    # ---------- Save model ----------

    dump(model, "./trained_models/business_classifier.joblib")
    print("\n✅ Model saved in ml/models/business_classifier.joblib")

    # ---------- Example predictions ----------

    examples = [
        """VÂNZARE DIRECTĂ - Telefon iPhone 15 Pro Max 256GB Nou Sigilat
        Telefonul este disponibil în magazinul nostru din București.
        Se oferă factură fiscală și garanție 24 luni.
        Livrare rapidă oriunde în țară, produs 100% original, cutie sigilată.
        Plată cu cardul sau numerar. Pentru comenzi mari oferim discount.
        Pentru comenzi: contact@magazinexpert.ro""",

        """Vând bicicletă mountain bike, stare foarte bună, folosită ocazional.
        Se oferă doar bicicleta, fără accesorii. Preț negociabil, predare doar în București.""",

        """Laptop Dell XPS 13 – Stare Impecabilă, Factură și Garanție
        Produs verificat și certificat de echipa noastră tehnică. Se oferă factură fiscală și garanție 12 luni.
        Livrare în toată țara prin curier, cu plata cu cardul. Disponibil în showroom-ul nostru din București.
        Contact: contact@magazintehnic.ro"""
    ]

    print("\n=== Exemple de predicții ===\n")
    for i, example in enumerate(examples, 1):
        preprocessed = preprocess(example)
        prediction = model.predict([preprocessed])[0]
        probability = model.predict_proba([preprocessed])[0]
        print(f"Exemplul {i} → Predicție: {prediction} | Probabilități: {probability}")

if __name__ == "__main__":
    train_model()