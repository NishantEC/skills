# creating-icons

An agent skill for drawing UI icons as a family: rich colour icons for objects and mono
duo-line glyphs for controls, each as a standalone SVG with light and dark paints built in,
plus hover motion and an on/off state in plain CSS.

## What it does

- Two kinds, decided first. Controls are never coloured, objects always are.
- Colour icons are built as stacks: a back plate, a body, marks, a gloss, with a dark rim,
  a soft shadow and per-tier gradients. The agent writes only geometry in a small JSON spec;
  `scripts/compose.mjs` generates the SVG and the motion CSS.
- `scripts/paints.mjs` derives light and dark paints from one accent and prints contrast
  ratios for marks, body, plate and rim, with pass/fail targets.
- `scripts/check.mjs` lints a folder: live area, piece and tier counts, ids, motion rules.
- `scripts/preview.mjs` builds a sheet at 16, 24, 48 and 96px on light and dark, with off,
  on, mid-move and hover cells, and can screenshot it (`--png`, optionally `--cdp`).
- A mandatory render-and-fix loop, a detail budget per size, archetype recipes, motion
  recipes, and ten worked examples (seven colour, three glyph) with their specs.

Needs `node` 22 or newer. Screenshots use a local Chrome or any Chrome DevTools endpoint.
Built for Claude Code, but the process is not tool-specific.
