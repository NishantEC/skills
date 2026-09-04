#!/usr/bin/env python3
"""Density field -> ASCII frames. No video.

Writes the same two artefacts `extract.py` does, into <workdir>:
  atlas.png    grayscale sprite sheet, one tile per frame (this is what ships)
  frames.json  {cols, rows, count, tileX, levels[], art[]} for the review UI

Everything downstream — review.py, the bake, the frame-rate rule — reads those
two files and neither knows nor cares that no camera was involved.

The field is a function of three numbers:

  x, y   0..1 across the grid, y down
  t      0..2*pi over the loop

Return 0..1. Values outside are clamped rather than rejected, so a field can be
written without worrying about its own range.

`t` is an angle on purpose. Anything built from sin/cos of `t`, or of an integer
multiple of it, closes exactly at the wrap — which is the one thing a filmed
loop can never do without the three-copy interpolation in step 7 of SKILL.md.

Two ways to supply it:

  --expr "..."      a Python expression over x, y, t (and math as m)
  --module f.py     a file defining field(x, y, t) -> float

`--expr` is the one to reach for when an agent is writing the field to order.
It is `eval`, so treat it as code: this is a local authoring tool, run on a
field you or your agent just wrote, not something to point at input you did not
write.
"""
import argparse
import json
import math
import os
import subprocess
import sys

LEVELS = "0123456789abcdef"

# Enough to show the shape of the thing. The point of --expr is that the
# interesting ones get written per request, not chosen from a list.
PRESETS = {
    # Columns of rain, each with its own speed and phase, wrapping cleanly.
    "rain": (
        "max(0.0, 1.0 - 8.0 * ((y - ((t / (2*m.pi)) * (0.6 + 0.8 * ((m.sin(x*127.1)*43758.5)%1.0))"
        " + ((m.sin(x*311.7)*17.13)%1.0)) % 1.2)) % 1.2)"
    ),
    # Two interfering ring sources.
    "ripples": (
        "0.5 + 0.5 * m.sin(14*m.hypot(x-0.32, y-0.5) - t)"
        " * m.sin(11*m.hypot(x-0.71, y-0.46) - t)"
    ),
    # The classic plasma: a sum of sines that happens to loop.
    "plasma": (
        "0.5 + 0.5 * (m.sin(9*x + t) + m.sin(7*y - t)"
        " + m.sin(6*(x+y) + m.sin(t)*2)) / 3"
    ),
}

ap = argparse.ArgumentParser()
ap.add_argument("workdir")
ap.add_argument("--expr", help="Python expression over x, y, t (math available as m)")
ap.add_argument("--module", help="path to a .py defining field(x, y, t)")
ap.add_argument("--preset", choices=sorted(PRESETS), help="one of the built-in fields")
ap.add_argument("--keyframes", help="a file of ASCII frames separated by --- ; interpolated up to --frames")
ap.add_argument("--cols", type=int, default=84)
ap.add_argument("--rows", type=int, help="default keeps a 16:9 frame at this cell aspect")
ap.add_argument("--frames", type=int, default=48)
ap.add_argument("--fps", type=float, default=30.0, help="recorded for review; see SKILL.md step 6")
ap.add_argument("--floor", type=float, default=0.0, help="below this fraction of peak -> empty")
ap.add_argument("--gamma", type=float, default=1.0, help="<1 lifts midtones, >1 deepens them")
ap.add_argument("--ramp", default=" .:-=+*#%@")
a = ap.parse_args()
os.makedirs(a.workdir, exist_ok=True)

sources = [bool(a.expr), bool(a.module), bool(a.preset), bool(a.keyframes)]
if sum(sources) != 1:
    sys.exit("ERROR: give exactly one of --expr, --module, --preset, --keyframes")

field = None
if a.keyframes:
    pass
elif a.module:
    scope: dict = {}
    exec(compile(open(a.module).read(), a.module, "exec"), scope)  # noqa: S102
    if "field" not in scope:
        sys.exit(f"ERROR: {a.module} defines no field(x, y, t)")
    field = scope["field"]
