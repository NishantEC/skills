#!/usr/bin/env python3
"""Locate the subject by luminance and print an ffmpeg crop string.

Assumes a bright subject on a dark background (the easiest case to isolate).
For a dark subject on a light background pass --invert.
"""
import argparse
import subprocess
import sys

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--start", type=float, default=0.0)
ap.add_argument("--dur", type=float, default=6.0)
ap.add_argument("--threshold", type=float, default=0.16, help="fraction of peak counted as subject")
ap.add_argument("--pad", type=float, default=1.14, help="expand the square around the subject")
ap.add_argument("--invert", action="store_true")
a = ap.parse_args()

N = 160
cmd = ["ffmpeg", "-v", "error", "-ss", str(a.start), "-t", str(a.dur), "-i", a.video,
       "-vf", f"fps=4,scale={N}:{N},format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
raw = subprocess.run(cmd, capture_output=True).stdout
if not raw:
    sys.exit("ERROR: no frames decoded - check the path, --start and --dur")
if a.invert:
    raw = bytes(255 - v for v in raw)

frames = len(raw) // (N * N)
peak = max(raw)
thr = peak * a.threshold
x0, y0, x1, y1 = N, N, 0, 0
for f in range(frames):
    b = raw[f * N * N:(f + 1) * N * N]
    for y in range(N):
        row = b[y * N:(y + 1) * N]
        for x in range(N):
            if row[x] > thr:
                x0 = min(x0, x); x1 = max(x1, x)
                y0 = min(y0, y); y1 = max(y1, y)
if x1 <= x0:
    sys.exit("ERROR: no subject found - lower --threshold, or try --invert")

meta = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                       "-show_entries", "stream=width,height", "-of", "csv=p=0", a.video],
                      capture_output=True, text=True).stdout.strip().split(",")
SW, SH = int(meta[0]), int(meta[1])
fx, fy = SW / N, SH / N
bx0, bx1, by0, by1 = x0 * fx, (x1 + 1) * fx, y0 * fy, (y1 + 1) * fy
cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
side = min(max(bx1 - bx0, by1 - by0) * a.pad, SW, SH)
X = max(0, min(SW - side, cx - side / 2))
Y = max(0, min(SH - side, cy - side / 2))

print(f"{int(side)}:{int(side)}:{int(X)}:{int(Y)}")
print(f"# peak={peak} frames={frames} bbox={int(bx0)},{int(by0)}-{int(bx1)},{int(by1)}", file=sys.stderr)
