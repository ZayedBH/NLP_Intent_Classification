"""Run the same API handler locally; Vite proxies /api to this server."""
import sys
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from intentlab.http import handler
from intentlab.classifier import load_model

if __name__ == "__main__":
    load_model()
    print("IntentLab API ready at http://127.0.0.1:8000", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8000), handler).serve_forever()
