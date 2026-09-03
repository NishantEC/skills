# Pipeline: SVG → raster → export

Authoring in SVG and rasterising locally needs no browser, no image generation, and
no extra dependencies on macOS.

## Rasterising

```sh
qlmanage -t -s 512 -o outdir mark.svg     # -> outdir/mark.svg.png
```

`sips` cannot read SVG. `rsvg-convert`, `cairosvg` and Inkscape are usually absent —
do not plan around them. PIL handles masking, diffing and contact sheets.

## The four traps

Each cost real time. None is obvious from the tool's output, and each produces a
plausible-looking wrong result rather than an error.

### 1. `qlmanage` honours the SVG's intrinsic size, not `-s` alone

If the file says `width="64"`, `-s 512` gives a 64px drawing on a large canvas.

**Fix:** author every variant at `width="1024" height="1024"` with a `viewBox`, and
let `-s` choose the output size.
**Symptom:** small renders come back as a speck in the corner of a white square.

### 2. `qlmanage` flattens onto an opaque canvas

A `clipPath` squircle inside the SVG buys nothing — the corners come out white. In a
Dock that is a hard square instead of a rounded icon.

**Fix:** composite every rendered PNG through a rounded-rect alpha mask in PIL.
macOS corner radius is **22.37%** of the side.

```python
def squircle_mask(size, ss=8):
    S = size * ss
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, S-1, S-1],
                                        radius=int(S * 0.2237), fill=255)
    return m.resize((size, size), Image.LANCZOS)

out = Image.new("RGBA", im.size, (0, 0, 0, 0))
out.paste(im, (0, 0), squircle_mask(size))
```

### 3. Probing corner alpha at an inset pixel gives false failures

`(2, 2)` is the intuitive probe and it is wrong. At 16px the corner radius is only
3.6px, so `(2, 2)` lands **inside** the shape and reports FAIL on a correct file.

**Fix:** probe `(0, 0)`.

### 4. Blur-dependent elements must be removed, not unblurred

Cast shadow, contact shadow and rim light exist *because* they are blurred. Strip the
filters and they become hard edges that read as drawing errors.

**Fix:** for a filter-free variant, delete those elements outright and re-tune what
remains (a gloss tuned to sit under a rim needs lowering once the rim is gone). Say
in the README that the flat variant is deliberately not a match.

## Per-size drawings

Do not scale one drawing. Detail must be dropped as pixels run out.

| pixels | treatment |
| --- | --- |
| 256–1024 | full — rim light, gloss, interior detail, highlights |
| 64–128 | interior detail thickened, rim strengthened, focal features enlarged |
| 16–32 | interior detail solid, gloss and rim dropped, focal features enlarged again |

**Fine interior detail dies first** — a slit pupil collapses to a single dark column
below ~64px and muddies the eye; solid reads better than smeared. Enlarge the focal
feature as everything else is stripped: at 16px it is the whole icon.

## Building a `.icns`

Ten slots, from seven renders:

```
icon_16x16.png       16     icon_128x128.png      128
icon_16x16@2x.png    32     icon_128x128@2x.png   256
icon_32x32.png       32     icon_256x256.png      256
icon_32x32@2x.png    64     icon_256x256@2x.png   512
                            icon_512x512.png      512
                            icon_512x512@2x.png  1024
```

Map by **pixel count**, not by slot name — `icon_16x16@2x` is 32 physical pixels and
gets the 32px drawing.

```sh
iconutil -c icns neko.iconset -o neko.icns
```

## Verifying — read it back, don't trust the build

```sh
iconutil -c iconset neko.icns -o verify.iconset
```

Then for every slot assert `alpha(0,0) == 0` and `alpha(centre) == 255`. Also
diff the vector master against the rasterised slot — if you keep an SVG master,
it should reach **max delta 0** against the matching size, and if it does not, the
master is stale.

**State what you could not check.** You cannot see the icon live in a Dock or menu
bar from here. Say so rather than implying it was verified.
