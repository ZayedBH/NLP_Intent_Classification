"""NLTK preprocessing requiring no downloaded corpora."""
import re
from nltk.tokenize import TreebankWordTokenizer

_TOKENIZER = TreebankWordTokenizer()
MAX_TEXT_LENGTH = 2000

def tokenize(text: str) -> list[str]:
    normalized = re.sub(r"\{\{.*?\}\}", " entity ", text.lower())
    # Keep negation intact rather than discarding it as a stopword.
    normalized = re.sub(r"\bcannot\b", "can not", normalized)
    tokens = _TOKENIZER.tokenize(normalized)
    result = [token for token in tokens if any(c.isalpha() for c in token)]
    # Treebank splits cannot into can/not; recombine for consistent evidence.
    return ["cannot" if token == "can" and i + 1 < len(result) and result[i + 1] == "not"
            else token for i, token in enumerate(result)
            if not (token == "not" and i > 0 and result[i - 1] == "can")]

def template_key(text: str) -> str:
    normalized = re.sub(r"\{\{.*?\}\}", " entity ", text.lower())
    normalized = re.sub(r"\d+", " number ", normalized)
    return " ".join(re.findall(r"[a-z]+", normalized))

def validate_text(text: object) -> str:
    if not isinstance(text, str):
        raise ValueError("Each message must be text.")
    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(f"Keep each message under {MAX_TEXT_LENGTH + 1:,} characters.")
    trimmed = text.strip()
    if not trimmed or not tokenize(trimmed):
        raise ValueError("Enter a message containing at least one word.")
    return trimmed
