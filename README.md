# skills

Agent skills by [Nishant Gupta](https://github.com/NishantEC). Install with the
[`skills`](https://www.npmjs.com/package/skills) CLI, which resolves straight from
GitHub — there is no registry step:

```bash
npx skills add NishantEC/skills
```

Or take one without installing it:

```bash
npx skills use NishantEC/skills@video-to-ascii
```

## Skills

### `video-to-ascii`

Turns a video into an animated ASCII asset for a website: extracts frames, isolates the
subject, converts each to a character-density grid, serves a local review page for a
human to tune the ramp, colour, contrast and speed, then bakes the approved settings
into a sprite sheet plus a renderer.

Needs `ffmpeg` and `python3`; `yt-dlp` only for YouTube or Vimeo URLs.

It is deliberately opinionated about two things:

- **Real footage beats procedural noise.** Faking an organic shape with metaballs or
  hand-authored curves does not converge. Get a clip, convert its frames, let a human
  approve the result.
- **The background decides everything.** A subject on plain black or plain white
  isolates with one luminance threshold. A busy background cannot be separated by any
  simple rule — verify before committing rather than accepting one and hoping.

[FINDINGS.md](FINDINGS.md) records what was measured while building with it, including
the two bugs that cost the most time.

### `creating-logos`

Designs a logo, app icon or brand mark as an engagement rather than a drawing task:
brief, landscape, meaning, direction, sketch, refine, finish, prior-art check, handoff —
each stage ending in something rendered and one decision for the client.

Its two load-bearing ideas are that a contact sheet of competitor logos is not a study
until you can say *why* each one looks like that, and that the brief is frequently
sitting inside the product's own name. It is also blunt that hand-authored SVG
primitives produce diagrams rather than designs: concept with an image model, then trace
the winner back to exact vector by measuring it.

## Licence

MIT, except `skills/video-to-ascii/demo/`, whose asset derives from a CC BY-SA 3.0
photograph and inherits that licence. See its `ATTRIBUTION.md`.
