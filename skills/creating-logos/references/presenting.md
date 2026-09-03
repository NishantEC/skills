# Presenting each stage

The client judges by eye, never from path data or prose. Every gate needs something
rendered. What you render changes by stage.

## What each stage shows

| Stage | Show | Deliberately absent |
| --- | --- | --- |
| Landscape | contact sheet of real competitor marks at 256 / 32 / 16 | any of your own work |
| Direction | placeholder subject in each offered finish | the real silhouette (it would bias the finish choice) |
| Sketch | many silhouettes, one finish, construction grid visible | colour, material, wordmark |
| Refine | 2–3 marks at 16 / 32 / 64 on light and dark | alternatives already killed |
| Finish | rendered raster at fidelity, colourways | construction grid |
| System | lockups and in-situ mockups | isolated marks on white |

**Keep the construction visible in the sketch stage.** A dashed safe area and centre
axes let the user argue about proportion instead of vibes.

## In situ, at stage 7

An isolated mark on a white card always looks fine. That is the problem. Put it
where it will actually be seen, and problems appear immediately:

- **macOS dock / app grid** — beside real icons, at 64px, on both wallpapers
- **Browser tab** — 16px, next to five other favicons, truncated title
- **App header** — at the real size, in the real UI, beside the real nav
- **OG / share card** — 1200×630, mark plus wordmark, as it lands in a feed
- **Avatar** — circular crop, which silently destroys corner-heavy marks

The circular crop and the 16px tab are the two that fail marks most often.

## Rendering

Any of these produce real raster; use whichever the machine has.

```sh
qlmanage -t -s 512 -o out mark.svg              # macOS, no deps — see pipeline.md traps
chrome --headless --disable-gpu --screenshot=out.png \
       --window-size=W,H --hide-scrollbars file:///board.html
```

Chrome handles SVG filters, blurs and gradients more faithfully and is the better
choice for the finish stage. `qlmanage` is fine for flat sketches and is the path
for `.icns` slots.

**Look at every render yourself before showing it.** Half of what you draw will have
a misread in it, and none of them are visible in the source.

## Boards

One HTML page per gate, rendered to PNG. Give every board a title stating the stage
and the choice being asked for, so the user knows what they are deciding.

If the runtime has an annotation surface (Lavish or similar), open the board there —
being able to point at a mark beats describing it in prose.
