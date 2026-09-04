---
name: video2ascii
description: Turns a video into an animated ASCII-art asset for a website or app. Extracts frames, isolates the subject, converts each frame to a character-density grid, opens a local review page where a human tunes the glyph ramp, colour, contrast and speed, then bakes the approved settings into a sprite-sheet plus a canvas renderer. Use when the user wants ASCII art from a video or image, an "ASCII animation", a matrix/binary-rain style visual built from real footage, or asks to recreate an ASCII-art effect they saw somewhere. Also use for a single still image that should rotate or pan.
license: MIT
---

# Video to ASCII

Real footage beats procedural noise. Do not try to fake an organic shape with
metaballs, fbm or hand-authored curves - it will not converge and you will burn
the user's time. Get a video, convert its frames, let the human approve.

## Prerequisites

`ffmpeg` and `python3` are required. `yt-dlp` is needed only for YouTube/Vimeo URLs.

```bash
brew install ffmpeg yt-dlp
```

`pip install yt-dlp` fails on PEP 668 systems (externally-managed environment). Use brew,
pipx, or a venv.

## Workflow

Copy this checklist and track it:

```
- [ ] 1. Get a source the user is happy with
- [ ] 2. Pick a window and auto-crop to the subject
- [ ] 3. Extract frames, check frame 0 in the terminal
- [ ] 4. Serve the review page and STOP for human approval
- [ ] 5. Bake the approved settings into the target component
- [ ] 6. Check the frame rate divides the display refresh
- [ ] 7. Drive playback by counting refreshes, not setInterval
```

### 1. Source

Ask whether the user will supply a file or wants you to find one. When hunting, prefer
Pexels or Pixabay (free licence, direct mp4) over YouTube, which is not licence-cleared
for shipping. Flag this if the asset will be public.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/prepare.sh <url-or-file> <workdir>
```

**The background decides everything.** A subject on plain black or plain white isolates
perfectly with one luminance threshold. Busy backgrounds (seabed, foliage, crowds) cannot
be separated by any simple rule - do not accept one and hope. Verify before committing:
sample a few subject pixels and a few background pixels and compare. If the ranges
overlap, reject the source and say why.

For a still image that should move, generate the motion first, then treat it as video:

```bash
ffmpeg -loop 1 -i still.jpg -vf \
  "pad=2400:2400:(2400-iw)/2:(2400-ih)/2:color=white,rotate=2*PI*t/8:c=white:ow=2400:oh=2400,scale=1100:1100,format=yuv420p" \
  -t 8 -r 24 spin.mp4 -y
```

### 2. Window and crop

Pick a few seconds where the subject is well framed, then:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/autocrop.py <workdir>/source.mp4 --start 20 --dur 8
```

Prints an ffmpeg `W:H:X:Y` string covering the subject across the whole window. Add
`--invert` for a dark subject on a light background. Lower `--threshold` if it finds
nothing, raise it if it grabs background.

### 3. Extract

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/extract.py <workdir>/source.mp4 <workdir> \
  --crop 1080:1080:142:0 --start 20 --dur 8 \
  --frames 48 --cols 84 --mode lum --floor 0.06 --gamma 0.85
```

`--mode`: `lum` bright subject on dark, `invlum` dark subject on light, `chroma` warm
subject on a cool background. Writes `atlas.png` (ships) and `frames.json` (review only),
and prints frame 0 as ASCII. **Read that output.** If it is not recognisable, fix it here -
adjust the crop, mode or floor. Never move on from a bad frame 0.

`--pad 1.3` shrinks the subject inside the frame, useful for a second variant.

### 4. Review - stop here

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/review.py <workdir> --title "Jellyfish"
```

Serves an editor on `127.0.0.1:8722`: a contact sheet, a live player, and every control
that changes how the grid reads - ramp, density, contrast, invert, palette, the two ink
colours, background and speed. The user presses **Copy preset** and pastes back:

```json
{ "ramp": "standard", "columns": 124, "contrast": 0.85, "invert": false,
  "ink": ["#6b6b78", "#15151a"], "background": "#f4f4f3", "fps": 30 }
```

Everything except **Density** is a pure function of the brightnesses already in
`frames.json`, so it applies instantly with no re-bake. Density is different: changing the
column count means resampling the source, so the page posts back and the server re-runs
the command that produced the workdir with a new `--cols`. That command is recorded in
`frames.json` at bake time, which is why the workdir needs no arguments repeated to it.

A workdir made before that was recorded still opens; density is disabled with a note
rather than offered and broken.

Do not bake anything until you have that object. This gate is the point of the skill.

Whatever `fps` comes back, check it against **Pick a frame rate that divides the refresh**
before baking. A rate chosen by eye in the review player will look fine there and stutter
in the product.

### 5. Bake

Copy `atlas.png` into the project's assets, then build the renderer as described in
`references/integrating.md`. Convert `contrast` into the atlas gamma:

