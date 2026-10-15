import json
import threading
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import pytest

@pytest.fixture(params=["intentlab.http", "api.classify", "api.health"])
def endpoint(request):
    from importlib import import_module
    handler = import_module(request.param).handler
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()
    server.server_close()
    thread.join()

def request(endpoint, path, body=None, content_type="application/json", method=None):
    data = body.encode() if body is not None else None
    req = Request(endpoint + path, data=data, headers={"Content-Type": content_type}, method=method)
    try:
        response = urlopen(req, timeout=30)
    except HTTPError as error:
        response = error
    with response:
        return response.status, json.load(response), response.headers

def test_live_batch_keeps_input_order(endpoint):
    texts = ["Please cancel my order", "I forgot my password and cannot log in"]
    status, body, headers = request(endpoint, "/api/classify", json.dumps({"texts": texts}))
    assert status == 200
    assert [r["text"] for r in body["results"]] == texts
    assert [r["intent"] for r in body["results"]] == ["cancel_order", "recover_password"]
    assert headers["Cache-Control"] == "no-store"

@pytest.mark.parametrize("body", ['{broken', '{"texts": [""]}', '{"texts": [null]}', 'null'])
def test_invalid_json_or_payload_returns_client_error(endpoint, body):
    status, result, _ = request(endpoint, "/api/classify", body)
    assert status == 400
    assert result["error"]

def test_body_limit(endpoint):
    status, _, _ = request(endpoint, "/api/classify", "x" * 220001)
    assert status == 413

def test_content_type(endpoint):
    status, _, _ = request(endpoint, "/api/classify", '{}', "text/plain")
    assert status == 415

def test_health_and_missing_endpoint(endpoint):
    status, body, _ = request(endpoint, "/api/health")
    assert status == 200 and body["status"] == "ready"
    status, _, _ = request(endpoint, "/api/missing")
    assert status == 404

def test_method_not_allowed(endpoint):
    status, _, _ = request(endpoint, "/api/classify", "{}", method="PUT")
    assert status == 405
