# The bar: what a rich icon does

A flat icon is one silhouette with a colour. A rich one is a small stack of parts with
light on it. These are the measurable differences. Compose already renders the light
(gradient, rim, shadow); you supply the stack and the proportions.

## Stack

| Item | Flat (reject) | Rich (target) |
| --- | --- | --- |
| Pieces | 2 to 3 | 4 to 8, never over 12 |
| Tiers | t2 + a few marks | t3 back plate + t2 body + t1 marks + one gloss |
| Depth cue | none | t3 offset 1.5 to 3 units so it peeks out on one or two sides, or a halo / bezel / ghost sheet |
| Parts that move | none | 1 to 3 named parts |
| Holes | extra shapes | `cuts` through the body |

Tier roles: t3 is behind or around, pale. t2 is the body, mid tone, biggest. t1 is the
strongest tone: marks, hands, slats, lids, caps, small dots. When a part is both the
object and dark (a padlock body), make it t1 and let t2 be the shackle and t3 a halo.

## Size and proportion

- Main mass 16 to 19 units on its long axis; the icon fills the live area (2.5 to 21.5). Thin, small or off-centre shapes are the first sign of a weak icon.
- Body corners 3 to 3.5. Small parts 1.2 to 1.5. Circles are real circles (arcs), not rounded squares.
- Overlap: parts overlap by at least 1 unit so the rim reads between them (a lid over a body, a back sheet under a front sheet). Parts that only touch look pasted.
- Accent details are big enough to be seen at 16px: a flame is 4 to 5 units tall, a lens 5 units wide, a dot r1.2 or more.
- Offset the depth pair the same way every time: back element up and to the right, front element down and to the left (light from the upper left, shadow falls down).

## Detail budget

| Rendered size | Interior marks | Minimum feature |
| --- | --- | --- |
| 16 px | 3 | 1.5 units (1 px) |
| 24 px | 6 | 1.5 units |
| 48 px and up | unlimited, but stop at 8 pieces | 1 unit |

Design for 24, then test at 16. If a mark disappears at 16, delete it or fatten it; do
not shrink everything else.

## Light model (what compose renders)

- Each tier is a vertical gradient: lighter at the top, base tone at the bottom.
- Every shape has a dark rim (1.5 outside stroke by default). The rim is what separates overlapping parts at 16px.
- A soft shadow tinted with the accent falls 1.3 units down (black at 55% in dark).
- A gloss piece is white at 42%: a sliver on the upper left of the body, following its curve. Never a full-width band.

## Dark mode

Dark is re-lit, not inverted. Bodies get brighter and more saturated (OKLCH lightness
0.76 to 0.87), plates sit slightly dimmer (0.64 to 0.74), marks go very dark (0.30) so
they cut into the body, and the rim goes near white (0.93) so edges stay crisp on the
panel. `scripts/paints.mjs <hex>` prints the numbers and these ratios:

| Pair | Light target | Dark target |
| --- | --- | --- |
| marks on body | 3:1 | 3:1 |
| body against panel | 1.6:1 | 6:1 |
| plate against panel | 1.25:1 | 3:1 |
| rim against panel | 3:1 | 8:1 |

## Accent relationships

One accent per icon, from the family table. A small badge, dot or spark inside an icon
uses the same accent at t1, never a second hue. Neutral utility objects (settings, sliders)
use the grey-blue family so they recede, but still get all three tiers.

## Stroke rules

Lines: 1.8 to 2, round caps and joins, t1. A line is never thinner than a feature gap.
Glyph strokes are 1.75, always `currentColor`.

## Optical sizing

Pointing shapes (arrows, rockets, triangles) sit slightly toward their tip. Round things
look smaller than square things, so a circle spans 19 where a square spans 18. Tall objects
(bottle, bulb, tower) use the full height 2.5 to 21.5 and let width follow.