```
atlas_gamma = extract_gamma x settings_contrast
```

They compose because both are powers of the same normalised value. With `--gamma 0.85`
at extract time and `contrast: 0.68`, bake `0.578`.

### 6. Pick a frame rate that divides the refresh

A frame is shown for a whole number of display refreshes and nothing else. Pick a rate
that does not divide the refresh rate and every frame gets rounded, inconsistently: at
8fps on a 60Hz screen a frame wants 7.5 refreshes, so it is held for 7, then 8, then 7.
Measured on a real component that produced a steady 133/117/133/117ms alternation and read
as a stutter on every single frame. It is the single most common reason one of these
assets feels wrong while the frames themselves are fine.

At 60Hz the clean rates are:

| fps | refreshes/frame | loop from 120 frames |
|---|---|---|
| 30 | 2 | 4.0s |
| 20 | 3 | 6.0s |
| 15 | 4 | 8.0s |
| 12 | 5 | 10.0s |
| 10 | 6 | 12.0s |
| 6 | 10 | 20.0s |

`8` and `24` are not on that list, so do not default to them however normal they look in
a video tool. Prefer 12 or 15 for a slow organic subject and 30 where the motion is fast.

Then drive playback by **counting refreshes**, never `setInterval`:

```js
// Measure the display's real rate over the first ~10 frames, then hold the cadence.
const every = Math.max(1, Math.round((1000 / fps) / measuredRefreshMs));
if (++sinceAdvance >= every) { sinceAdvance = 0; advance(); }
```

Deriving the cadence from the measured rate rather than assuming 60Hz means a 120Hz panel
resolves the same target to twice as many refreshes and the wall-clock rate holds.

### 7. Raising the rate later, without the source

`minterpolate` synthesises intermediate frames from an existing sheet, which is the only
route once the workdir is gone:

```bash
# Three copies, so the wrap point has real neighbours on both sides; keep the middle pass.
ffmpeg -framerate 12 -i loop/l%04d.png \
  -vf "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -pix_fmt gray out/i%04d.png
```

Interpolate the *looped* sequence or the seam gets interpolated against nothing and the
loop hitches once per cycle.

Verify it synthesised rather than duplicated: per-frame centroid movement should fall in
proportion to the extra frames. Going 48 to 120 measured 0.415 to 0.161 cells, a ratio of
0.39 against a theoretical 0.40, with no zero-motion steps.

**Raise `floor` afterwards.** Motion compensation leaves faint ghosts along a moving edge.
At the original floor those pass the content test: the crop opened from 64x38 to 80x39 and
left stray marks beside the subject. Re-measure the crop and raise the floor until it
returns to the original size.

Interpolation adds frames between the ones that exist. It cannot add seconds. A longer
loop needs the source clip.

## Gotchas

- **Match the artefacts.** Any pixel transform must live in the ffmpeg chain so `atlas.png`
  and `frames.json` come from identical pixels. Transform one in Python and they silently
  disagree.
- **Character cells are not square.** A monospace cell is about 0.6 wide for its height,
  so `rows = cols x 0.6 x (cropH / cropW)`. Get this wrong and everything is stretched.
- **Sprite sheet, not text.** 48 frames as hex text is ~200KB; as a grayscale PNG it is
  ~60KB and decodes in one pass.
- **Guard the frame index.** `frames[i]` returning `undefined` throws
  `Cannot read properties of undefined` and blanks the canvas with no other clue.
- **Never re-centre frames individually.** Aligning each frame on its own ink bounding box
  looks like it removes drift and does the opposite. Faint extremities fade in and out at
  the threshold, so the box can swing by 21 columns between consecutive frames and the
  correction throws the subject sideways. Measured 5.66 cells of frame-to-frame movement
  against 1.16 for the untouched frames - three times worse. Crop once across all frames
  and leave them alone; what looks like drift is usually the subject moving, which is what
  you filmed. If per-frame alignment is genuinely needed, use the luminance centroid, which
  is mass-weighted and does not care where a threshold falls.
- Some ffmpeg builds lack `drawtext` (no libfreetype). Do not rely on burnt-in timestamps.
- Averaging frames (`tmix`) recovers a smooth density field from footage that is already
  textured or noisy.

## Tuning

| Symptom | Fix |
|---|---|
| Flat, everything one shade | Lower `contrast` below 1, or raise `--gamma` |
| Only a dense core, fringe gone | Raise `contrast` above 1, or lower `--floor` |
| Background speckle | Raise `--floor` |
| Subject too small in frame | Tighten the crop, or drop `--pad` to 1.0 |
| Motion stutters at a steady beat | The rate does not divide the display refresh. See **Pick a frame rate that divides the refresh** |
| Motion is even but coarse | More `--frames`, or interpolate after the fact |
| Subject snaps sideways between frames | Something is re-centring per frame. See **Never re-centre frames individually** |
