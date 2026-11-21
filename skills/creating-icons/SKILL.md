---
name: creating-icons
description: Use when asked to draw, redraw or extend a UI icon set. Colour layered icons for objects and features (depth, rim, shadow, gloss, hover motion, on/off state) and mono "duo line" glyphs for controls, in light and dark, delivered as standalone SVG plus CSS that drop into any project.
---

# Creating Icons

You draw a family, not a one-off. Every icon must look like the same hand drew it. If the
project already has icons, read three first and match them. If not, use this skill exactly.

You write only geometry. `scripts/compose.mjs` turns a small JSON spec into the finished
SVG (gradients, rim, shadow, gloss, masks, light and dark paints) and the motion CSS. Do
not hand-write that boilerplate.

## Pick the kind

| Kind | For | Look |
| --- | --- | --- |
| **Colour icon** | Objects and features: calendar, camera, gift, lock, rocket, settings, chart, tag | 4 to 8 pieces in 3 tiers, depth, one accent, hover move, on state |
| **Glyph** | Controls: chevron, caret, arrow, close, plus, check, dots, search, filter, panel toggle | Mono duo line, 1.75 stroke, `currentColor`, wash only on real bodies |

Controls are never coloured. Objects always are. Name files by what they depict.

## Procedure (colour icon)

1. **Brief in 4 lines.** Kind, accent family (`references/accents.md`), silhouette archetype (`references/shapes.md`: round, tall, flat, device, abstract, container), and the parts list with a tier for each. Do not ask questions you can answer.
2. **Build tiers back to front** in `<name>.json` (spec format in `references/spec.md`):
   - t3 first: the back plate, halo, bezel, second sheet or ghost offset 1.5 to 3 units from the body so it peeks out. This is the required depth cue.
   - t2 next: the body, the largest shape, 14 to 19 units across, corner radius 3 to 3.5.
   - t1 last: marks and small parts as lines (width 1.8 to 2, round caps) or shapes. Anything smaller than 3 units is t1, never t2.
   - one `gloss` piece on the body (upper left, 35 to 45% white), at most one.
   - symmetric parts: draw one half and add `"mirror":true`; never retype coordinates.
   - holes (keyhole, gear hole, lens) are `cuts`, not extra layers.
   - parts that move get `part`; consecutive pieces with the same part share a group.
3. **Motion in the same spec** (`references/motion.md`): one hover move per icon where one part moves against the rest, an `on` pose, a `badge` for the on state. Colour icons ship motion by default.
4. **Compose and check:**
   ```bash
   node scripts/compose.mjs icons/gift.json icons      # writes gift.svg and gift.css
   node scripts/paints.mjs '#F2643F'                   # contrast table, must say all targets met
   node scripts/check.mjs icons                        # static rules
   ```
5. **Review loop (mandatory, `references/review.md`).** Render, look at the image, fix, render again. At least one fix round, or write down why none was needed:
   ```bash
   node scripts/preview.mjs icons icons/preview.html --png icons/preview.png --motion icons/motion
   ```
   The PNG has three real renders (light, dark by `prefers-color-scheme`, dark by `.dark` class) at 16 small, 16 full, 24, 48 and 96px plus on and mid-move cells; the script fails if the two dark paths resolve to different paints. `--motion` records every icon's hover, on and off to GIF and MP4, writes a frame contact sheet, and fails on overflow past the 24 box, a loop seam, a wrong duration or reduced-motion misbehaviour. Open the PNG and the contact sheet with the image viewer. If the machine has a shared browser, add `--cdp <endpoint>` instead of letting the script start Chrome (needs ffmpeg for the recordings).
6. Deliver `<name>.svg`, `<name>-16.svg`, `<name>.css`, the spec, and say which accent family you used.

## Hard rules for colour icons

Checked by `scripts/check.mjs` where marked (c).

