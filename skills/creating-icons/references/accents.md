# Accent families

Pick the family by meaning, then reuse its hex for every icon in that family. Run
`node scripts/paints.mjs <hex>` for the paints.

| Meaning | Hex | Typical objects |
| --- | --- | --- |
| Action, direction, navigation | `#5393FF` | arrow, plus, minus, undo, quote, corners |
| Structure, layout, media | `#8B6CF0` | grid, table, list, align, sidebar, columns, play, image, microphone |
| Growth, success, visibility | `#2FB37F` | chart, check, search, filter, eye, toggle, trend, pulse |
| Danger, close, location | `#F2643F` | trash, close, target, prohibit, map pin |
| Energy, highlight, warmth | `#F2A41F` | lightning, bookmark, pin, sun, megaphone, magic wand, note |
| Label, celebration | `#F07C3A` | tag, confetti, dropdown |
| People, devices, pointer | `#E85AA0` | link, mouse, cursor, desktop, phone, external link |
| Documents, storage | `#5B63E6` | file, floppy disk, paperclip, moon |
| Branching, flow, time | `#3E9FC4` | caret, git branch, path, tree, hourglass, sign out |
| Soft, unspecific, utility | `#6B7A90` | more, drag handle, hash, wrench, sliders, text style |
| Round, soft shapes | `#E8668A` | circle, square |
| Doors, entry | `#22A39A` | door, key, enter |

Rules of thumb:
- Same family, same hex. All arrows one blue, all carets one teal.
- A new object with no family yet: choose the closest meaning, not a fresh colour. Only add a family when nothing fits, then append it here.
- Keep neutral utility icons grey-blue so they recede.
- Avoid pure red or green at full chroma. The hexes above are already tuned.
