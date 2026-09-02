# Demo asset attribution

**These files are NOT MIT.** The skill's code and documentation are MIT; the demo asset
below is a derivative of a CC BY-SA 3.0 photograph and inherits that licence.

## Source

- **File:** `starfish-source.jpg` (downscaled from the original)
- **Title:** Horned Starfish Macro
- **Author:** Jon Zander (Digon3)
- **Origin:** https://commons.wikimedia.org/wiki/File:Horned_Starfish_Macro.JPG
- **Licence:** [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## Derivatives in this folder

`atlas.png` and `frames.json` are derived from that photograph and are therefore also
**CC BY-SA 3.0**. If you redistribute them, keep this attribution and the share-alike
terms. If you build your own asset with this skill none of that applies to your output —
it is governed by whatever licence your own source carries.

## Reproducing it

```bash
ffmpeg -loop 1 -i demo/starfish-source.jpg -vf \
  "pad=2400:2400:(2400-iw)/2:(2400-ih)/2:color=white,rotate=2*PI*t/8:c=white:ow=2400:oh=2400,scale=1100:1100,format=yuv420p" \
  -t 8 -r 24 /tmp/spin.mp4 -y

python3 scripts/autocrop.py /tmp/spin.mp4 --start 0 --dur 8 --invert
# -> 1081:1081:9:9

python3 scripts/extract.py /tmp/spin.mp4 demo \
  --crop 1081:1081:9:9 --start 0 --dur 8 \
  --frames 48 --cols 84 --mode invlum --floor 0.05 --gamma 0.9

python3 scripts/review.py demo --title "Starfish demo"
```
