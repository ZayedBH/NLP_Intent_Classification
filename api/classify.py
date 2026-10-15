"""Vercel entrypoint with an explicit, discoverable HTTP handler."""
from http.server import BaseHTTPRequestHandler
from intentlab.http import handler as SharedHandler


class handler(BaseHTTPRequestHandler):
    respond = SharedHandler.respond
    do_GET = SharedHandler.do_GET
    do_POST = SharedHandler.do_POST
    do_OPTIONS = SharedHandler.do_OPTIONS
    do_PUT = SharedHandler.do_PUT
    do_DELETE = SharedHandler.do_DELETE
    do_PATCH = SharedHandler.do_PATCH
    log_message = SharedHandler.log_message
