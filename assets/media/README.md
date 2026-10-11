# Media

Drop image and video files in this folder, then name them in `data/media.json`.
Nothing here is required — every slot has a designed fallback, and a slot with
no file looks finished rather than empty. No filenames or instructions are ever
shown on the site itself.

## How to add a photo

1. Put the file in this folder, e.g. `innovatedash-team.jpg`.
2. Open `data/media.json` and fill that slot in:

   ```json
   "win-signalbridge-team": {
     "src": "innovatedash-team.jpg",
     "alt": "The SignalBridge team on stage at SP InnovateDash",
     "caption": "The team, right after the result"
   }
   ```

- `alt` is required whenever `src` is set — it is what a screen reader
  announces, so describe what is in the photo.
- `caption` is the line printed under the photo. Leave it `null` and no caption
  appears; the drawn fallback never carries one, so nothing on the page ever
  claims a photograph that is not there.
- `focal` (optional, default `50% 50%`) keeps the important part of the image
  in frame when the crop is tighter on a phone.

To remove a photo again, set `src` back to `null`. The fallback returns.

## Slots

| Slot | Ratio | Suggested size | Where it appears |
| --- | --- | --- | --- |
| `about-portrait` | 4:5 | 900 × 1125 | About. Crop to head and shoulders. |
| `about-candid` | 3:2 | 1200 × 800 | About, optional. With no file the block is removed entirely rather than left blank. |
| `win-signalbridge-team` | any | ≥ 1200 wide | Wins, SP InnovateDash — the group picture. **Empty:** no SP InnovateDash photo has been supplied yet. |
| `win-signalbridge-award` | any | ≥ 1200 wide | Wins, SP InnovateDash — you receiving the award. **Empty**, same reason. |
| `win-meant-handover` | any | ≥ 1200 wide | Wins, Dell InnovateFest — taking the plaque on stage. |
| `win-meant-team` | any | ≥ 1200 wide | Wins, Dell InnovateFest — the team with the plaque and the MEANT poster. |
| `win-knowcad-champion` | any | ≥ 1200 wide | Wins, Autodesk hackathon — the result on the screen. Also the proof photo on the KnowCad case page. |
| `win-knowcad-team` | any | ≥ 1200 wide | Wins, Autodesk hackathon — the team with the trophies. |

An award photo is **never cropped.** The frame takes the file's own aspect ratio
as it loads, and the two frames in a row share one height, so their widths come
out proportional. Any shape works: nothing will cut a face, an award or readable
event text. The `3:2` in the markup only shapes the drawn fallback.
| `<project>-shot-1`, `-shot-2`, `-shot-3` | 16:10 | 1600 × 1000 | Case page evidence. App frame only — no browser chrome, no real names or personal data. |
| `<project>-demo` | 16:9 | ≤ 8s, muted | Case page. Set `poster` to one of the screenshots; it is used as the still under reduced motion. |

Project keys are the case-page slugs: `signalbridge`, `meant`,
`better-call-bhai`, `boss-breaker`, `knowcad`. Better Call Bhai's three shots are
the booking flow in order: choosing a service, picking a slot, the confirmation.

KnowCad has no product screenshot slot on purpose — the repository and the
Autodesk materials are private, so the case page proves the work with the award
photo, the LinkedIn post and a public description instead.

## Rules

- No stock photography, and never a generic image standing in for an event
  photo. A slot with no real photo shows its drawn fallback, which does not
  pretend to be a photograph.
- Screenshots must not contain real user data, real names or anything from a
  live conversation, and nothing from a private repository or a client's
  confidential materials.
- A video slot falls back to its poster under reduced motion, and to the drawn
  fallback if neither is set.

## Not in this folder

The homepage's 3D textures are not media slots: `design/build_3d_assets.py` makes them in
`assets/3d/` from the raw captures (kept outside this repository) and from the photos here.

The Better Call Bhai testimonial is not a media slot: it is the owner's own message, kept in
`data/content.json` with a note of what was cut.