- 24 grid, live area 2.5 to 21.5 (c). The main mass spans at least 16 units on its long axis (c warns below).
- At least 4 pieces and all three tiers used (c). At most 12 pieces (c warns above 14).
- A t3 piece that peeks beyond the body by 1.5 to 3 units on at least one side, or a full halo or bezel.
- Smallest feature 1.5 units, smallest gap 1.5. Shapes under 3 units across are t1. Details at 16px: at most 3 interior marks (enforced on `<name>-16.svg`); at 24px at most 6.
- Roundness: body corners 3 to 3.5, small parts 1.2 to 1.5, no sharp corner except where the object has one (a paper corner, a spark tip).
- Lines are width 1.8 to 2 with round caps, in t1 (a t2 line such as a shackle may be width 2).
- Paints come only from `paints.mjs` via compose. Never hand-pick hex values, never set colours in the spec.
- Dark mode: marks keep 3:1 against the body, the rim keeps 8:1 against the panel (paints.mjs prints both). If an accent fails, change the accent's lightness to 55 to 65%, not the maths.
- Motion (c): a `data-part`, hover keyframes named `ei-<icon>-<move>`, an `on` pose, a reduced-motion block. Animate only transform, opacity, stroke-dashoffset. 700 to 1100ms. Last frame equals first. Swept geometry stays inside the 24 box (`--motion` measures it).
- Unique ids: compose prefixes every id with `ic-<name>-`. If you inline one icon many times on a page, either use `<img>`/a sprite or give each copy its own suffix, because gradient colours resolve in the first copy.

## Small sizes (16px variant)

Detail that works at 48px turns to mush at 16. Compose therefore writes two files per colour icon: `<name>.svg` (full, 24 and up) and `<name>-16.svg` (simplified, for rendered sizes up to 20px). The variant keeps the silhouette, the tier-3 depth cue and at most three tier-1 marks; it drops the gloss automatically, raises lines to width 2, and drops or fattens whatever the spec marks with `"sm"` (`"sm":false` removes a piece, `"sm":{"d":"..."}` swaps its geometry).

Why two files: it is the one approach that works everywhere. `@media` inside an SVG sees the page viewport when the SVG is inlined, so it cannot tell a 16px icon from a 96px one, and `<symbol>` sprites cannot carry per-icon CSS variables across files reliably. A file per size works in `<img>`, CSS `background`, inline SVG, sprites and icon libraries alike. Use `<name>-16.svg` when the icon renders at 20px or less, `<name>.svg` otherwise. In a component: `const src = size <= 20 ? `${name}-16.svg` : `${name}.svg``. The variant shares the class `ic-<name>` and the motion CSS, and its ids are `ic-<name>-sm-*`, so both can sit on one page.

Rules when drawing: decide per piece what survives at 16 (silhouette, one depth cue, the one mark that names the object), mark the rest `"sm":false`. Minimum sizes are in `references/shapes.md`; `check.mjs` errors on a 16px filled shape under 2.5 units, a line under 2, more than 3 tier-1 pieces or no tier-3 piece.

## Dark mode paths

Every colour icon carries three rules: light default, `@media (prefers-color-scheme:dark)` (guarded by `:not(.light):not([data-theme=light])`), and `:root.dark` / `:root[data-theme=dark]`. They hold identical values and the preview proves it. An SVG loaded through `<img>` can only follow the OS (class selectors cannot reach into it); to follow an app's `.dark` toggle, inline the SVG.

## Glyphs

Spec with `"kind":"glyph"`: `lines` (one path), optional `washes`, optional `dots`. Rules and recipes in `references/glyphs.md`. Stroke 1.75, geometry inside 3 to 21, wash 22% only for a real body, dots r1.5 spaced 6.5, mirror coordinates for symmetric shapes, optical centre not box centre. No motion, no colour.

## References (read as needed)

- `references/bar.md`: what separates a rich icon from a flat one, with numbers. Read first.
- `references/spec.md`: the JSON spec, every field.
- `references/shapes.md`: archetype recipes with coordinates and proportions (round, tall, flat, device, abstract, vehicle, container, lens, lock, worn pair, bell, folder, bubble) and the minimum-size table.
- `references/motion.md`: hover and state recipes to copy.
- `references/glyphs.md`: glyph recipes.
- `references/review.md`: the render-and-fix checklist.
- `references/accents.md`: meaning to hue.
- `examples/`: fifteen colour icons (the seven below plus `rocket`, `headphones`, `calendar`, `camera`, `lock`, `bell`, `folder`, `chat-bubble`, each with a `-16` variant; `headphones` is the worn-pair recipe, `rocket` the pointed vehicle) from the seven (`copy` two sheets, `trash` lid, `clock` round, `bulb` tall, `receipt` flat document, `phone` device, `spark` abstract) and three glyphs (`search`, `arrow-right`, `sidebar`). Each has its `specs/<name>.json`. Copy the nearest archetype and change it; do not start from nothing.
