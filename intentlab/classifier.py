"""Read-only model inference and transparent feature contributions."""
from functools import lru_cache
from pathlib import Path
import time
import joblib
import numpy as np
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from intentlab.nlp import tokenize, validate_text

ROOT = Path(__file__).resolve().parents[1]
MAX_BATCH = 25

@lru_cache(maxsize=1)
def load_model():
    # Load only the trusted artifact shipped with this application.
    return joblib.load(ROOT / "models/intent-model.joblib")

def analyze(text: str) -> dict:
    started = time.perf_counter()
    text = validate_text(text)
    artifact = load_model()
    pipeline = artifact["pipeline"]
    tfidf, estimator = pipeline.named_steps["tfidf"], pipeline.named_steps["model"]
    tokens = tokenize(text)
    vector = tfidf.transform([text])
    probabilities = estimator.predict_proba(vector)[0]
    ranking = np.argsort(probabilities)[::-1]
    best = int(ranking[0])
    score = float(probabilities[best])
    margin = score - float(probabilities[ranking[1]])
    content_tokens = [t for t in tokens if t not in ENGLISH_STOP_WORDS]
    coverage = sum(t in tfidf.vocabulary_ for t in content_tokens) / max(1, len(content_tokens))
    reason = None
    if vector.nnz == 0 or coverage < .35:
        reason = "This message has too little overlap with the customer-support vocabulary. Try a specific support request."
    elif len(tokens) < 3:
        reason = "Add a little more detail so the model can identify your request."
    elif score < artifact["threshold"] or margin < .15:
        reason = "Several intents are plausible. Describe one request at a time or add more detail."
    if hasattr(estimator, "coef_"):
        weights = estimator.coef_[best]
        method = "TF-IDF × class coefficient"
    else:
        logs = estimator.feature_log_prob_
        weights = logs[best] - np.delete(logs, best, axis=0).mean(axis=0)
        method = "TF-IDF × log-likelihood contrast against the other classes"
    features = tfidf.get_feature_names_out()
    evidence = [{"term": str(features[i]), "contribution": round(float(vector[0, i] * weights[i]), 6)}
                for i in vector.indices if abs(vector[0, i] * weights[i]) > .000001]
    evidence.sort(key=lambda e: abs(e["contribution"]), reverse=True)
    labels = artifact["report"]["intents"]
    return {"text": text, "status": "uncertain" if reason else "classified", "reason": reason,
            "intent": str(estimator.classes_[best]) if not reason else None,
            "label": labels[str(estimator.classes_[best])] if not reason else "Needs clarification",
            "score": round(score, 6), "margin": round(margin, 6), "coverage": round(coverage, 6),
            "predictions": [{"intent": str(estimator.classes_[i]), "label": labels[str(estimator.classes_[i])],
                             "score": round(float(probabilities[i]), 6)} for i in ranking[:3]],
            "tokens": tokens, "normalized": " ".join(tokens), "evidence": evidence[:8],
            "explanation_method": method, "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
            "model": artifact["report"]["selected_model"], "version": artifact["report"]["version"]}

def classify_payload(payload: object) -> dict:
    if not isinstance(payload, dict) or not isinstance(payload.get("texts"), list):
        raise ValueError("Send a JSON object with a texts array.")
    texts = payload["texts"]
    if not 1 <= len(texts) <= MAX_BATCH:
        raise ValueError(f"Analyze between 1 and {MAX_BATCH} messages at a time.")
    # Validate the entire batch before starting inference.
    validated = [validate_text(text) for text in texts]
    return {"results": [analyze(text) for text in validated]}