else:
    src = a.expr or PRESETS[a.preset]
    code = compile(src, "<field>", "eval")
    field = lambda x, y, t: eval(code, {"m": math, "__builtins__": {"min": min, "max": max, "abs": abs}}, {"x": x, "y": y, "t": t})  # noqa: S307,E731

if a.keyframes:
    # Drawn frames, separated by `---`. Padded rather than validated: a model
    # writing ASCII drops trailing spaces and occasionally a whole short row,
    # and rejecting the sheet over that would send it round again for nothing.
    blocks = [b for b in open(a.keyframes).read().rstrip("\n").split("---\n")]
    keys = [[r for r in b.split("\n")] for b in blocks]
    keys = [[r for r in k if r.strip() or True] for k in keys]
    keys = [k[:-1] if k and k[-1] == "" else k for k in keys]
    a.cols = max(len(r) for k in keys for r in k)
    rows = max(len(k) for k in keys)
    keys = [[r.ljust(a.cols) for r in k] + [" " * a.cols] * (rows - len(k)) for k in keys]

    lut = {ch: i / (len(a.ramp) - 1) for i, ch in enumerate(a.ramp)}
    src = bytes(int(255 * lut.get(c, 0.0)) for k in keys for r in k for c in r)

    # `minterpolate` estimates motion in blocks and sees nothing at grid
    # resolution — at 24x8 it returned zero frames. Estimate upscaled, then come
    # back down.
    S = 16
    raw = bytearray(subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray",
         "-s", f"{a.cols}x{rows}", "-r", str(len(keys)), "-i", "-",
         "-vf", f"scale={a.cols*S}:{rows*S}:flags=neighbor,"
                f"minterpolate=fps={a.frames}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
                f"scale={a.cols}:{rows}:flags=area",
         "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        input=src, capture_output=True, check=True).stdout)
    size = a.cols * rows
    count = len(raw) // size
    if count == 0:
        sys.exit("ERROR: interpolation produced no frames")
    raw = raw[:count * size]
    print(f"drew {len(keys)} keyframes -> {count} frames", file=sys.stderr)
else:
    # A character cell is about 0.6 as wide as it is tall, same constant the
    # video path uses, so a field written for a square frame comes out square.
    rows = a.rows or max(1, round(a.cols * 0.6 * 9 / 16))
    size = a.cols * rows
    count = a.frames

    raw = bytearray(size * count)
    for f in range(count):
        t = 2 * math.pi * f / count
        base = f * size
        for r in range(rows):
            y = (r + 0.5) / rows
            for c in range(a.cols):
                v = field((c + 0.5) / a.cols, y, t)
                raw[base + r * a.cols + c] = 0 if v <= 0 else 255 if v >= 1 else int(v * 255)

# Same tiling rule as extract.py, so the sheet is laid out identically.
tileX = math.ceil(math.sqrt(count))
tileY = math.ceil(count / tileX)

subprocess.run(
    ["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray",
     "-s", f"{a.cols}x{rows}", "-r", "1", "-i", "-",
     "-vf", f"tile={tileX}x{tileY}", "-frames:v", "1",
     os.path.join(a.workdir, "atlas.png"), "-y"],
    input=bytes(raw), check=True)

# Identical shaping to extract.py, so review and bake behave the same. The
# default floor is 0 rather than 0.06: a generated field has no sensor noise to
# cut away, and clipping one is the author's decision rather than a repair.
peak = max(raw) or 255


def shape(v: int) -> float:
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
           "fps": round(a.fps, 2), "levels": levels, "art": art},
          open(os.path.join(a.workdir, "frames.json"), "w"))

print(f"grid {a.cols}x{rows}  frames {count}  tiles {tileX}x{tileY}  loop closes at t=2pi",
      file=sys.stderr)
print(art[0])
