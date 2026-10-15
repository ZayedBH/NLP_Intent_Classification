"""Package all project inputs and verify every archived file against its hash."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIRECTORIES = {"src", "intentlab", "api", "scripts", "tests", "e2e", "public", "models", "data", "docs"}
ROOT_FILES = {"package.json", "package-lock.json", "requirements.txt", "requirements-dev.txt", "tsconfig.json",
              "vite.config.ts", "playwright.config.ts", "pytest.ini", "vercel.json", "index.html",
              ".python-version", ".gitignore", "README.md", "START_HERE_ZAYED.md"}

def main():
    destination = ROOT / "delivery"
    destination.mkdir(exist_ok=True)
    files = sorted(p for p in ROOT.rglob("*") if p.is_file()
                   and (p.relative_to(ROOT).parts[0] in DIRECTORIES or p.name in ROOT_FILES and p.parent == ROOT)
                   and "__pycache__" not in p.parts and p.suffix not in {".pyc", ".log"})
    manifest = {str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    archive = destination / "IntentLab_Zayed_NLP_Project.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as out:
        for source in files:
            out.write(source, "IntentLab/" + source.relative_to(ROOT).as_posix())
        out.writestr("IntentLab/PACKAGE_MANIFEST.json", json.dumps(manifest, indent=2))
    with zipfile.ZipFile(archive) as packaged:
        assert packaged.testzip() is None
        for path, expected in manifest.items():
            assert hashlib.sha256(packaged.read("IntentLab/" + path)).hexdigest() == expected
        forbidden = ("node_modules/", ".venv/", "__pycache__/", "test-results/", "dist/")
        assert not any(any(part in name for part in forbidden) for name in packaged.namelist())
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    receipt = {"archive": archive.name, "bytes": archive.stat().st_size, "source_files": len(files),
               "sha256": checksum, "integrity": "All archived inputs match project files; ZIP CRC check passed."}
    (destination / "package-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    # Smaller independently valid ZIPs avoid large connector request bodies.
    for name, include_raw in [("IntentLab_Source_and_Model.zip", False), ("IntentLab_Original_Dataset.zip", True)]:
        selected = [p for p in files if (p.relative_to(ROOT).as_posix().startswith("data/raw/")) == include_raw]
        target = destination / name
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as out:
            for source in selected:
                out.write(source, "IntentLab/" + source.relative_to(ROOT).as_posix())
            if not include_raw:
                out.writestr("IntentLab/PACKAGE_MANIFEST.json", json.dumps(manifest, indent=2))
        with zipfile.ZipFile(target) as packaged:
            assert packaged.testzip() is None
            for source in selected:
                key = source.relative_to(ROOT).as_posix()
                assert hashlib.sha256(packaged.read("IntentLab/" + key)).hexdigest() == manifest[key]
        print(json.dumps({"archive": name, "bytes": target.stat().st_size,
                          "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}))

if __name__ == "__main__":
    main()
