---
name: creating-logos
description: Use when asked to design or redesign a logo, app icon, brand mark, mascot, favicon, or menu-bar glyph — including .icns/.ico app icons, and when an existing mark needs new styles, colourways, or export sizes.
---

# Creating Logos

## Overview

You are running a design engagement, not a drawing task. A hired designer does not
open the canvas first — they take a brief, study the landscape, agree a direction,
sketch, refine, then finish. **Each stage ends with the client seeing something and
choosing.** Skipping to shapes is the single most common failure, and it produces
work that is competent and wrong.

Marks are also decided at the size they ship at, not the size you draw them at.
Everything technical here follows from that.

## The journey

Run these in order. Do not start a stage before its predecessor's gate is closed.

| # | Stage | You do | Gate — user chooses |
| --- | --- | --- | --- |
| 0 | **Read the room** | Inspect the project before asking anything | *(no gate — never ask what you can read)* |
| 1 | **Brief** | Present a filled-in brief to correct | Brief is right |
| 2 | **Landscape** | Fetch competitor marks and **decode why each is what it is** | Where the white space is |
| 3 | **Meaning** | What the mark must *say* — from the name and the product | The idea it carries |
| 4 | **Direction** | Territories × finish, with a rendered style sample | Territory + finish |
| 5 | **Sketch** | Many rough silhouettes, one finish, construction grid | Narrow to 2–3 |
| 6 | **Refine** | Optical size, small-size tests, one axis at a time | One mark |
| 7 | **Finish** | The chosen style at full fidelity, colourways | Colourway |
| 8 | **Prior art** | Reverse-image search the winner before it ships | Accept or push it further |
| 9 | **System** | Lockups, single-tone glyph, favicon, in-situ mockups | Sign-off |
| 10 | **Handoff** | Every surface it must land on, exports, verification, brand note | — |

Announce which stage you are in each time you report. The user should always know
how far through the journey they are and what the next choice is.

**One decision per gate. Never bundle.** A gate is a conversation, not a form — the
user will often want to think out loud about a choice, ask for it rendered
differently, or change the question. Bundling three decisions into one
AskUserQuestion call denies them that on all three, and the answers to the later
ones are usually contingent on the earlier ones anyway. Ask, discuss, land it, then
ask the next.

### 0–2. Read the room, brief, landscape

Read README, manifest, theme tokens, existing assets and marketing copy **before a
single question**. Then present a filled-in brief to correct, asking only what a repo
cannot answer — chiefly *the one word it should feel like*. `references/brief.md` has the
questions and how to pre-fill each.

**If the user brings their own drawing, that is the direction.** Read it, measure it,
name the rules it is already following (angles, weights, rhythm, what the asymmetry
is doing), and work *from* it — corrections, then variations on its own DNA.
Answering someone's own mark with a fresh set of your concepts reads as ignoring
them, however good the concepts are.

**If they name a reference (a site, a product, a screenshot): fetch it and look at
it.** A description of "vibrant, dimensional, mascot-led" produces something quite
different from what those words actually mean.

Then pull the real marks of 10+ competitors and 10+ admired neighbours and view them
at 256 / 32 / 16px. **A contact sheet is not a study.** Collecting logos tells you
what the category looks like, never why — and a mark drawn from "what the category
looks like" is a shape with no argument behind it.

### 3. Meaning — what the mark has to say

Before a single shape, decode. For each competitor: what is the mark depicting, and
how does that relate to its name? A pattern almost always falls out, and it is
usually your brief. Then find your own from two sources — **the name** (split it,
look up the root; if it has an etymology the brief is often sitting in it) and **the
product's own loop** (what goes in, what comes out, and the flank its marketing
defends more than once).

Output one line saying what the mark depicts, plus a short must / must-not list.
Show it and get it agreed. Everything after this is execution; a mark that skips
this stage is decoration. `references/decoding.md` has the method and a worked example.

