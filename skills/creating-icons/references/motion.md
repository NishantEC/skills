# Motion

Colour icons ship motion by default. Put it in the spec; compose writes `<name>.css`.

```json
"motion": {
  "hover": [
    { "part": "lid", "move": "lift", "origin": "12% 100%", "duration": 1000,
      "keyframes": "0%,100%{transform:translateY(0) rotate(0)}30%,50%{transform:translateY(-1.6px) rotate(-18deg)}72%{transform:translateY(.3px) rotate(1.5deg)}" }
  ],
  "on": [ { "part": "lid", "css": "transform:translateY(-.8px) rotate(-9deg)" } ],
  "loops": [ { "part": "dot", "move": "pulse", "duration": 2400, "keyframes": "0%,100%{opacity:1}50%{opacity:.5}" } ]
}
```

- `hover`: one entry per moving part. Plays on `:hover` of the svg or of its parent button. `move` names the keyframes `ei-<icon>-<move>`. Default `duration` 900ms. Optional `delay`, `ease`.
- `on`: the pose reached when `data-state="on"` (transition 380ms with a slight overshoot). Optional `delay` to stagger. A `badge` in the spec scales in automatically.
- `loops`: only while on and only when something is truly ongoing. Slow (2 to 3 s), last frame equals first.
- `origin`: percentages are relative to the part's own box. For a pivot that is not the part's centre (a hand, a lid hinge, a whole-icon tilt) use `"box":"view"` and px in viewBox units: `"origin":"12px 12px"`.

## Rules

1. One part moves against the rest. Everything moving at once is a wobble, not a move.
2. The move says what the object does: lid lifts, hand sweeps, flap opens, arrow rises, shutter blinks, needle swings, bell rings.
3. Last frame equals the first, so replays have no seam. A symmetric part turns to an identical pose (a four-point star turns 90, a plus 180).
4. Only `transform`, `opacity`, `stroke-dashoffset`.
5. 700 to 1100ms. Settle with a small overshoot (72% frame at 0.3 to 1.5 units past rest, then rest).
6. Reduced motion is emitted for you: `animation:none; transition:none`.
7. Stay inside the 24 box. Swept geometry (rotated lids, lifted paper, flames that stretch) plus the 0.75 rim must remain within 0 to 24. A part that starts at y 2.6 cannot lift 1.6: rotate it less or move it only sideways. `preview.mjs --motion` measures this per part and prints `overflow` (must be 0.00).
8. Pivot on a real hinge, one the viewer can see: lid hinge, bell knob, handle root. Tilts of 7 to 12 degrees on large parts, 15 to 20 on small ones.
9. `--motion` also fails a hover that lasts under 600 or over 1300 ms, a last frame that differs from the first (the seam), and an off state that does not return to the drawn pose.

## Recipes (keyframes)

| Move | Keyframes |
| --- | --- |
| lift and settle | `0%,100%{transform:translateY(0)}35%{transform:translateY(-2px)}65%{transform:translateY(.4px)}` |
| tilt open (hinge at bottom-left) | origin `10% 100%`, `0%,100%{transform:rotate(0)}35%,55%{transform:rotate(-16deg)}75%{transform:rotate(2deg)}` |
| ring (bell, alarm, phone) | `view` box, `0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}` |
| sweep (hand, dial, needle) | `view` box, `0%{transform:rotate(0)}80%{transform:rotate(375deg)}100%{transform:rotate(360deg)}` |
| pulse (glow, halo) | `0%,100%{transform:scale(1)}35%{transform:scale(1.14)}65%{transform:scale(.96)}` |
| twinkle (small marks, staggered with `delay`) | `0%,100%{transform:scale(1)}40%{transform:scale(.4)}70%{transform:scale(1.25)}` |
| blink (shutter, eye) | `0%,100%{transform:scaleY(1)}40%{transform:scaleY(.08)}70%{transform:scaleY(1.06)}` |
| slide apart (two sheets) | front `translate(-1.8px,1.8px)`, back `translate(1.8px,-1.8px)` at 36%, overshoot 66% |
| rise and return (upload) | `0%,100%{transform:translateY(0);opacity:1}40%{transform:translateY(-3px);opacity:0}41%{transform:translateY(3px);opacity:0}70%{transform:translateY(-.4px);opacity:1}` |
| slider travel (knobs, staggered) | `0%,100%{transform:translateX(0)}40%{transform:translateX(3px)}70%{transform:translateX(-.5px)}`, knob 2 uses `-3px`, `delay` 80 |
| spin (gear) | `view` box, `0%{transform:rotate(0)}100%{transform:rotate(45deg)}` for 8 teeth (one tooth step) so the end pose matches the start |

## On states

"Off" is the resting drawing. "On" is a pose that means something: open, active, filled,
unlocked, uploading, saved. Use `rest` (`[{"part":"x","css":"opacity:.4"}]`) when the off pose
differs from the drawn pose. The badge dot always appears in the on state.
