# creating-logos

An agent skill for designing a logo, app icon or brand mark — as an engagement rather
than a drawing task. A hired designer does not open the canvas first: they take a
brief, study the landscape, work out what the mark has to *say*, sketch, refine, then
finish. Skipping to shapes is the most common failure and it produces work that is
competent and wrong.

Built for [Claude Code](https://claude.com/claude-code), but the process is not
tool-specific.

## What it does

Eleven stages, each ending with something rendered and a single choice for the client
to make. The two that matter most come before any drawing:

- **Decode the landscape, do not collect it.** A contact sheet of competitor logos
  tells you what a category looks like and nothing about why. For each one, write down
  what the mark is depicting and how that relates to its name. A pattern nearly always
  falls out, and it is usually your brief.
- **Find the meaning.** From the product's own name — split it, look up the root,
  because if it has an etymology the brief is often sitting inside it — and from what
  the product actually does, claims, and is anxious about.

Then direction, sketch, refine, finish, a reverse-image check for prior art, and a
handoff that covers every surface the mark has to land on rather than just the obvious
one.

## What it is opinionated about

- **Ask, do not assume.** Style comes from a catalogue the user picks from, not from
  your inference. One decision per gate, never bundled.
- **Show, do not describe.** Nobody has ever correctly imagined "clay" from the word,
  and four adjectives for a brand's register are four arguments where four rendered
  identities are a choice.
- **Hand-coded SVG primitives produce diagrams, not designs.** Concept with an image
  model, curate, then trace the winner back to exact parametric vector — measuring it
  rather than redrawing it, because the irregularity you smooth away is often the thing
  that got picked.
- **Pull ten real examples before designing any artifact type.** Otherwise you draw the
  layout you imagine, which for share cards is a pitch slide nobody ships.

## Files

| file | what is in it |
| --- | --- |
| `SKILL.md` | the eleven stages, red flags, and the rationalizations that precede each failure |
| `references/decoding.md` | turning a competitor sheet into a brief, with a worked example |
| `references/brief.md` | the discovery questions, and how to pre-fill each from a repo |
| `references/styles.md` | nine finishes, their small-size behaviour, and recipes |
| `references/presenting.md` | what to show at each stage, and in-situ mockups |
| `references/pipeline.md` | SVG → raster → `.icns`, and four toolchain traps |
| `references/misreads.md` | perceptual failures found only by rendering and looking |
| `references/shipping.md` | prior-art search, and every surface a mark lands on |

## Licence

MIT.
