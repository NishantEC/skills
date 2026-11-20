---
name: creating-icons
description: Use when asked to draw, redraw or extend a UI icon set — colour layered icons for objects and features, mono "duo line" glyphs for controls, light and dark paints, optional hover motion and on/off states — and deliver standalone SVG (plus optional CSS) files that drop into any project.
---

# Creating Icons

You are drawing a family, not a one-off. Every icon you add must look like it came from
the same hand as the others: same grid, same weights, same accent logic. If the project
already has icons, read three of them first and match them. If it has none, use the
specs below exactly.

## Pick the kind first

| Kind | For | Look | Colour |
| --- | --- | --- | --- |
| **Colour icon** | Objects and features: file, calendar, rocket, chart, tag, trash, settings | 2 to 3 flat layers on a 24 grid, one accent per icon | Accent family, light and dark paints |
| **Glyph** | Controls: chevron, caret, arrow, close, plus, minus, check, dots, search, filter, toggle | Mono "duo line": 1.75 stroke, a 22% wash only where there is a real body, round dots | `currentColor`, follows text and theme |

Hard rules:
- Controls are never coloured. Objects always are. A coloured chevron or x looks wrong.
- Name the file by what it depicts (`chevron-down`, `eye-off`, `calendar`), not by the name in some other icon set.
- No comments inside the SVG or CSS beyond the paint block.

## Shared rules

- `viewBox="0 0 24 24"`, `width="24" height="24"`, `fill="none"` on the root.
- Live area is 2.5 to 21.5. Optically centre the shape, do not just centre its box. Triangles and arrows sit slightly toward their mass.
- Round everything: `stroke-linecap="round"`, `stroke-linejoin="round"`, corner radius 1.5 to 3 on shapes. No sharp 90 degree corners except where the object has them (a page corner).
- Use basic shapes (`rect` with `rx`, `circle`, `path`). No transforms on static geometry, no filters, no gradients, no ids. Flat fills only, so the file survives any renderer and can be inlined many times.
- One idea per icon. If it needs a third explanatory part, drop the part.

## Colour icon

### Layers

Draw back to front. Each layer is one flat fill class.

| Tier | Class | Role | Paint |
| --- | --- | --- | --- |
| 3 | `t3` | Back plate, shadow shape, container behind the subject | very pale tint of the accent |
| 2 | `t2` | The body of the object | mid tint of the accent |
| 1 | `t1` | The marking: strokes, slats, text lines, small details | dark accent, as fill or as 1.8 stroke |

Most icons have two layers (t3 + t2, or t2 + t1 lines) and some have all three. Never
four. Details are strokes at width 1.8 with round caps, never tiny filled shapes: a
small tier-2 shape reads as a hollow ring at 16px, so a small dot belongs at tier 1.

Parts that will move get `data-part="name"` (put a `<g>` around multi-piece parts).

### Accent and paints

One accent per icon. Related icons share it so the set groups itself: pick from
`references/accents.md`, which maps meaning to hue. A new family gets a new hue at
least 30 degrees from its neighbours, mid-saturation, around 55 to 65% lightness.

Do not eyeball the other paints. Run:

```bash
node scripts/paints.mjs '#8B6CF0'
```

It prints the light and dark value for `t1`, `t2`, `t3` and the line colour. The
maths: light `t3` = accent 58% toward white, `t2` = 32% toward white, `t1` = accent x 0.76;
dark values are re-lit in OKLCH (lightness 0.34 + 0.54 x source, chroma kept, hue kept)
so a dark theme never gets a dim or muddy icon. If one icon still looks weak in dark,
change that icon's accent, not the maths.

### Light and dark in one file

Deliver one SVG with its paints as CSS variables, scoped by a class unique to the icon
(`ic-<name>`) so many inline copies never collide. Use exactly this block:

```svg
<style>
  .ic-copy{--t1:#6a52b6;--t2:#b09bf5;--t3:#cec1f9}
  @media (prefers-color-scheme:dark){:root:not(.light):not([data-theme=light]) .ic-copy{--t1:#886be9;--t2:#ab9bfb;--t3:#c6bdfd}}
  :root.dark .ic-copy,:root[data-theme=dark] .ic-copy{--t1:#886be9;--t2:#ab9bfb;--t3:#c6bdfd}
  .ic-copy .t1{fill:var(--t1)}.ic-copy .t2{fill:var(--t2)}.ic-copy .t3{fill:var(--t3)}
  .ic-copy .s1{stroke:var(--t1)}
</style>
```

