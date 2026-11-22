# creating-icons

An agent skill for drawing UI icons as a family: rich layered colour icons for objects, flat colour
icons (the same spec in plain tone fills, no rim, gradient, gloss or shadow) and mono
duo-line glyphs for controls, each as a standalone SVG with light and dark paints built in,
plus hover motion and an on/off state in plain CSS.

## What it does

- Three styles, decided first: layered colour, flat colour, glyph. Controls are never coloured, objects are layered or flat. Every colour spec renders both layered and flat (`"style":"flat"` for flat only).
- Colour icons are built as stacks: a back plate, a body, marks, a gloss, with a dark rim,
  a soft shadow and per-tier gradients. The agent writes only geometry in a small JSON spec;
  `scripts/compose.mjs` generates the SVG and the motion CSS.
- `scripts/paints.mjs` derives light and dark paints from one accent and prints contrast
  ratios for marks, body, plate and rim, with pass/fail targets.
- `scripts/check.mjs` lints a folder: live area, piece and tier counts, ids, motion rules.
- Every colour icon also ships `<name>.flat.svg` and `<name>-16.flat.svg`; `preview.mjs --compare` shows layered, flat and glyph side by side at 16, 24 and 48px in light and dark.
- Every colour icon ships a full file and a simplified `<name>-16.svg` for sizes up to 20px.
- `scripts/preview.mjs` builds a sheet at 16 (small and full), 24, 48 and 96px in three real
  renders (light, `prefers-color-scheme` dark, `.dark` class) and asserts the dark paths match
  (`--png`), and records hover/on/off motion to GIF and MP4 with overflow, seam, duration and
  reduced-motion checks (`--motion`). Optionally `--cdp` for a shared Chrome.
- A mandatory render-and-fix loop, a detail budget per size, archetype recipes, motion
  recipes, and eighteen worked examples (fifteen colour, three glyph) with their specs.

Needs `node` 22 or newer, and `ffmpeg` for the motion recordings. Screenshots use a local Chrome or any Chrome DevTools endpoint.
Built for Claude Code, but the process is not tool-specific.
