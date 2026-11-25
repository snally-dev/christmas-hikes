# Six Hikes of Christmas

Six Hikes of Christmas is a local-first National Park adventure passport. The 2026 challenge runs from November 26 to December 31, inclusive, in America/New_York. The journal and individual trail badges stay available year-round.

## Develop and deploy

```sh
vp install
vp check
vp test
vp run build
vp preview
```

Deploy the contents of `dist/` over HTTPS at `https://snally.com/christmas-hikes/`. Serve the directory index at `/christmas-hikes/` and the manifest as `application/manifest+json`. Navigation uses URL hashes. Serve `sw.js` and `index.html` with revalidation, for example `Cache-Control: no-cache`. The build generates a revisioned precache covering the application shell, compiled files, branding, and every published badge. Publishing the output as one release keeps those files in sync. An update activates after previous app windows close so an open journal can keep using the build it started with.

The app reads edition definitions from `src/data/`. The deployed badge artwork and branding live in `public/badges/` and `public/branding/`. The route generator updates `public/data/hikes.json` from the 2026 edition.

## GitHub Pages

In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The included workflow runs checks and tests, then publishes the public `dist/` artifact on pushes to `main`. You can also run it from the Actions tab on `main`. The build uses the Pages URL path for asset links, the installable manifest and the service worker. [GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Install and check on iPad

1. Open the deployed page in Safari. Choose **Share → Add to Home Screen**, keep **Open as Web App** enabled if it appears, and confirm the name **Christmas Hikes**.
2. Launch from the Home Screen and verify that the supplied icon is present and Safari’s address bar and tabs are absent. Open the installed app online once to let its offline cache finish.
3. In Airplane Mode, relaunch the app. Open a trail and its mission, save a journal entry, then relaunch and confirm the entry and earned patch are still there. Check both portrait and landscape. From Settings, export to Files and confirm the file can be restored in the same edition.

The manifest sets standalone display and scopes the app to its deployed path. The HTML also supplies the Apple Touch Icon and Apple Home Screen title. [WebKit Home Screen web app behavior](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) · [WebKit guidance on Open as Web App](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

## Local records and backups

Records are kept in localStorage on the device, under a separate key for each edition. Settings exports the selected edition as JSON and validates a backup before asking to replace that edition’s records. Use export and restore to move a journal between devices or between Safari and a Home Screen installation if their storage is separate. External trail guides and directions require a connection.

Journal dates determine eligibility for the Christmas Trail Master patch. Late entries for hikes taken within the window can earn the patch. Hikes taken outside the window earn their individual patches. The certificate is available from the collection once the season award is earned.

## Add an annual edition

1. Add a public edition JSON file to `src/data/`. Give it a distinct year, start and end dates, IANA time zone, mileage target, hike goal, trail missions, and completion badge filenames. Keep private plans out of this file.
2. Register the new file in `src/data/hikes.ts`. Keep previous editions registered so they remain selectable in Collection. Each year gets its own journal storage and accepts its own backups.
3. Add optimized badge images to `public/badges/` with distinct filenames, including the edition’s Trail Master images. Run checks, tests and build. The offline cache revision updates automatically. The logo, Home Screen identity and navigation artwork apply across editions.

## Regenerate route data

1. Run `vp run routes:generate` from the project root to reuse the six saved GPX files in `.routes.local/`. To import fresh exports, put them in a private directory under their original filenames and pass that directory as the first argument, for example `vp run routes:generate /path/to/exports`.
2. Review any warning about an unusually long step or changed starting location before using the result.
3. Run `vp fmt src/data/2026.json public/data/hikes.json` and review the public stat changes. The generator writes the private route files to the ignored `.routes.local/` directory.

Mileage sums Haversine distances within each track segment using a mean Earth radius of 6,371,008.8 meters. The 50 m closure check compares the first and last recorded positions. Gain and loss use a three-point median and a 1.5 m change threshold, reset at segment boundaries. The profile and high/low use exported elevations. This method gives an independent climbing estimate. Family times allow 40 minutes per mile, a minute per 50 feet of climbing, and 10 minutes for stops, rounded up to five minutes. Distances in the data retain their calculated precision.

## Public AllTrails routes and maps

All six finalized route URLs live in the corresponding hike records in `src/data/2026.json`. The site displays a direct link on every detail page. Independent signed-out requests to the custom routes and collection returned HTTP 403, so the requests could not establish public access. Set the edition’s optional `allTrailsCollectionUrl` only after confirming the collection opens in a signed-out browser.

AllTrails documents **Share → Embed** for [verified trails](https://support.alltrails.com/hc/en-gb/articles/360019246111-How-to-share-a-trail) and [custom routes](https://support.alltrails.com/hc/en-us/articles/360029314591-How-to-share-a-custom-route). Copy the official iframe’s `src` into that hike’s `allTrails.embedUrl`. The site accepts HTTPS AllTrails widget URLs and loads a widget only when the visitor chooses **Load AllTrails map**. Leave the route link available as a fallback. The direct route URLs do not supply the widget source. Confirm each widget shows the right route while signed out before publishing. Run `vp run routes:generate` and format the edition and public snapshot after updating the data.

The [AllTrails Terms of Service](https://www.alltrails.com/terms) did not establish permission to redistribute the exported GPX or derived route geometry. The public build uses the official widget when configured and publishes route links and summary statistics. Start and finish markers, the elevation profile, and map waypoints in a public widget depend on what AllTrails displays. The native GPX-based map provides these in private mode. The site sends no journal, completion, or planning records to map providers.

## Private route maps

Use `vp run dev:private` for local development or `vp run build:private` followed by `vp run preview:private` for production QA. Deploy `dist-private/` only to a private location you control. The optional ignored `.routes.local/settings.json` accepts the following keys. Keep GPX downloads disabled unless permitted.

```json
{
  "collectionUrl": "",
  "allowGpxDownload": false
}
```

Use different origins for private and public hosting to isolate offline caches. [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) load on demand and require a connection. The private route line, profile, and named points are cached for offline use after the first load.

Entering an actual distance in the journal is optional. Explored mileage uses the journal value when present and the planned mileage otherwise. Miles remaining sum the trails still to explore. Existing journal values and completion records are preserved under their original storage keys.
