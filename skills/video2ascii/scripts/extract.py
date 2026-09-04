#!/usr/bin/env python3
"""Video -> ASCII frames.

Writes two artefacts into <workdir>:
  atlas.png    grayscale sprite sheet, one tile per frame (this is what ships)
  frames.json  {cols, rows, count, tileX, levels[], art[]} for the review UI
"""
import argparse
import json
import math
import os
import subprocess
import sys

LEVELS = "0123456789abcdef"

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("workdir")
ap.add_argument("--crop", required=True, help="W:H:X:Y from autocrop.py")
ap.add_argument("--start", type=float, default=0.0)
ap.add_argument("--dur", type=float, default=8.0)
ap.add_argument("--frames", type=int, default=48)
ap.add_argument("--cols", type=int, default=84)
ap.add_argument("--mode", default="lum", choices=["lum", "invlum", "chroma"],
                help="lum=bright subject on dark  invlum=dark on light  chroma=warm subject")
ap.add_argument("--floor", type=float, default=0.06, help="below this fraction of peak -> empty")
ap.add_argument("--gamma", type=float, default=1.0, help="<1 lifts midtones, >1 deepens them")
ap.add_argument("--ramp", default=" .:-=+*#%@")
ap.add_argument("--pad", type=float, default=1.0, help=">1 shrinks the subject in frame")
a = ap.parse_args()

cw, ch = (int(v) for v in a.crop.split(":")[:2])
rows = max(1, round(a.cols * 0.6 * ch / cw))
fps = a.frames / a.dur
os.makedirs(a.workdir, exist_ok=True)

# The mode transform lives in the ffmpeg chain, NOT in Python, so that atlas.png
# and frames.json are always derived from identical pixels.
MODE_FILTER = {
    "lum": "",
    "invlum": "negate,",
    "chroma": ("colorchannelmixer="
               "rr=1:rg=-0.5:rb=-0.5:gr=1:gg=-0.5:gb=-0.5:br=1:bg=-0.5:bb=-0.5,"),
}
chain = [f"crop={a.crop}"]
if a.pad > 1.0:
    p = int(cw * a.pad)
    chain.append(f"pad={p}:{p}:({p}-iw)/2:({p}-ih)/2:color=black")
chain += [f"fps={fps}", f"scale={a.cols}:{rows}:flags=area"]
vf = ",".join(chain) + "," + MODE_FILTER[a.mode] + "format=gray"

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-ss", str(a.start), "-t", str(a.dur), "-i", a.video,
     "-vf", vf, "-frames:v", str(a.frames), "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    capture_output=True).stdout

size = a.cols * rows
count = len(raw) // size
if count == 0:
    sys.exit("ERROR: no frames produced - check --start/--dur against the clip length")
if count < a.frames:
    print(f"NOTE: got {count} frames, asked for {a.frames} (clip ran out)", file=sys.stderr)

# tile grid as square as possible, so the sheet stays compact
tileX = math.ceil(math.sqrt(count))
tileY = math.ceil(count / tileX)

subprocess.run(
    ["ffmpeg", "-v", "error", "-ss", str(a.start), "-t", str(a.dur), "-i", a.video,
     "-vf", f"{vf},tile={tileX}x{tileY}", "-frames:v", "1",
     os.path.join(a.workdir, "atlas.png"), "-y"], check=True)

peak = max(raw) or 255
def shape(v):
    v = v / peak
    return 0.0 if v < a.floor else ((v - a.floor) / (1 - a.floor)) ** a.gamma

px = [shape(v) for v in raw]

art, levels = [], []
for f in range(count):
    fr = px[f * size:(f + 1) * size]
    levels.append("".join(LEVELS[min(15, int(v * 16))] for v in fr))
    art.append("\n".join(
        "".join(a.ramp[min(len(a.ramp) - 1, int(v * len(a.ramp)))] for v in fr[r * a.cols:(r + 1) * a.cols])
        for r in range(rows)))

json.dump({"cmd": sys.argv, "cwd": os.getcwd(),
           "cols": a.cols, "rows": rows, "count": count, "tileX": tileX,
           "fps": round(fps, 2), "levels": levels, "art": art},
          open(os.path.join(a.workdir, "frames.json"), "w"))

print(f"grid {a.cols}x{rows}  frames {count}  tiles {tileX}x{tileY}  sheet fps {fps:.2f}",
      file=sys.stderr)
print(art[0])
