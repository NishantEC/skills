# video2ascii

An agent skill that turns a video into an animated ASCII-art asset for a website or app —
with a human approval step in the middle, on a local page you actually tune by hand.

Built for [Claude Code](https://claude.com/claude-code), but the scripts are plain
`ffmpeg` + `python3` and work standalone.

## Why

Recreating an organic ASCII effect procedurally — metaballs, noise fields, hand-authored
curves — does not converge. Real footage does. This skill takes the video route: extract
frames, isolate the subject, convert to character density, then let a human judge the
result before anything gets baked in.

## Install

```bash
git clone <this-repo> ~/.claude/skills/video2ascii
brew install ffmpeg yt-dlp   # yt-dlp only for YouTube/Vimeo URLs
```

Claude Code picks it up on the next session. Then just ask: *"make ASCII art out of this
video"*.

## Try it now

A ready-made demo ships in `demo/` — a starfish photo rotated into a turn, 48 frames:

```bash
python3 scripts/review.py demo --title "Starfish demo"
```

That opens the approval page with real data, so you can see what the tuning controls
actually do before pointing the skill at your own footage.

## Pipeline

```
prepare.sh   any URL or local file        -> source.mp4
autocrop.py  find the subject             -> W:H:X:Y crop string
extract.py   frames -> density grids      -> atlas.png + frames.json
review.py    serve the approval page      -> a settings object you copy
             bake into your component     -> canvas renderer
```

### The review page

`review.py` serves a page on `127.0.0.1:8722`: a contact sheet of frames, a live player,
and controls for glyph ramp, colour, contrast, speed and background. Tune it, press
**Copy**, paste the object back to your agent:

```json
{ "ramp": ".:-=+*#%@", "color": [124, 58, 187], "contrast": 0.68,
  "fps": 8, "frame": 47, "grid": [84, 50], "frames": 48 }
```

Python stdlib only — no server framework, no build step, nothing to install.

## Output

`atlas.png` is a grayscale sprite sheet, one tile per frame. 48 frames at an 84x50 grid is
about 60KB, versus ~200KB for the same frames stored as text. It holds raw luminance, so
floor and gamma stay tunable at load time without re-extracting.

`references/integrating.md` has the loader, the sampler (bilinear in space, interpolated
between frames) and the canvas renderer.

## Choosing a source

The background decides everything. A subject on plain black or plain white isolates with
one luminance threshold. Busy backgrounds cannot be separated by any simple colour rule —
measured on real footage, a warm subject scored `r-g` 29–52 against a background at 3–46.
Overlapping ranges mean mush, every time.

Prefer Pexels or Pixabay over YouTube if the asset will ship; YouTube is not
licence-cleared for redistribution.

Got a still image instead? Rotate or pan it into a video first — `SKILL.md` has the
ffmpeg one-liner.

## Requirements

`ffmpeg`, `python3`. `yt-dlp` only for YouTube/Vimeo. No Python packages.

`pip install yt-dlp` fails on PEP 668 systems; use brew, pipx or a venv.

## Licence

Code and documentation: **MIT**.

The files in `demo/` are derived from a CC BY-SA 3.0 photograph and carry that licence
instead — see `demo/ATTRIBUTION.md`. This does not affect assets you generate yourself;
those follow whatever licence your own source carries.
