# Archetypes

Find the nearest archetype, open its example spec, change it. Coordinates are on the 24 grid.

## Round object (`examples/specs/clock.json`)

Stack: t3 outer disc (bezel) r 8.5 to 9, t2 face r 6 to 6.5 on the same centre, t1 hands and centre dot, gloss crescent on the upper-left of the face, t3 ears or handles drawn BEFORE the disc so they peek out. Centre y at 12.5 to 13 when ears sit on top, so the whole thing stays inside 2.5 to 21.5.
Bezel to face gap is 2.2 to 2.5 units: wide enough to read at 16px, narrow enough to look like a rim.
Rotating parts use `"box":"view"` with an absolute pivot (`"origin":"12px 13px"`).

## Tall object (`examples/specs/bulb.json`)

Stack: t3 halo circle behind the head, t2 body with a long taper, t1 base or cap block at the bottom, t1 internal line detail, gloss sliver on the left of the head. Use the full height (about 3 to 21.5); the width follows (13 to 14). The head is 60% of the height, the neck and base 40%. The cap is a rounded block 7 wide, 3.7 tall with radius 1.2.

## Flat document-like (`examples/specs/receipt.json`, `copy.json`)

Stack: t3 second sheet offset right and down by 2.5 so a slim strip peeks out, t2 sheet 13 wide and 18 tall, t1 text lines of width 1.8 at 3.4 spacing with the last line shorter, gloss triangle on the top-left corner. A distinctive edge (zigzag, folded corner, rounded tab) is what makes it a receipt, a page or a note; give the page exactly one.
Two sheets (`copy`): back sheet up and right, front sheet down and left, overlap at least 5 units.

## Device (`examples/specs/phone.json`)

Stack: t2 chassis with radius 3 to 3.5, t3 screen inset by 2 units on the sides and 2.5 top and bottom with radius 1.2 (the lighter screen reads as glass), gloss as a diagonal stripe across the screen, t1 home bar or speaker slot 2.8 long. A wide device (laptop, tablet) uses the same recipe rotated; keep the chassis 16 to 18 on the long axis.

## Abstract and symbolic (`examples/specs/spark.json`)

Stack: t3 soft disc behind (the glow), t2 the main symbol at full size, t1 two or three small repeats of the symbol at different sizes (7, 5, 4 units) in the corners. Repeats are what make an abstract mark read as a set rather than a blob. A four-point star: control points `(cx±a, cy∓b)`, `(cx±b, cy∓a)` with `a = 0.12 r`, `b = 0.3 r`.

## Pointed vehicle (rocket, plane, ship)

Stack: t3 fins or wings drawn first, 5 to 6 units long and swept out past the body (they carry the silhouette), t2 body 11 to 12 wide (never under 10) with a curved nose, t1 belt or nose cap that breaks the body into two zones, window as two pieces (t1 ring r2.6, t3 inner r1.4 with a gloss dot), gloss sliver on the left, and an exhaust of two pieces behind the body: t1 outer flame 5 to 6 units tall and 5 wide, t3 inner core 3 tall. A flame under 4 units tall disappears at 16px. The exhaust is its own part and stretches on hover (scaleY 1.4 from its top edge).

## Container with a lid

Stack: t2 box body, t1 or t2 lid that is wider than the body by 1.5 units each side and overlaps it by 1 to 2, t3 ribbon, strap or band crossing both, t1 knot or latch. The lid is its own `part` (it moves). The band pieces are separate from the lid so the lid can lift without the band tearing.

## Object with a lens or window (camera-like)

Stack: t2 body 18 wide, t3 top bump or viewfinder peeking above, t1 lens ring (circle r 4), t3 inner lens (r 2.6) with a gloss dot, t1 small indicator. Concentric circles need at least 1.4 units between radii.

## Object with a hole (padlock, ring)

Stack: t1 body, t2 shackle as a line of width 2, t3 halo behind, hole via `cuts`.

## Cloud and arrow compositions

Combine a base silhouette with an action mark: t2 cloud built from 3 overlapping circles and a flat bottom as one path, t3 a smaller cloud offset behind, t1 arrow as a line of width 2 on the t2 body with round caps and a shorter shaft than head. The arrow is its own part (it moves up on hover).

## Mechanical ring (gear-like)

Stack: t2 toothed ring, t1 inner disc, cut hole in the centre. Teeth come from a single closed path with 8 lobes; each lobe 2.5 wide at base, rounded with Q. Use `"box":"view"`, `"origin":"12px 12px"` to turn it.

## Rows of controls (sliders, equalisers)

Stack: t3 plate behind, t1 or t2 tracks as lines width 2, t2 knobs as circles r 2.2 to 2.5 each at a different position along its track (never aligned), gloss on the knobs. Staggered positions are the whole design.
