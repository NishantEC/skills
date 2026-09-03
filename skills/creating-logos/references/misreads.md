# Misreads

Every entry below was found by rendering something and looking at it. None was
predicted in advance, and none is visible from the path data. This is the argument
for rendering every iteration rather than reasoning about geometry.

## The catalogue

| what was drawn | what it read as | fix |
| --- | --- | --- |
| eye circle sitting above a tall arch | **a person glyph** — two little user avatars | flatten the arch, move it out from under the eye |
| one paw centred below the face | **a mouth** | two paws, or none |
| detached cell wrapped in a keyline | **a mitten** | exclude detached cells from the outline pass |
| straight-sided head on a grid | **an arcade invader** | taper the sides inward toward the chin |
| square knocked-out eyes on a grid | **robot status LEDs** | drop the eyes, or make them non-square |
| blunt two-cell ear tops | **not ears at all** | step 1 → 2 → 3 cells to a point, with a notch between |
| two ear shapes alone, no interior | **mountains** | inner-ear cut — no mountain has one |
| an arched body silhouette | **a lowercase letterform** | change the arch or abandon the pose |
| gloss ellipse not clipped to the form | **a floating oval on the background** | clip it to the form |
| rim light with its blur removed | **a hard glass edge** | remove the element, don't unblur it |
| subject and ground at the same value | **nothing — it disappears** | push contrast hard; premium marks separate hard |
| flat black subject | **a hole in the icon** | charcoal-to-black gradient plus a rim light |

## How to catch these

**Render, then look.** Not once at the end — at every iteration. The failures above
are all invisible in source and obvious on screen.

**Look at the small sizes magnified.** Nearest-neighbour blow-ups of the 16/32px
renders show pixel-level decisions that a 1024 render hides.

**Put candidates on one contact sheet at identical size.** Across-board comparison at
matched scale exposes value and weight problems that per-image review misses —
grid-built marks read noticeably lighter than solid ones at the same size, because
the cell gaps are negative space.

**Composite over both light and dark grounds.** A mark that only works on one is half
finished.

## Measuring instead of arguing

When a judgement is contested, measure it. Two examples that changed a decision:

- **"The eyes won't survive 16px."** Diffing the eyed and eyeless renders at 16px:
  8 of 256 pixels differ, max delta 191/255, ink coverage 27.8% vs 29.3%. The eyes
  survived. The claim was wrong and a whole second drawing was deleted.
- **"Something is painting a halo in the margin."** Sampling the corner alpha gave
  163/255 — exactly the panel's own fill alpha, which identified the offending layer
  in one probe instead of an argument.

Colour-sample, diff, and count pixels. It is faster than another round of opinions.