This works as a standalone file or `<img>` (follows the OS), inline in a page (also
follows a `.dark` class or `data-theme="dark"` on the root, and `light` forces light), and
needs no build step. Do not ship separate `-light` / `-dark` files unless the user asks.

## Glyph

A control icon. All geometry on the 24 grid inside 3 to 21.

- **Line**: one path, stroke `currentColor`, width **1.75**, round caps and joins. Circles are two arcs or a `circle`.
- **Wash**: only where the glyph has a real body (a page, box, lens, funnel, panel, screen). `fill="currentColor" fill-opacity=".22"`, same outline as the line. Arrows, chevrons, carets, plus, minus, check and close have no wash.
- **Dots**: `r="1.5"` filled `currentColor`, spaced 6.5 apart (a three-dot menu sits at x 5.5, 12, 18.5).
- Never draw a zero-width or zero-height shape (a lone horizontal line as a fill). Use a stroke, or a rounded rect for a minus.
- Chevrons and carets span about 8 x 5 units and are centred on their optical middle, not their bounding box.

Theme: the root carries a `color` that reads from `--icon-ink` with a light and a dark
fallback, so the file works alone and an app can restyle it by setting one variable:

```svg
<style>
  .gl-search{color:var(--icon-ink,#27272a)}
  @media (prefers-color-scheme:dark){:root:not(.light):not([data-theme=light]) .gl-search{color:var(--icon-ink,#e4e4e7)}}
  :root.dark .gl-search,:root[data-theme=dark] .gl-search{color:var(--icon-ink,#e4e4e7)}
</style>
```

Colour icons use the `ic-` class prefix, glyphs `gl-`. When a user wants the glyph to
inherit the surrounding text colour inline, they delete the `<style>` block.

## Motion (optional, ask or infer)

Write it as a separate `<name>.css` beside the SVG. Skip it unless asked or the brief
says "animated", "hover" or "states". Glyphs get no motion.

- **Hover move**: the object does its own thing (a lid lifts, a card slides, a plane takes off and returns). One part moves against the rest. 700 to 1100ms.
- **States**: `data-state="on"` on the svg. "Off" is the resting drawing. "On" is a new pose reached by a transition (about 300ms), and loops only while something is truly ongoing, slow.
- Keyframes: `ei-<icon>-<move>` for hover, `es-<icon>-<loop>` for state loops. The last frame equals the first so the loop seam is invisible. A symmetric icon spins to an identical pose (plus turns 180, not 90).
- Animate only `transform`, `opacity` and `stroke-dashoffset`. Set `transform-box:fill-box` and a `transform-origin` in percent on the part.
- Scope every rule by `.ic-<name>` and select parts with `[data-part="..."]`.
- Always end with a `prefers-reduced-motion:reduce` block that sets `animation:none` and `transition:none`.

See `examples/copy.css` and `examples/trash.css`.

## Process

1. Read the brief. State the kind, the accent (and why that family), and the 2 or 3 layers in one sentence each. Do not ask questions you can answer.
2. Write `<name>.svg` (and `<name>.css` if motion). Run `scripts/paints.mjs` for the paints.
3. Preview: `node scripts/preview.mjs <dir> preview.html` builds a grid of every SVG at 16, 24 and 48px on light and dark panels. Look at it. Open it in a browser and screenshot it if you can.
4. Run the self-check, fix, repeat once. Do not stop at the first draft.

## Self-check

- Legible at 16px: no feature thinner than 1.5 units at 24, no gap tighter than 1.5.
- Same visual weight as the examples: put it next to `examples/` in the preview.
- Optically balanced and inside 2.5 to 21.5 (3 to 21 for glyphs).
- Colour icon: at most 3 layers, strokes 1.8, flat fills, one accent, reads on both panels.
- Glyph: `currentColor` only, 1.75 stroke, wash only if it has a body, never coloured.
- Dark panel: lines (`t1`) still separate from the body (`t2`). If not, raise the body or lower the line.
- File is self-contained: no external refs, no ids, no comments, valid XML (`xmllint --noout` if available).
- Symmetric objects (funnel, headphones, rocket body) mirror exactly around x=12: compare the coordinates of both halves.
- Name says what it depicts.

## Deliver

`<name>.svg` per icon, plus `<name>.css` when it moves, in the folder the user names
(default `./icons/`). Plus `preview.html` if you built one. Say which accent family you
used so the next icon can match.

Worked examples: `examples/copy.svg` (two layers + marking), `examples/trash.svg`
(three tiers, moving lid), `examples/search.svg` (glyph with wash).
