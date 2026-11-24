# Six Hikes of Christmas

A local-first, installable hiking passport and adventure journal for the 2026 Six Hikes of Christmas challenge. The static React app is designed for iPad, phones, and desktop and deploys under `/christmas-hikes/`.

## Develop and build

This project uses [Vite+](https://viteplus.dev/).

```sh
vp install
vp run prepare-assets
vp dev
```

Run the full checks and create the static site:

```sh
vp check
vp test
vp run build
```

Deploy the contents of `dist/` so the site is available at `https://snally.com/christmas-hikes/`. Navigation uses URL hashes, so no server rewrite rule is required. The service worker enables offline use after one successful online load.

## Local data and backups

Plans, completed dates, journal text, and achievements are stored only in browser `localStorage` under the `snally.christmas-hikes.2026` key. They are not transmitted. Settings can export a validated JSON backup, import a backup, print the journal, or explicitly reset this device.

The supplied source dataset remains untouched under `assets/`. `vp run prepare-assets` creates a publishable dataset with private planned dates and times removed, converts badge copies to transparent WebP, and creates app icons. Original PNG artwork is preserved.

## Add another challenge year

1. Add the new source dataset and badge originals under a new directory in `assets/`.
2. Update the challenge metadata and data definitions in `src/data/hikes.ts`.
3. Add the year to the storage key and envelope validation in `src/lib/storage.ts` so editions cannot overwrite one another.
4. Point `scripts/prepare-assets.ts` at the new source directory and bump `CACHE_NAME` in `public/sw.js`.
5. Run `vp run prepare-assets`, the checks, tests, and production build.

Static adventure definitions and local adventure records are deliberately separate; progress totals are always derived from the records.
