import pytest

def test_track_order_prediction_is_explainable():
    from intentlab.classifier import analyze
    result = analyze("Where is my order? I need to track my package.")
    assert result["predictions"][0]["intent"] == "track_order"
    assert result["status"] == "classified"
    assert len(result["predictions"]) == 3
    assert result["evidence"]
    assert any(e["contribution"] > 0 for e in result["evidence"])
    assert "track" in result["tokens"]
    assert 0 <= result["score"] <= 1

@pytest.mark.parametrize("text", ["Tell me about black holes in the universe", "flibbertigibbet quux zzzz", "hello"])
def test_unrelated_or_insufficient_messages_need_clarification(text):
    from intentlab.classifier import analyze
    result = analyze(text)
    assert result["status"] == "uncertain"
    assert result["reason"]

def test_model_contributions_are_actual_coefficients():
    from intentlab.classifier import analyze, load_model
    result = analyze("I want to cancel my order")
    model = load_model()["pipeline"]
    vector = model.named_steps["tfidf"].transform([result["text"]])
    estimator = model.named_steps["model"]
    import numpy as np
    class_index = list(estimator.classes_).index(result["predictions"][0]["intent"])
    if hasattr(estimator, "coef_"):
        coefficients = estimator.coef_
    else:
        log_prob = estimator.feature_log_prob_
        coefficients = np.stack([log_prob[i] - np.delete(log_prob, i, axis=0).mean(axis=0) for i in range(len(estimator.classes_))])
    features = model.named_steps["tfidf"].get_feature_names_out()
    for item in result["evidence"]:
        index = np.where(features == item["term"])[0][0]
        assert item["contribution"] == pytest.approx(float(vector[0, index] * coefficients[class_index, index]), abs=1e-6)

def test_batch_is_bounded_and_atomic():
    from intentlab.classifier import classify_payload
    with pytest.raises(ValueError):
        classify_payload({"texts": ["track order"] * 26})
    with pytest.raises(ValueError):
        classify_payload({"texts": ["track order", ""]})

@pytest.mark.parametrize("payload", [None, [], {}, {"texts": "hello"}, {"texts": []}, {"texts": [4]}])
def test_payload_validation(payload):
    from intentlab.classifier import classify_payload
    with pytest.raises(ValueError):
        classify_payload(payload)
