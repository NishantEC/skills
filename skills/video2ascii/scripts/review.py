#!/usr/bin/env python3
"""Serve the editor for a workdir produced by extract.py or generate.py.

Contact sheet + live player + every control that changes how the grid reads,
and a settings object to paste back to the agent. Python stdlib only.

Most controls are a pure function of `levels` in frames.json — one brightness
per cell — so they run in the page with no re-bake. Density is the exception:
changing the column count means resampling the source, which needs ffmpeg. That
is why this is a server and not a file:// page. `POST /rebake` re-runs the
command that produced the workdir with a different `--cols`.

Re-running a stored command is the same posture as `--expr` in generate.py:
this is a local authoring tool, pointed at a workdir you just made.
"""
import argparse
import json
import os
import shutil
import socketserver
import subprocess
import sys
import http.server
import webbrowser

ap = argparse.ArgumentParser()
ap.add_argument("workdir")
ap.add_argument("--port", type=int, default=8722)
ap.add_argument("--title", default="ASCII frames")
ap.add_argument("--no-open", action="store_true")
a = ap.parse_args()

here = os.path.dirname(os.path.abspath(__file__))
template = open(os.path.join(here, "review.html")).read()


def load():
    return json.load(open(os.path.join(a.workdir, "frames.json")))


def payload(data):
    """What the page needs. `art` and the atlas stay on disk — `levels` is the
    same information at one byte per cell and the page renders from that."""
    return {
        "cols": data["cols"],
        "rows": data["rows"],
        "count": data["count"],
        "fps": data.get("fps", 12),
        "levels": data["levels"],
        # Older workdirs predate `cmd`; the page hides density rather than
        # offering a control that cannot work.
        "canRebake": bool(data.get("cmd")),
    }


def render(data):
    return (template
            .replace("__TITLE__", a.title)
            .replace("__DATA__", json.dumps(payload(data))))


def rebake(cols):
    """Re-run the producing command at a new column count."""
    data = load()
    cmd = list(data.get("cmd") or ())
    if not cmd:
        raise RuntimeError("this workdir does not record how it was made")

    # Replace --cols if it is there, append it if not. Both scripts take it.
    if "--cols" in cmd:
        cmd[cmd.index("--cols") + 1] = str(cols)
    else:
        cmd += ["--cols", str(cols)]

    script = cmd[0]
    if not os.path.isabs(script):
        script = os.path.join(here, os.path.basename(script))
    argv = [sys.executable, script, *cmd[1:]]

    cwd = data.get("cwd") or os.getcwd()
    if not os.path.isdir(cwd):
        cwd = os.getcwd()

    # Keep the old frames.json until the new one is written, so a failed bake
    # leaves the workdir exactly as it was rather than half replaced.
    backup = os.path.join(a.workdir, "frames.json.bak")
    shutil.copy2(os.path.join(a.workdir, "frames.json"), backup)
    try:
        done = subprocess.run(argv, cwd=cwd, capture_output=True, text=True)
        if done.returncode != 0:
            shutil.copy2(backup, os.path.join(a.workdir, "frames.json"))
            raise RuntimeError((done.stderr or "").strip()[-400:] or "bake failed")
        return payload(load())
    finally:
        os.remove(backup)


class Handler(http.server.BaseHTTPRequestHandler):
    def _send(self, body, kind="application/json", code=200):
        self.send_response(code)
        self.send_header("Content-Type", f"{kind}; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(render(load()).encode(), "text/html")

    def do_POST(self):
        if self.path != "/rebake":
            return self._send(b'{"error":"not found"}', code=404)
        size = int(self.headers.get("Content-Length") or 0)
        try:
            cols = int(json.loads(self.rfile.read(size) or b"{}").get("cols", 84))
        except Exception:
            return self._send(b'{"error":"bad request"}', code=400)
        cols = max(16, min(400, cols))
        print(f"rebake at {cols} columns", flush=True)
        try:
            self._send(json.dumps(rebake(cols)).encode())
        except Exception as exc:
            self._send(json.dumps({"error": str(exc)}).encode(), code=500)

    def log_message(self, *_):
        pass


# Threading, because a rebake shells out to ffmpeg for a few seconds and a
# single-threaded server would stall every other request behind it.
class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(("127.0.0.1", a.port), Handler) as httpd:
    url = f"http://127.0.0.1:{a.port}/"
    print(f"review: {url}")
    print("Tune the controls, press Copy preset, paste it back to the agent.")
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
