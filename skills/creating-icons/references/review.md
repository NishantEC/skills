# Render and fix

Do not finish on the first draft. The preview image is the test.

```bash
node scripts/compose.mjs icons/<name>.json icons
node scripts/check.mjs icons
node scripts/paints.mjs <accent>
node scripts/preview.mjs icons icons/preview.html --png icons/preview.png --motion icons/motion
```

Open `icons/preview.png` with the image viewer. It has three columns, all real renders of
the unmodified SVG CSS: light, dark through `prefers-color-scheme`, dark through the `.dark`
class (OS light). Per icon: 16px small variant, 16px full, 24, 48, 96, then the on state and
a mid-hover frame. The script prints whether the two dark columns resolve to identical paints and
whether `.light` beats a dark OS. Look at it before reading anything else.

Then open `icons/motion/contact-sheet.png` (7 hover frames, 4 on frames, 3 off frames per icon, with the dashed 24 box and dotted live area) and read the printed table. Every line must say `ok`. Fix the spec, not the report. `icons/motion/<name>.gif` and `.mp4` are the recordings to attach or inspect.

## Look for

1. **At 16 and 24**: can you name the object? If a mark has gone to mush, delete it or fatten it.
2. **Depth**: can you see three tiers and the peeking back plate? If the icon reads as one flat shape, offset t3 further or enlarge it.
3. **Size**: does the icon fill the cell like the examples next to it? Compare with `examples/` by copying one into the same folder temporarily.
4. **Rim joins**: where two parts overlap, is there a clean rim line between them? Overlap more if not.
5. **Dark**: are marks (t1) readable on the body? Is the body clearly brighter than the plate? Is the rim crisp? If a tier looks muddy, change the accent, not the paint maths.
6. **Balance**: optical centre, no lopsided mass. Compare left and right halves for anything that should be symmetric; use `mirror`.
7. **Detail density**: compare the first two cells (16 small, 16 full). The small one must be the more readable. More than 3 interior marks at 16px is clutter; ear cups, flames, tails and clappers must not be thinner than the minimum sizes in `references/shapes.md`.
8. **Motion**: the contact sheet and the printed table: no overflow, no seam, hover 700 to 1100 ms, reduced motion ok. Then the mid-move cell: is the move readable and does it stay inside the cell? Does the part pivot where a real object would?
9. **On cell**: is the on pose visibly different and does the badge fit its corner?
10. **Family**: does it look like it belongs with the examples (same radii, rim weight, line width)?

## Fix and rerun

Make the fix in the spec, recompose, render again. Repeat until nothing in the list bothers
you. Note what you changed in one line per fix. Then confirm `check.mjs` passes and
`paints.mjs` says all targets met.
