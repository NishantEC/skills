# Spec format

One JSON file per icon, compose turns it into `<name>.svg` (+ `<name>.css`).

```json
{
  "name": "gift",
  "accent": "#F07C3A",
  "edge": "outside",
  "badge": { "cx": 19.2, "cy": 19.2, "r": 2.6 },
  "pieces": [
    { "tier": 3, "d": "M3 9 ... Z" },
    { "tier": 2, "part": "lid", "d": "M... Z", "mirror": true },
    { "tier": "gloss", "d": "M... Z" },
    { "tier": 1, "kind": "line", "d": "M12 9V21", "width": 1.8 }
  ],
  "cuts": [{ "d": "M... Z" }, { "d": "M12 15v2", "width": 1.8, "part": "body" }],
  "motion": { "hover": [], "on": [] }
}
```

## Fields

- `name`: kebab-case, what it depicts. Becomes the file name and the `ic-<name>` class.
- `accent`: hex from `references/accents.md`.
- `edge`: `outside` (1.5 rim behind every shape, default), `inside` (2.2 rim clipped inside tiers 2 and 3), `none`.
- `badge`: small dot that scales in when `data-state="on"`. Put it in a free corner, r 2.4 to 2.7.
- `pieces`, drawn in order, back to front:
  - `tier`: `3`, `2`, `1` or `"gloss"`.
  - `kind`: `shape` (default, filled path) or `line` (stroked path, needs `width`).
  - `d`: path data. Use absolute `M L H V Q C A Z`. Round corners with `Q` control points at the true corner (`L17.5 4.5Q21 4.5 21 8`). Multiple closed subpaths in one `d` are fine (a pair of dots).
  - `part`: names a group that can move. Consecutive pieces with the same part share one `<g data-part>`.
  - `mirror`: `true` adds the mirror image around x=12 (or a number for another axis). Use for symmetric halves.
- `cuts`: holes punched through everything (or only one `part`). Fill = hole, or give `width` for a round-capped stroke hole.
- `motion`: see `references/motion.md`.

## Glyph spec

```json
{ "name": "sidebar", "kind": "glyph", "washes": ["M... Z"], "lines": "M... Z M9.5 4.5V19.5", "dots": [[5.5,12],[12,12],[18.5,12]] }
```

## Rounded rectangles as paths

`rect x y w h r`: `M{x} {y+r}Q{x} {y} {x+r} {y}H{x+w-r}Q{x+w} {y} {x+w} {y+r}V{y+h-r}Q{x+w} {y+h} {x+w-r} {y+h}H{x+r}Q{x} {y+h} {x} {y+h-r}Z`

## Circles as paths

`circle cx cy r`: `M{cx-r} {cy}a{r} {r} 0 1 0 {2r} 0a{r} {r} 0 1 0 -{2r} 0Z`

Compose writes the file; do not edit the generated SVG by hand. Change the spec and rerun.
