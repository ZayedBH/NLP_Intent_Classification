"""Shared Vercel and local HTTP handler; no framework dependency."""
from http.server import BaseHTTPRequestHandler
import json
import logging
from intentlab.classifier import classify_payload, load_model

MAX_BODY = 220_000  # 25 × 2,000 Unicode characters, including JSON encoding overhead.

class handler(BaseHTTPRequestHandler):
    def respond(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] != "/api/health":
            return self.respond(404, {"error": "Endpoint not found."})
        try:
            report = load_model()["report"]
            self.respond(200, {"status": "ready", "version": report["version"], "model": report["selected_model"]})
        except Exception:
            logging.exception("Model initialization failed")
            self.respond(503, {"error": "The classifier could not start. Try again shortly."})

    def do_POST(self):
        if self.path.split("?")[0] != "/api/classify":
            return self.respond(404, {"error": "Endpoint not found."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_BODY:
                # Drain only a bounded amount so a just-over-limit body does not
                # race the error response with a Windows TCP connection reset.
                if length > 0:
                    self.rfile.read(min(length, MAX_BODY + 1))
                return self.respond(413, {"error": "The request is empty or too large."})
            raw = self.rfile.read(length)
            if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
                return self.respond(415, {"error": "Use application/json for this endpoint."})
            payload = json.loads(raw.decode("utf-8"))
            result = classify_payload(payload)
        except (ValueError, UnicodeDecodeError):
            # Validation messages are controlled by our parser, not model internals.
            import sys
            error = sys.exc_info()[1]
            message = "Send valid JSON." if isinstance(error, (json.JSONDecodeError, UnicodeDecodeError)) else str(error)
            return self.respond(400, {"error": message})
        except Exception:
            logging.exception("Classification failed")
            return self.respond(503, {"error": "The classifier is temporarily unavailable. Try again shortly."})
        self.respond(200, result)

    def do_OPTIONS(self):
        self.respond(405, {"error": "Use GET /api/health or POST /api/classify."})

    do_PUT = do_OPTIONS
    do_DELETE = do_OPTIONS
    do_PATCH = do_OPTIONS

    def log_message(self, format, *args):
        # Never log the message body.
        logging.info(format, *args)
