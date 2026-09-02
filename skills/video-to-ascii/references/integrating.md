# Integrating the atlas

`atlas.png` is a grayscale sprite sheet: one tile per frame, laid out row-major in a
`tileX` x `tileY` grid. `frames.json` records `cols`, `rows`, `count` and `tileX` —
read them from there rather than hardcoding, since `tileX` is `ceil(sqrt(count))`.

The atlas holds **raw** luminance. Floor and gamma are applied at load time by the
consumer, which is what lets you retune without re-extracting.

## Loader

Decodes the sheet once into one `Float32Array` per frame.

```ts
export type Atlas = { cols: number; rows: number; count: number; frames: Float32Array[] | null };

export const createAtlas = (spec: {
  url: string; cols: number; rows: number; tileX: number;
  count: number; floor: number; gamma: number;
}): Atlas => {
  const atlas: Atlas = { cols: spec.cols, rows: spec.rows, count: spec.count, frames: null };
  if (typeof Image === "undefined") return atlas;

  const img = new Image();
  img.src = spec.url;
  img.decode().then(() => {
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);

    const out: Float32Array[] = [];
    let peak = 0.0001;
    for (let f = 0; f < spec.count; f += 1) {
      const ox = (f % spec.tileX) * spec.cols;
      const oy = Math.floor(f / spec.tileX) * spec.rows;
      const buf = new Float32Array(spec.cols * spec.rows);
      for (let y = 0; y < spec.rows; y += 1) {
        for (let x = 0; x < spec.cols; x += 1) {
          const v = data[((oy + y) * cv.width + ox + x) * 4] / 255;
          buf[y * spec.cols + x] = v;
          if (v > peak) peak = v;
        }
      }
      out.push(buf);
    }
    for (const buf of out) {
      for (let i = 0; i < buf.length; i += 1) {
        const v = buf[i] / peak;
        buf[i] = v < spec.floor ? 0 : ((v - spec.floor) / (1 - spec.floor)) ** spec.gamma;
      }
    }
    atlas.frames = out;
  }).catch(() => {});
  return atlas;
};
```

`peak` must start near zero, not at 1 — starting at 1 silently skips normalisation and
everything renders dim.

## Sampling

Bilinear in space, linear between adjacent frames, so playback stays smooth at any
refresh rate regardless of the sheet's own fps.

```ts
const bilinear = (buf: Float32Array, cols: number, rows: number, u: number, v: number) => {
  const fx = u * (cols - 1), fy = v * (rows - 1);
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(cols - 1, x0 + 1), y1 = Math.min(rows - 1, y0 + 1);
  const tx = fx - x0, ty = fy - y0;
  return buf[y0 * cols + x0] * (1 - tx) * (1 - ty) + buf[y0 * cols + x1] * tx * (1 - ty)
       + buf[y1 * cols + x0] * (1 - tx) * ty + buf[y1 * cols + x1] * tx * ty;
};

export const sample = (atlas: Atlas, u: number, v: number, seconds: number, fps: number) => {
  const { cols, rows, count, frames } = atlas;
  if (!frames || u < 0 || u > 1 || v < 0 || v > 1) return 0;
  const play = seconds * fps;
  const f0 = ((Math.floor(play) % count) + count) % count;   // guard negatives and NaN
  const a = frames[f0], b = frames[(f0 + 1) % count];
  if (!a || !b) return 0;
  const mix = play - Math.floor(play);
  const va = bilinear(a, cols, rows, u, v);
  return va + (bilinear(b, cols, rows, u, v) - va) * mix;
};
```

## Renderer

Draw glyphs to a canvas, never to DOM nodes — a modest grid is thousands of cells and
per-element rendering will not hold 60fps. Bucket cells by alpha so `fillStyle` changes
once per bucket instead of once per glyph.

```ts
const ALPHA_STEPS = 16, CHAR_ASPECT = 0.6, LINE_HEIGHT = 0.94, CUT = 0.04;

// per frame, after clearing:
//   cellW    = width / cols
//   fontSize = cellW / CHAR_ASPECT
//   cellH    = fontSize * LINE_HEIGHT
//   rows     = floor(height / cellH)
// for each cell: d = sample(...); if (d < CUT) continue;
//   bucket = min(ALPHA_STEPS - 1, floor(d * ALPHA_STEPS))
//   glyph  = ramp[Math.round(d * (ramp.length - 1))]
// then per bucket: fillStyle = `rgba(${r},${g},${b},${(bucket + 1) / ALPHA_STEPS})`
```

### Aspect

The atlas has its own rendered aspect, `cols * 0.6 / rows`. Letterbox rather than stretch:

```ts
const SOURCE_ASPECT = (cols * 0.6) / rows;
const v = 0.5 + (y - 0.5) * (SOURCE_ASPECT / canvasAspect);
if (v < 0 || v > 1) return 0;
```

### Housekeeping

- `ResizeObserver` on the host to re-layout; recompute `rows` and reallocate buckets.
- Cancel the rAF loop on `visibilitychange` — hidden tabs throttle it anyway.
- `prefers-reduced-motion`: freeze at a fixed time rather than looping.
- Scale the canvas by `devicePixelRatio` (capped at 2) or glyphs render soft.

## Applying the settings object

| Field | Where it goes |
|---|---|
| `ramp` | the glyph string |
| `color` | `rgba(...)` fill |
| `contrast` | multiply into the atlas gamma: `extract_gamma x contrast` |
| `fps` | playback rate passed to `sample` |
| `grid` | must match `cols`/`rows` in the loader spec |
| `frame` | a frame the user liked — use as a start offset, or ignore |