### 4. Direction

Two decisions, and they are different questions:

- **Territory** — what the mark is *about* (the idea).
- **Finish** — what it is *made of*. Offer from the style catalogue below.

**The finish options must be style names from the table.** If your options are
project directions ("refine the existing mark", "revisit direction X", "fresh
forms"), you have asked the wrong question — that decides what to draw, not what it
is made of, and it silently locks the whole job into flat vector.

| style | what it is | small-size behaviour |
| --- | --- | --- |
| **module / dot-matrix** | one repeated cell on a grid | coarse grids survive; 8+ cols mush below 32px |
| **gradient mascot** | glossy, dimensional, volume from radial gradients | holds well; drop gloss below 32 |
| **line art / monoline** | stroked outline, one weight | needs a heavier drawing below 32 |
| **solid silhouette** | flat filled, single tone | the best small-size survivor |
| **sticker / die-cut** | keyline plus drop shadow, flat interior | very legible small |
| **glass** | translucent, refractive, rim-lit | poor — loses its form |
| **neon** | stroke plus additive glow on near-black | survives, glow scales |
| **clay** | matte soft 3D, no specular | edges soften on light grounds |
| **seal / badge** | mark inside a container | excellent — the container carries it |

`references/styles.md` has recipes and the fuller catalogue. **Module and gradient-mascot are
the two proven end to end** — say so when offering.

**Show the finishes, do not describe them.** Draw one crude placeholder subject in
each offered style and render it. Nobody has ever correctly imagined "clay" from
the word. The same goes for the register at stage 1: four adjectives are four
arguments, four small identities on screen are a choice.

**Every option must carry its argument from the product.** Naming a register ("the
Linear look") is a reference, not a rationale. For each option give the **bet**, why
it fits *this* product (tied to concrete facts), **what it costs**, and who already
owns it. The cost line is the one that makes the choice real.

**Concept with image generation, not by hand-coding shapes.** Hand-authored SVG
primitives reliably produce *diagrams of an idea* rather than designed objects, and
they all carry the same crude fingerprint. Generate candidates, curate, then
vectorise the winner parametrically. Gemini: `gemini-3-pro-image`, `generateContent`
with `responseModalities:["IMAGE"]`; prompt "NO text, NO letters, flat vector, no
3D, no gradient" or it adds type and bevels.

**Before designing any artifact type — an OG card, an ad, an app icon — pull ten
real ones first.** You will otherwise default to the layout you imagine rather than
the one the field actually ships, and those differ badly. Ten real OG cards show
that essentially nobody uses a headline beside a feature panel with bullets; that is
a pitch slide, and it is the thing you will draw from memory.

### 5–6. Sketch, refine

Rough and monochrome on a construction grid: squircle bound, dashed safe area, centre
axes, left visible so proportion can be argued with. **Set optical size first** —
marks want ~0.78–0.88 of the safe area; filling it reads heavy, and that bug survives
every restyle until someone checks it. **Vary ONE axis at a time.**

Judge at 16 / 32 / 64px on light and dark. **Render and look at every iteration** —
`references/misreads.md` catalogues failures like *eye-above-arch reads as a person glyph*,
findable only by looking.

### 7. Finish

Apply the chosen style at full fidelity: gradients, cast shadow, contact shadow, rim
light, the lot. **Deliver rendered raster, not a browser board** — an HTML/SVG page is
a working tool, and shipping one silently defaults the job to flat vector regardless
of what was picked at stage 3.

**If the chosen concept came out of an image model, trace it — do not redraw it.**
Measure the raster: find the angles by rotating until the parts line up, read the
run lengths off the pixels, then rebuild it parametrically and diff your vector
against the source. Anything above a few per cent disagreement means you changed
it. Do not "tidy" what you were given; the irregularity you smooth away is often
the thing they picked.

### 8. Prior art

Reverse-image search the winner *before* it ships, and report two things separately:
**exact matches** (none is the answer you want) and the **visual family** (rarely
empty, and the honest version of this is not "nothing collides"). Note whether any
near-neighbour is in the same category — that is what decides whether similarity
actually costs anything. `references/shipping.md` has the method and the browser workaround.

### 9–10. System and handoff

Lockups, the single-tone glyph, the mark *in situ*, and then **every surface it has
to land on** — which is always more than the obvious one. `references/shipping.md` has the
audit list; the surfaces people forget are the raster fallbacks and any page your
users' own customers see.

## The one rule that changes the work

**A single-tone mark is mandatory wherever the renderer tints an alpha mask.**
`gpui::svg()`, macOS template images, and most icon-font pipelines composite
coverage, not colour — a multi-colour file becomes a solid blob. Ask where the mark
renders. If any surface is alpha-masked, that surface gets its own single-tone
drawing, and the colourful version is a *different file*. This is normal: colourful
app icon, template glyph in the menu bar.

## Red flags

**Research and meaning**
- Asking the user something the README answers → read the room first
- Collected competitor marks but never said why each looks like that → a sheet, not a study
- Drawing before you can state in one line what the mark depicts → stage 3 is missing
- Never looked up what the product's own name means → the brief may be sitting in it
- A reference was named and you haven't downloaded it → fetch and look

**Asking**
- Your finish options are project directions, not style names → wrong question
- Offering finishes or registers as words with no rendered sample → draw them
- Options justified by a reference brand, or with no cost stated → you are selling, not advising
- Several decisions bundled into one question → they can't brainstorm any of them
- "Classic" or "classy" taken to mean ornament → show two readings and ask

**Drawing**
- Concepting by hand-writing `<rect>` and `<path>` → you are drawing diagrams; generate instead
- Designing an artifact type without pulling ten real ones → you'll ship a layout nobody uses
- User showed you their own mark and you replied with your own concepts → work from theirs
- Tidying a concept you were asked to reproduce → trace and diff it instead
- Variant set changes both silhouette and finish → you'll learn nothing; split it
- Rendered nothing yet but have opinions about the shape → render first

**Finishing**
- Deliverable is an HTML/SVG board and nothing rasterised → not finished
- "Nothing collides" after eyeballing a few favicons → run the reverse-image search
- About to scale one drawing to all sizes → per-size drawings
- Declaring it shipped without fetching the live URLs → verify against production

## Rationalizations

| Thought | Reality |
|---|---|
| "I know this product, I can skip the brief" | You know the code. You don't know what they want it to *feel* like. |
| "They already told me the direction" | A direction is not a finish. Ask what it is made of. |
| "The study is a nice-to-have" | It is what stops you drawing a mark a competitor already owns. |
| "I collected the logos, that's the study" | Collecting is not decoding. Say why each one looks like that or you learned nothing. |
| "The name is just a name" | Half the category draws the verb in its own name. Look up the root before you draw. |
| "I know what an OG card looks like" | You know what you have seen. Pull ten real ones; the format you imagine is usually a pitch slide. |
| "I'll show them one great option" | A designer shows a range and lets the client choose. One option is a verdict. |
| "The SVG board shows the idea fine" | Flat boards sell flat marks. Render at fidelity or you have decided for them. |
| "Asking at every stage will annoy them" | Gates are one question each, pre-filled. Silent divergence annoys more. |

## Reference

- `references/brief.md` — the discovery questions, and how to pre-fill them from a project
- `references/decoding.md` — turning a competitor sheet into a brief; what the mark must say
- `references/shipping.md` — prior-art search, and every surface the mark has to land on
- `references/styles.md` — nine styles, recipes, output formats
- `references/presenting.md` — how to show each stage, and in-situ application mockups
- `references/pipeline.md` — SVG → raster → `.icns`, the four toolchain traps, verification
- `references/misreads.md` — catalogue of observed perceptual failures
