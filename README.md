[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Jo3st4r/gta6-cover-art-01-bot-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Jo3st4r/gta6-cover-art-01-bot-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Coast Cover Studio

**Neon Coast Cover Studio: drag 3 photos into a sun-bleached 9-panel grid and stamp the caption in neon.**

A GTA 6-style cover maker that runs entirely offline in a desktop browser. Drop up to
3 photos, cut them into one of 6 layouts, wash them with one of 5 sunset grades, and
stamp the caption in neon — then export the cover as a PNG to share.

## The studio

- **6 layouts** — 9-Panel Grid, 4-Panel Grid, Hero + 3, Tilted Snapshots, Full Bleed,
  Hero + Film Strip. Click any panel to swap which photo it shows.
- **Up to 3 photos** — pick files, or drag them onto the cover. Each photo has its
  own zoom and pan, so every panel crops exactly how you want it.
- **5 sunset grades** — Vice Dusk, Golden Hour, Neon Pink, Ember, Teal Dusk. Each one
  re-grades the whole cover and re-colours the neon glow.
- **Neon caption** — the caption in Anton capitals (or Pacifico script) with a neon
  glow, plus a script sub-line in Pacifico. Both fonts ship under the SIL Open Font
  License in `app/fonts/`.
- **Export PNG** — 1080 x 1080, 1080 x 1350, or 1920 x 1080, straight from the app.

## Try it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

No network, no build step, no upload: photos are read on your own machine.

## How it is built

- `app/index.html` + `app/style.css` — the editor page and its sun-bleached neon styling.
- `app/src/cover.js` — the drawing engine: layouts, grades, crop, caption stamping.
- `app/src/main.js` — wires the page: photos, controls, export, screenshots.
- `app/src/shots.js` — fixed scenes for the screenshots (`?shot=cover` / `?shot=editor`).
- `app/samples/` — two photos made with an image model for make.fun, free to use.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to `/output` and
  writes `/output/dossier.json` with the vendored make.fun library.

## Bounty

This entry is for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
on make.fun.

---

Built with [make.fun](https://make.fun/bounty/gta6-cover-art-01) — try it with my
referral link: https://make.fun/r/4h54dhb7
