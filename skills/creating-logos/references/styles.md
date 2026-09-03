# Styles, outputs, and how to ask

## Asking

Use **AskUserQuestion** with three questions in one call. Do not ask them
sequentially across turns — it is one decision.

Suggested wording:

- **Style** — "Which direction should the mark take?" Offer 3–4 from the catalogue
  below, chosen for the product. Put your recommendation first and say why in the
  description.
- **Output** — "Where does this need to work?" Offer combinations, not single
  formats: a mark usually needs 2–3.
- **Context** — "Do you have a brief, or shall I look at the project?" Make
  *inspecting the project* an option, not just a request for information.

If the user names a reference site or product, that is not a substitute for the style
question — fetch the images, look at them, then ask which of *those* qualities they
want.

## Style catalogue

| style | what it is | best for | small-size behaviour |
| --- | --- | --- | --- |
| **module / dot-matrix** | built from one repeated cell on a grid | dev tools, terminal-adjacent, retro-technical | coarse grids (5–7 cols) survive; 8+ turns to mush below 32px |
| **gradient mascot** | glossy and dimensional, volume from radial gradients | consumer apps, App Store idiom | holds well; drop gloss and rim below 32 |
| **line art / monoline** | stroked outline, one weight, `fill:none` | in-app glyphs, menu bars, favicons | needs a heavier simplified drawing below 32 |
| **solid silhouette** | flat filled, single tone | anywhere needing an alpha mask or theming | the best small-size survivor |
| **sticker / die-cut** | keyline plus drop shadow, flat interior | playful brands, App Store | very legible small |
| **glass** | translucent, refractive, rim-lit | macOS 26 / Liquid Glass adjacent | poor small — loses its form |
| **neon** | stroke plus additive glow on near-black | dark-first products | survives, because glow scales |
| **clay** | matte soft 3D, no specular | warm or toy-like brands | edges soften against light grounds |
| **seal / badge** | mark inside a container | when it must read as a stamp | excellent — the container carries it |

**Module and gradient-mascot are the two proven end-to-end here**; the rest are
sound but less exercised. Say so when offering them.

## Style recipes

### Module / dot-matrix
Author as **ASCII art**, not path data — it is far easier to iterate and read.
One character per region (`#` body, `o` knocked-out eye, `p` inner ear, `w` whisker),
converted to rects at render time.

Rules learned by getting them wrong:
- **Taper the sides.** Straight columns read as an arcade invader. The head must
  narrow toward the chin, stepping inward on both sides.
- **Ears must step to a point** (1 → 2 → 3 cells) with a notch between them. Blunt
  two-cell tops are not ears.
- **Square knocked-out eyes read as robot LEDs.** Dropping the eyes entirely often
  reads *more* like a cat than keeping them.
- **Whiskers are the strongest animal cue** available in a grid, because nothing in a
  machine vocabulary breaks its own outline.
- **Cell gap is the whole character.** 0 fuses into a silhouette (loses the "built"
  idea); 0.28 is unmistakably assembled but noisy small; 0.10–0.16 keeps both.
- **Exclude detached cells from any keyline pass** — a single cell wrapped in an
  outline becomes a 3×3 blob that reads as a mitten.

### Gradient mascot
- **Volume comes from a radial gradient** on the body, light offset toward the
  upper-left, plus a soft cast shadow and a contact shadow at the base.
- **Contrast between subject and ground must be high.** Tonal fails — every premium
  reference separates hard. If the subject and ground share a value, the mark
  disappears at small size regardless of how good the shading is.
- **A dark subject still needs internal form.** Flat black loses all volume: run the
  coat from charcoal to near-black and add a **rim light** on the upper-left edge.
  That rim is the only thing saying "rounded object" rather than "hole".
- **Clip the gloss to the form.** An unclipped gloss ellipse floats on the background
  as a visible oval.
- **Eyes become the focal point on a dark subject** — that is where slit pupils and a
  highlight earn their place.

## Output formats

| format | when |
| --- | --- |
| **SVG (multi-colour)** | web, docs, README, marketing |
| **SVG (single-tone, `currentColor`)** | in-app glyphs; **required** if the renderer tints an alpha mask |
| **PNG set** | raster pipelines, web favicons, docs |
| **`.icns`** | macOS app icon — 10 slots, transparent corners mandatory |
| **`.ico`** | Windows |

Ask where it appears, then derive the set. A mark for "website and terminal" needs
a different bundle from one for "macOS app icon".

**Two files, one animal, is a normal outcome.** If any surface is alpha-masked, the
colourful mark and the single-tone mark are deliberately different drawings. Record
that decision somewhere durable or someone will later "fix" the inconsistency.
