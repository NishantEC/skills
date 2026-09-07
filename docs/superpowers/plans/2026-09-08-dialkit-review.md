# DialKit vanilla review migration

Goal: use DialKit 2.0.0 in the standalone video2ascii review without adding a build step or network dependency.

Architecture: vendor the official MIT browser bundle and stylesheet, inline them through review.py, and mount vanilla controls into the existing three-column layout. Keep the renderer state and preset schema. Disable density during rebakes and for legacy workdirs; restore it on errors. Keep assets pinned and document their provenance.

- [x] Bundle DialKit 2.0.0 and license; embed assets in the generated HTML.
- [x] Replace native control wiring with vanilla mounts and state updates.
- [x] Verify browser interactions, preset output, offline assets, and rebake success/failure/legacy states.
- [x] Update skill documentation, commit and publish the skill update.

Validation: three Python server tests pass. Browser verified legacy density disablement, real ffmpeg rebake (56 to 84 columns), missing-source recovery, palette/toggle changes, OKLCH-to-hex export and Copy preset. The page embeds all CSS/JS and uses system fonts.
