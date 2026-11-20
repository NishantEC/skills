# Glyph recipes

Mono duo line on the 24 grid. Geometry inside 3 to 21. Stroke 1.75, round caps and joins,
`currentColor`. Compose writes the theme block (`--icon-ink` with light and dark fallbacks).

| Part | Rule |
| --- | --- |
| lines | One path. Circles are arcs. |
| washes | 22% `currentColor` fill, only for a real body (page, box, lens, funnel, panel, screen). Arrows, chevrons, carets, plus, minus, check, close have none. |
| dots | r1.5, spaced 6.5 (a three-dot row at x 5.5, 12, 18.5) |

Never a zero-width or zero-height shape (use a stroke, or a rounded rectangle for a minus).
Symmetric glyphs: compute the mirror coordinates with `2*12 - x`, then check both halves.

## Recipes

- **Chevron**: spans about 8 x 5. Down: `M7.5 10L12 14.5L16.5 10`, apex on x=12, legs mirrored. The optical centre sits slightly toward the mass, so the box centre is y 12 to 12.5.
- **Arrow**: shaft 14 to 15 long, head legs 5.5 long at 45 degrees, apex at the tip. `examples/specs/arrow-right.json`.
- **Close, plus, minus**: 12 to 14 units long, centred exactly on 12,12.
- **Check**: `M5.5 12.5L10 17L18.5 7.5`, short leg 6 units, long leg 12.
- **Panel / window toggle**: outline rounded rect radius 2.5, a divider line, wash on the smaller side. `examples/specs/sidebar.json`.
- **Funnel (filter)**: wide mouth 14 to 15, stem centred on x=12 exactly, 2 to 2.5 wide, stem length 5. Mirror the left half; the stem must not drift left or right. Wash fills the whole funnel.
- **Search**: lens circle r6.5 centred up-left, handle 4.5 long at 45 degrees. `examples/search.svg`.
- **Dots menu**: three dots, no wash, no line.

Review: a glyph at 16px keeps a 1.75 stroke that is about 1.2px; two parallel strokes need
at least 2.5 units between centres or they merge.
