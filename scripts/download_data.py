"""Download a pinned, public Bitext dataset and its original data license."""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPO = "bitext/customer-support-llm-chatbot-training-dataset"
REVISION = "72ea2203180d14a416b579c657033ecd21e59a11"

def main():
    revision = REVISION
    base = f"https://raw.githubusercontent.com/{REPO}/{revision}"
    targets = {
        "data/Bitext_Sample_Customer_Support_Training_Dataset_27K_responses-v11.csv": ROOT / "data/raw/bitext.csv",
        "LICENSE.txt": ROOT / "data/LICENSE-BITEXT.txt",
        "README.md": ROOT / "data/BITEXT-README.md",
    }
    hashes = {}
    for source, target in targets.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(f"{base}/{source}", timeout=60) as response:
            content = response.read()
        target.write_bytes(content)
        hashes[source] = hashlib.sha256(content).hexdigest()
        print(f"Downloaded {target.name}: {len(content):,} bytes")
    (ROOT / "data/provenance.json").write_text(json.dumps({
        "repository": f"https://github.com/{REPO}", "revision": revision,
        "license": "CDLA-Sharing-1.0", "sha256": hashes,
        "origin": "Bitext hybrid synthetic customer-support dataset; not live customer conversations",
    }, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
