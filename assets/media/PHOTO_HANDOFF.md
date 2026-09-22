# Award photo handoff

These are metadata-free JPEGs prepared from Google Drive's full-size browser previews. The original Drive files were not downloaded or changed. Preview width is 1,179–1,321 px; use the originals later if larger source images are needed.

| Site file | Drive file | Suggested use |
| --- | --- | --- |
| `signalbridge-team.jpg` | `9e2c3dd7-cf7d-4135-a51d-6272491f096b.JPEG` | SignalBridge group photo |
| `signalbridge-award.jpg` | `82d42bce-264f-4f05-a77a-4aa236879842.JPEG` | SignalBridge award handover |
| `meant-team.jpg` | `106dca10-9fc4-4170-aadf-cb62b193799d.JPEG` | MEANT team with award and project poster |
| `meant-award.jpg` | `9a45b34e-f639-4c66-b91d-c1ea249451ae.JPEG` | Dell InnovateFest second runner-up stage photo |
| `knowcad-team.jpg` | `f12587d5-c764-4ee6-b234-b330f05b2d83.JPG` | KnowCad team at Autodesk event |
| `knowcad-award.jpg` | `IMG_2002.jpg` | KnowCad champion photo |

Wire these into `data/media.json`. The current schema has two SignalBridge win slots but only one each for MEANT and KnowCad, so add their second slots in the same pattern. Preserve the full image wherever possible; avoid cropping faces, the award, or readable event text. Set alt text and captions based on the visible people and event, without guessing anyone's name. These public event photos are separate from KnowCad's private product materials.


## What was placed, and what was not

Four of the six are live. `win-meant-handover` (from `signalbridge-award.jpg`)
and `win-meant-team` sit on the Dell InnovateFest row; `win-knowcad-champion`
and `win-knowcad-team` sit on the Autodesk row. Each served file is a WebP copy
capped at 1400px; the uploads above are untouched, as are the Drive originals.

**The two SP InnovateDash slots are still empty, on purpose.** Both files
labelled for SignalBridge are Dell InnovateFest photos:

- `signalbridge-award.jpg` — the plaque in this shot is engraved **2nd Runner
  Up** under the Dell InnovateFest logo, and the backdrop is the montage strip
  from the Dell stage screen. It is the same handover as `meant-award.jpg`,
  shot closer. It is now the MEANT handover photo.
- `signalbridge-team.jpg` — a whole-cohort group photo with the same official
  and the same Dell stage backdrop. Not placed; the event is Dell, not SP
  InnovateDash, and it does not show the SignalBridge team specifically.

SignalBridge won **Champion at SP InnovateDash**, so filing a 2nd Runner Up
photo under that row would have put a caption next to an award that visibly
contradicts it. The row shows its drawn fallback until a real SP InnovateDash
photo exists.

`meant-award.jpg` (the wide stage shot whose screen reads *Dell InnovateFest
2026 — Polytechnic 2nd Runner-up*) is also available if you would rather use it
than the close handover.
