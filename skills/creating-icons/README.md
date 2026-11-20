# creating-icons

An agent skill for drawing UI icons as a family: colour layered icons for objects and
mono "duo line" glyphs for controls, each as a standalone SVG with light and dark paints
built in, plus optional hover motion and on/off states in plain CSS.

## What it does

- Two kinds, decided first. Controls are never coloured, objects always are.
- A 24 grid, a 3-tier layer structure, accent families by meaning, and a script
  (`scripts/paints.mjs`) that derives exact light and dark paints from one accent.
- One portable SVG per icon: CSS variables, `prefers-color-scheme`, and an optional
  `.dark` or `data-theme` class. No gradients, ids or filters.
- `scripts/preview.mjs` builds a grid at 16, 24 and 48px on light and dark panels.
- Worked examples in `examples/`.

Needs `node` for the two scripts. Built for Claude Code, but the process is not
tool-specific.
