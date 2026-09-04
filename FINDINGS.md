# Findings

Measured while building with `video2ascii`, not inferred. Each of these cost real
time to find, and two of them were self-inflicted.

## Frame rate must divide the display refresh

A frame is shown for a whole number of display refreshes and nothing else. Ask for an
interval that is not a multiple of one and it gets rounded — inconsistently, a refresh
short on one frame and long on the next.

At 8fps on a 60Hz display a frame wants 7.5 refreshes. Measured on a real component,
that produced a steady alternation and read as a stutter on every single frame:

```
frame gaps: 132.6 117.1 133.6 116.7 133.1 117.0 134.1 115.6 ...
avg 123.9ms  min 116.6  max 134.3   jitter 70.3ms
```

Driving playback by counting refreshes instead — measuring the display's real rate
rather than assuming 60Hz — makes every frame the same length by construction:

```
gaps: 83.3 83.4 84.0 83.6 83.2 83.0 82.8 83.3 ...
avg 83.3ms   jitter 2.3ms
```

Clean rates at 60Hz: 30 (2 refreshes), 20 (3), 15 (4), 12 (5), 10 (6), 6 (10). `8` and
`24` are not on that list, however normal they look in a video tool.

## Never re-centre frames on their bounding box

Aligning each frame on its own ink bounding box looks like it removes drift and does the
opposite. Faint extremities fade in and out across the threshold, so the box swings — up
to 21 columns between consecutive frames in the clip measured — and the correction throws
the subject sideways.

```
frame-to-frame centroid movement, raw:      max 1.16 cells,  avg 0.42
                             re-centred:    max 5.66 cells,  avg 1.36
```

Three times worse than the problem it was solving. Crop once across all frames and leave
them alone: what looks like drift is usually the subject moving, which is what you
filmed. If per-frame alignment is genuinely needed, align on the luminance centroid,
which is mass-weighted and does not care where a threshold falls.

## Raising the frame rate later, without the source

`minterpolate` synthesises intermediate frames from an existing sheet, which is the only
route once the working directory is gone. Interpolate the *looped* sequence — three
concatenated copies, keeping the middle pass — or the wrap point is interpolated against
nothing and the loop hitches once per cycle.

Verify it synthesised rather than duplicated: per-frame centroid movement should fall in
proportion to the extra frames. Going 48 → 120 measured 0.415 → 0.161 cells, a ratio of
0.39 against a theoretical 0.40, with no zero-motion steps.

Raise the black floor afterwards. Motion compensation leaves faint ghosts along a moving
edge; at the original floor those passed the content test, the crop opened from 64×28 to
80×39, and stray marks floated beside the subject.

Interpolation adds frames between the ones that exist. It cannot add seconds.

## Cost, for anyone considering doing this in a browser

The whole pipeline runs client-side: `<video>` seeking for the sampling, a canvas for the
pixels. `drawImage` accepts a video element exactly as it takes an image, so the same
code path serves both. Drive video with `requestVideoFrameCallback`, which fires once per
decoded frame, rather than a timer that will run twice on one frame and skip the next.

Sampling by seeking is slower than playing and grabbing whatever the decoder shows, but
playback gives unevenly spaced frames, which reads as uneven motion later.

Building a character grid is far cheaper than it looks — measured per frame:

| grid | cells | build |
|---|---|---|
| 64×38 | 2,432 | <0.1ms |
| 128×74 | 9,472 | 0.1ms |
| 200×116 | 23,200 | 0.3ms |

The renderer is nowhere near the ceiling. Asset size is the real budget, and it is linear
in frames and quadratic in grid resolution — measured at roughly 0.30 bytes per pixel for
a compressed greyscale sheet of this kind of content.

Per-pixel *filters* are a different story. A plain pass over 1080p costs about 4ms, but
painterly ones — watercolour, ink wash, a full CMYK risograph with per-ink halftone
screens — measured 75–258ms on a third of a megapixel, which is 4 to 13fps. Those want a
fragment shader; a JS loop is the wrong tool.
