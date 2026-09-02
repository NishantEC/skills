#!/usr/bin/env python3
"""Serve the approval UI for a workdir produced by extract.py.

Contact sheet + live player + a copyable settings object. Python stdlib only.
"""
import argparse
import http.server
import json
import os
import socketserver
import webbrowser

ap = argparse.ArgumentParser()
ap.add_argument("workdir")
ap.add_argument("--port", type=int, default=8722)
ap.add_argument("--title", default="ASCII frames")
ap.add_argument("--no-open", action="store_true")
a = ap.parse_args()

here = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(a.workdir, "frames.json")))
template = open(os.path.join(here, "review.html")).read()

page = (template
        .replace("__TITLE__", a.title)
        .replace("__COLS__", str(data["cols"]))
        .replace("__ROWS__", str(data["rows"]))
        .replace("__COUNT__", str(data["count"]))
        .replace("__DATA__", json.dumps({k: data[k] for k in ("cols", "rows", "count", "levels")})))


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = page.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", a.port), Handler) as httpd:
    url = f"http://127.0.0.1:{a.port}/"
    print(f"review: {url}")
    print("Tune the controls, press Copy, paste the settings object back to the agent.")
    print("Ctrl-C when done.")
    if not a.no_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
