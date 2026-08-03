import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import string

MODEL_PATH = "sentiment_model.pkl"

# Lightweight synthetic retail dataset
TRAIN_DATA = [
    # Positive
    ("Love this product, it is amazing", "Positive"),
    ("Great quality and fast delivery", "Positive"),
    ("The new winter collection is absolutely fantastic. The materials feel very premium and the fit is perfect.", "Positive"),
    ("Highly recommend this to everyone", "Positive"),
    ("Very satisfied with my purchase", "Positive"),
    ("Beautiful design, exactly as described", "Positive"),
    ("Exceptional customer service and great price", "Positive"),
    ("I am so happy with this buy", "Positive"),
    ("Works flawlessly and looks great", "Positive"),
    ("5 stars! Best thing I bought this year", "Positive"),
    ("i love it", "Positive"),
    ("i love it so much", "Positive"),
    ("love", "Positive"),
    ("absolutely love it", "Positive"),
    ("love this", "Positive"),
    ("i love it", "Positive"),
    ("i really love it", "Positive"),
    ("love it!", "Positive"),
    ("i love it", "Positive"),
    ("love it love it", "Positive"),
    
    # Negative
    ("I ordered a size M but received an XL. The return process is taking way too long. Very disappointed.", "Negative"),
    ("Terrible quality, broke after one use", "Negative"),
    ("Do not buy this, it's a scam", "Negative"),
    ("Shipping was horrible and the item was damaged", "Negative"),
    ("Very poor customer service", "Negative"),
    ("Waste of money, completely useless", "Negative"),
    ("I hate it, totally not what I expected", "Negative"),
    ("Worst experience ever", "Negative"),
    ("Never buying from this store again", "Negative"),
    ("The material feels cheap and it smells bad", "Negative"),
    ("not there", "Negative"),
    ("not", "Negative"),
    ("get lost", "Negative"),
    ("lost", "Negative"),
    
    # Neutral
    ("The shoes are okay. They look like the pictures but they run a bit narrow.", "Neutral"),
    ("It does the job, nothing special", "Neutral"),
    ("Average product for the price", "Neutral"),
    ("It's fine, not great but not terrible either", "Neutral"),
    ("Expected a bit more, but it is acceptable", "Neutral"),
    ("Standard quality, nothing to write home about", "Neutral"),
    ("It is exactly okay", "Neutral"),
    ("Met my expectations, no more no less", "Neutral"),
    ("Just a regular item", "Neutral"),
    ("Not bad, but I might look for alternatives next time", "Neutral"),
    ("hi", "Neutral"),
    ("hello", "Neutral"),
    ("hi there", "Neutral"),
    ("just hi", "Neutral"),
    ("hi", "Neutral"),
    ("hi", "Neutral"),
    ("hi", "Neutral"),
    ("hello", "Neutral")
]

class SentimentAnalyzer:
    def __init__(self):
        self.model = None
        self.load_or_train()

    def load_or_train(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
        else:
            self.train()

    def train(self):
        try:
            from datasets import load_dataset
            print("Loading tweet_eval sentiment dataset...")
            ds = load_dataset('cardiffnlp/tweet_eval', 'sentiment', split='train')
            label_map = {0: "Negative", 1: "Neutral", 2: "Positive"}
            
            X = list(ds['text'])
            y = [label_map[l] for l in ds['label']]
            print(f"Loaded {len(X)} examples from tweet_eval dataset.")
            
            # Combine with our manual TRAIN_DATA to retain custom overrides
            X.extend([item[0] for item in TRAIN_DATA])
            y.extend([item[1] for item in TRAIN_DATA])
        except Exception as e:
            print(f"Failed to load huggingface dataset, falling back: {e}")
            X = [item[0] for item in TRAIN_DATA]
            y = [item[1] for item in TRAIN_DATA]
        
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=10000)),
            ('clf', MultinomialNB())
        ])
        
        self.model.fit(X, y)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)

    def extract_keywords(self, text):
        from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
        stop_words = set(ENGLISH_STOP_WORDS).union({"there"})
        for w in ["not", "no", "never", "none", "very"]:
            stop_words.discard(w)
            
        translator = str.maketrans('', '', string.punctuation)
        clean_text = text.translate(translator).lower()
        words = [w for w in clean_text.split() if w not in stop_words and len(w) >= 2]
        return list(set(words))[:4]

    def map_emotion(self, sentiment, confidence):
        if sentiment == "Positive":
            if confidence > 85: return "Joy"
            return "Satisfaction"
        elif sentiment == "Negative":
            if confidence > 85: return "Anger"
            return "Disappointment"
        else:
            return "Indifference"

    def analyze(self, text: str):
        if not self.model:
            self.load_or_train()
            
        prediction = self.model.predict([text])[0]
        proba = self.model.predict_proba([text])[0]
        
        # Get confidence of the predicted class
        class_index = list(self.model.classes_).index(prediction)
        confidence = float(proba[class_index]) * 100
        
        emotion = self.map_emotion(prediction, confidence)
        keywords = self.extract_keywords(text)
        
        return {
            "sentiment": prediction,
            "confidence": round(confidence, 1),
            "emotion": emotion,
            "keywords": keywords
        }

analyzer = SentimentAnalyzer()
