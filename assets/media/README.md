# Media

Drop image and video files in this folder, then name them in `data/media.json`.
Nothing here is required — every slot has a designed fallback, and a slot with
no file looks finished rather than empty. No filenames or instructions are ever
shown on the site itself.

## How to add a photo

1. Put the file in this folder, e.g. `me-at-sp.jpg`.
2. Open `data/media.json` and set that slot's `src` to the filename:

   ```json
   "about-portrait": { "src": "me-at-sp.jpg", "alt": "Mruthulan in the SP lab", "focal": "50% 35%" }
   ```

`alt` is required whenever `src` is set — it is what a screen reader announces.
`focal` (optional, default `50% 50%`) keeps the important part of the image in
frame when the crop is tighter on a phone.

To remove a photo again, set `src` back to `null`. The fallback returns.

## Slots

| Slot | Ratio | Suggested size | Where it appears |
| --- | --- | --- | --- |
| `about-portrait` | 4:5 | 900 × 1125 | About. Crop to head and shoulders. |
| `about-candid` | 3:2 | 1200 × 800 | About, optional. With no file the block is removed entirely rather than left blank. |
| `award-sp-innovatedash` | 3:2 | 1200 × 800 | Recognition. Photo from the SP InnovateDash event or prize-giving. |
| `award-dell-innovatefest` | 3:2 | 1200 × 800 | Recognition. Photo from Dell InnovateFest. |
| `award-autodesk` | 3:2 | 1200 × 800 | Recognition. Photo from the Autodesk Singapore AI+ML Hackathon. |
| `<project>-shot-1`, `-shot-2` | 16:10 | 1600 × 1000 | Case page evidence. App frame only — no browser chrome, no real names or personal data. |
| `<project>-demo` | 16:9 | ≤ 8s, muted | Case page. Set `poster` to one of the screenshots; it is used as the still under reduced motion. |
| `loomy-prototype-1` | 16:10 | 1600 × 1000 | Loomy. Labelled as a prototype screen, not a shipped product. |

Project keys are the case-page slugs: `signalbridge`, `meant`,
`better-call-bhai`, `knowcad`, `boss-breaker`, `loomy`.

## Rules

- No stock photography, and never a generic image standing in for an event photo. An award slot with no real photo shows its drawn fallback, which does not pretend to be a photograph.
- Screenshots must not contain real user data, real names or anything from a
  live conversation.
- A video slot falls back to its poster under reduced motion, and to the
  drawn fallback if neither is set.
