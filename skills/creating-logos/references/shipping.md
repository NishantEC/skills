# Prior art, and every surface the mark lands on

## Prior art — before it ships, not after

Eyeballing a handful of favicons you chose yourself is not a check; you will only
find what you already suspected. Run an actual reverse-image search.

**Report two things separately.** They are different questions and conflating them
is how "nothing collides" gets said when it is not true:

1. **Exact matches.** None is the answer you want, and search engines say so plainly.
2. **The visual family.** Rarely empty. List the closest, and say for each whether it
   is in the same category — that is what decides whether the similarity costs
   anything. Two marks can look alike and never meet.

An honest result is usually "no exact match, and the shape family is more populated
than we would like, but nobody adjacent is in this market." Say that, rather than
rounding it to "it's unique".

### Getting the search to run

Automated Lens uploads get CAPTCHA-walled. What works: run the browser **headed**
with a persistent profile, expect a CAPTCHA on the first attempt, and ask the human
to clear it once — after that the session holds. On Claude Code specifically,
`chrome-devtools-mcp@1.8` broke the wrapper's calls (it began requiring `pageId`);
pinning `1.7.0` and pointing `CHROME_DEVTOOLS_AXI_MCP_PATH` at it restores them.

If it cannot be automated, say so and hand the user the 20-second manual version
rather than substituting a weaker check and calling it done.

## Every surface

"Ship the logo" always means more places than the obvious one. Audit before
declaring it done — the ones people miss are the raster fallbacks and any page the
*user's own customers* see.

| Surface | Format | Notes |
| --- | --- | --- |
| In-app component | SVG in `currentColor` | One file themes everywhere; do not hardcode a fill |
| Browser tab | SVG favicon | Add a `prefers-color-scheme` rule *inside* the SVG so it inverts on dark chrome |
| `/favicon.ico` | ICO, 16/32/48 | Browsers request it whether or not you link it; missing means a 404 and a blank icon |
| iOS home screen | `apple-touch-icon.png`, 180×180 | Raster only, and composited on white — needs its own opaque container |
| Share cards | 1200×630 | Check the declared `og:image:type` matches the bytes |
| Email | PNG | Verify transparent corners; a fixed-colour mark disappears on a dark client |
| Pages your users' customers see | same as tab | The most-missed surface, and the highest-traffic one |
| Docs, README, marketing kits | SVG | And any skill or generator file with the old mark pasted in |

**ICO and PNG are raster by definition** — they cannot hold paths. That is not a
defect and there is no vector workaround; the SVG serves every modern browser and
these are the fallback. Do say so if someone asks why they look pixelated, and check
your own preview: upscaling a 32px frame with nearest-neighbour makes it look far
worse than it is.

**A transparent ink mark vanishes on dark chrome.** Anything that needs its own
container — app icon, favicon, avatar crop — gets the tile version, not the bare
mark.

## Verify against production, not against your intent

Fetch the live URLs and read what comes back: status, byte size, and the first bytes
of the file. Then parse the served `<head>` and confirm the tags are actually there.
Grepping raw HTML for `og:image` is unreliable enough to produce a false alarm —
parse it.
