"""Reproducible grouped evaluation and model export. Never runs during serving."""
import csv
import hashlib
import json
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import joblib
import numpy as np
from scipy.sparse.csgraph import connected_components
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from intentlab.nlp import tokenize, template_key

INTENTS = {
    "track_order": "Track order", "cancel_order": "Cancel order",
    "check_refund_policy": "Refund policy", "get_refund": "Request refund",
    "payment_issue": "Payment issue", "recover_password": "Account access",
    "get_invoice": "Get invoice", "contact_human_agent": "Contact support",
}
# Returns/product information are absent. Use refund policy/invoice instead.
SOURCE_MAP = {"track_order": "track_order", "cancel_order": "cancel_order",
              "check_refund_policy": "check_refund_policy", "get_refund": "get_refund",
              "payment_issue": "payment_issue", "recover_password": "recover_password",
              "get_invoice": "get_invoice", "contact_human_agent": "contact_human_agent"}

def grouped_split(rows: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    """Entity/number-normalized identical templates always share a partition."""
    groups = {}
    for row in rows:
        key = (row["label"], row.get("group", template_key(row["text"])))
        groups.setdefault(key, []).append(row)
    keys = sorted(groups)
    train_keys, held_keys = train_test_split(keys, test_size=.3, random_state=42,
                                           stratify=[key[0] for key in keys])
    validation_keys, test_keys = train_test_split(held_keys, test_size=.5, random_state=42,
                                                 stratify=[key[0] for key in held_keys])
    return tuple([row for key in partition for row in groups[key]]
                 for partition in [train_keys, validation_keys, test_keys])

def near_duplicate_groups(rows):
    """Cluster char-trigram cosine similarity >= .92 within each label.

    Similarity features are used only for partition grouping, not model training.
    This reduces template leakage but cannot recover unknown original seed IDs.
    """
    for label in sorted({r["label"] for r in rows}):
        subset = [r for r in rows if r["label"] == label]
        keys = sorted({template_key(r["text"]) for r in subset})
        vectors = TfidfVectorizer(analyzer="char", ngram_range=(3, 3)).fit_transform(keys)
        nn = NearestNeighbors(metric="cosine", radius=.08, algorithm="brute").fit(vectors)
        graph = nn.radius_neighbors_graph(vectors, mode="connectivity")
        _, components = connected_components(graph, directed=False)
        lookup = dict(zip(keys, components.tolist()))
        for row in subset:
            row["group"] = str(lookup[template_key(row["text"])])

def metrics(model, rows):
    true = [r["label"] for r in rows]
    predicted = model.predict([r["text"] for r in rows])
    labels = list(model.classes_)
    return {"accuracy": float(accuracy_score(true, predicted)),
            "macro_f1": float(f1_score(true, predicted, average="macro")),
            "per_intent": classification_report(true, predicted, labels=labels, output_dict=True, zero_division=0),
            "confusion_matrix": confusion_matrix(true, predicted, labels=labels).tolist(),
            "labels": labels}

def main():
    source = ROOT / "data/raw/bitext.csv"
    if not source.exists():
        raise SystemExit("Run python scripts/download_data.py first.")
    rows, seen = [], set()
    with source.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row["intent"] not in SOURCE_MAP:
                continue
            label = SOURCE_MAP[row["intent"]]
            key = (label, row["instruction"].strip().lower())
            if key not in seen:
                rows.append({"text": row["instruction"], "label": label})
                seen.add(key)
    present = {r["label"] for r in rows}
    if present != set(INTENTS):
        raise SystemExit(f"Dataset labels differ from planned labels: missing {set(INTENTS) - present}")
    near_duplicate_groups(rows)
    train, validation, test = grouped_split(rows)
    X, y = [r["text"] for r in train], [r["label"] for r in train]
    candidates, validation_results = {}, {}
    for name, estimator in [("Logistic Regression", LogisticRegression(C=4, max_iter=1000, random_state=42)),
                            ("Multinomial Naive Bayes", MultinomialNB(alpha=.3))]:
        pipeline = Pipeline([("tfidf", TfidfVectorizer(tokenizer=tokenize, token_pattern=None,
                              lowercase=False, ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
                             ("model", estimator)])
        pipeline.fit(X, y)
        candidates[name] = pipeline
        validation_results[name] = metrics(pipeline, validation)
    best = max(candidates, key=lambda name: validation_results[name]["macro_f1"])
    chosen = candidates[best]
    probabilities = chosen.predict_proba([r["text"] for r in validation])
    predicted = chosen.classes_[probabilities.argmax(axis=1)]
    correct = predicted == np.array([r["label"] for r in validation])
    threshold_trials = []
    for threshold in [.4, .45, .5, .55, .6, .65, .7, .75, .8]:
        accepted = probabilities.max(axis=1) >= threshold
        precision = float(correct[accepted].mean()) if accepted.any() else 0.
        threshold_trials.append({"threshold": threshold, "accepted_accuracy": precision,
                                 "coverage": float(accepted.mean())})
    eligible = [t for t in threshold_trials if t["accepted_accuracy"] >= .97]
    threshold = max(eligible, key=lambda t: t["coverage"])["threshold"] if eligible else .65
    report = {
        "version": "1.0.0", "dataset": "Bitext customer-support 27K (eight-intent subset)",
        "synthetic": True, "source": json.loads((ROOT / "data/provenance.json").read_text(encoding="utf-8")),
        "selected_model": best, "intents": INTENTS, "seed": 42,
        "counts": {"total": len(rows), "train": len(train), "validation": len(validation), "test": len(test)},
        "distribution": dict(Counter(r["label"] for r in rows)),
        "split_method": "70/15/15 stratified template-group split; normalized entities/numbers; within-intent char-trigram cosine >= 0.92 connected components",
        "unique_groups": len({(r["label"], r["group"]) for r in rows}),
        "validation": validation_results, "test": {name: metrics(model, test) for name, model in candidates.items()},
        "threshold": threshold, "threshold_trials": threshold_trials,
        "uncertainty": {"minimum_margin": .15, "minimum_vocabulary_coverage": .35,
                        "note": "Content vocabulary coverage excludes common English stopwords. These are heuristics, not a validated out-of-domain detector. Threshold tuned on in-domain validation only."},
        "limitations": ["Hybrid synthetic data can overestimate real-world performance.",
                        "Near-duplicate grouping cannot guarantee separation of all related original templates.",
                        "English only; eight intents; unfamiliar and multi-intent messages may be misclassified.",
                        "Probabilities are uncalibrated model estimates; uncertainty heuristics may miss unsupported requests."],
    }
    (ROOT / "models").mkdir(exist_ok=True)
    joblib.dump({"pipeline": chosen, "threshold": threshold, "report": report}, ROOT / "models/intent-model.joblib", compress=3)
    (ROOT / "public/model-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    # Retain the subset and actual partitions for reproducibility and error analysis.
    (ROOT / "data/subset.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
    (ROOT / "data/splits.json").write_text(json.dumps({"train": train, "validation": validation, "test": test}, ensure_ascii=False), encoding="utf-8")
    errors = []
    for row, prediction in zip(test, chosen.predict([r["text"] for r in test])):
        if prediction != row["label"]:
            errors.append({**row, "predicted": str(prediction)})
    (ROOT / "data/test-errors.json").write_text(json.dumps(errors, indent=2), encoding="utf-8")
    print(json.dumps({"model": best, "counts": report["counts"], "threshold": threshold,
                      "test": {name: {key: value[key] for key in ["accuracy", "macro_f1"]} for name, value in report["test"].items()}}, indent=2))

if __name__ == "__main__":
    main()
