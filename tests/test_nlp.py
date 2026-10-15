import pytest

def test_nltk_tokens_preserve_negation():
    from intentlab.nlp import tokenize
    assert tokenize("  I CANNOT log in!  ") == ["i", "cannot", "log", "in"]

def test_punctuation_only_has_no_tokens():
    from intentlab.nlp import tokenize
    assert tokenize("?! ...") == []

def test_template_groups_ignore_entity_values():
    from intentlab.nlp import template_key
    assert template_key("track order {{Order Number}}") == template_key("TRACK order {{Order ID}}!")

@pytest.mark.parametrize("value", ["", "   ", "?!!", "a" * 2001, None, 123])
def test_invalid_message_is_rejected(value):
    from intentlab.nlp import validate_text
    with pytest.raises(ValueError):
        validate_text(value)

def test_valid_message_is_trimmed():
    from intentlab.nlp import validate_text
    assert validate_text("  Where is my order?  ") == "Where is my order?"
