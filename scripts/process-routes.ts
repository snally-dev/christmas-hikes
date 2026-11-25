import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SaxesParser } from "saxes";
import edition from "../src/data/2026.json";

const sources = [
  ["weverton-cliffs", "Weverton_Cliffs", 1.72, 39.33292, -77.68326],
  ["brooks-hill", "Brooks_Hill_Loop_Trail", 1.97, 39.36188, -77.40068],
  ["blue-blazes", "Blue_Blazes_Whiskey_Still__Park_Headquarters", 2.43, 39.63419, -77.45083],
  ["burnside-bridge", "Burnside_Bridge__Snavely_Ford", 2.67, 39.45164, -77.73315],
  ["williamsport-lock-44", "Cushwa_Basin_Aqueduct__Lockhouse_44", 2.14, 39.59984, -77.82654],
  ["murphy-chambers-farm", "MurphyChambers_Farm_Loop_Trail", 2.79, 39.31618, -77.75658],
] as const;
const namespace = "http://www.topografix.com/GPX/1/1";
type Position = [longitude: number, latitude: number, elevation: number];
type Coordinate = [number, number] | Position;
const feet = (meters: number) => meters / 0.3048;

function distance(a: Coordinate, b: Coordinate) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * rad) / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(((b[0] - a[0]) * rad) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function number(value: string, field: string, limit: number) {
  const result = Number(value);
  if (!value.trim() || !Number.isFinite(result) || Math.abs(result) > limit) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return result;
}

function parse(xml: string) {
  const segments: Position[][] = [];
  const waypoints: {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { name: string };
  }[] = [];
  const path: string[] = [];
  let point: [number, number] | undefined;
  let elevation = "";
  let name = "";
  const parser = new SaxesParser({ xmlns: true });
  const trackPoint = "gpx/trk/trkseg/trkpt";
  const waypoint = "gpx/wpt";
  parser.on("doctype", () => {
    throw new Error("Unexpected XML document type");
  });
  parser.on("opentag", (tag) => {
    path.push(tag.uri === namespace ? tag.local : "");
    const location = path.join("/");
    if (path.length === 1 && (location !== "gpx" || tag.attributes.version?.value !== "1.1")) {
      throw new Error("Expected a GPX 1.1 document");
    }
    if (location === "gpx/trk/trkseg") segments.push([]);
    if (location === trackPoint || location === waypoint) {
      point = [
        number(tag.attributes.lon?.value ?? "", "longitude", 180),
        number(tag.attributes.lat?.value ?? "", "latitude", 90),
      ];
      elevation = "";
      name = "";
    }
  });
  const capture = (value: string) => {
    const location = path.join("/");
    if (location === trackPoint + "/ele") elevation += value;
    if (location === waypoint + "/name") name += value;
  };
  parser.on("text", capture);
  parser.on("cdata", capture);
  parser.on("closetag", () => {
    const location = path.join("/");
    if (location === trackPoint && point) {
      segments.at(-1)!.push([...point, number(elevation, "elevation", 10000)]);
    }
    if (location === waypoint && point && name.trim()) {
      waypoints.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: point },
        properties: { name: name.trim() },
      });
    }
    path.pop();
  });
  parser.write(xml).close();
  if (!segments.length || segments.some((segment) => segment.length < 2)) {
    throw new Error("Each GPX track segment must have at least two points");
  }
  return { segments, waypoints };
}

const sourceDir = process.argv[2];
const outputDir = ".routes.local";
const files = [];
let total = 0;
for (const [index, [slug, source, expectedMiles, latitude, longitude]] of sources.entries()) {
  const id = index + 1;
  const hike = edition.hikes.find((item) => item.id === id && item.slug === slug);
  if (!hike) throw new Error(`Missing hike ${id} (${slug})`);
  const stem = `${String(id).padStart(2, "0")}-${slug}`;
  const input = sourceDir ? join(sourceDir, source + ".gpx") : join(outputDir, stem + ".gpx");
  try {
    const xml = await readFile(input, "utf8");
    const { segments, waypoints } = parse(xml);
    const start = segments[0][0];
    const end = segments.at(-1)!.at(-1)!;
    const closureMeters = distance(start, end);
    if (closureMeters > 50) throw new Error(`Finish is ${closureMeters.toFixed(1)} m from start`);
    if (distance(start, [longitude, latitude]) > 15)
      console.warn(`${slug}: start differs from reference`);

    let meters = 0;
    let gain = 0;
    let loss = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    const profile = segments.map((segment) => {
      let accepted = segment[0][2];
      return segment.map((point, i) => {
        const [lon, lat, elevation] = point;
        bbox[0] = Math.min(bbox[0], lon);
        bbox[1] = Math.min(bbox[1], lat);
        bbox[2] = Math.max(bbox[2], lon);
        bbox[3] = Math.max(bbox[3], lat);
        if (i > 0) {
          const step = distance(segment[i - 1], point);
          if (step > 150) console.warn(`${slug}: track step of ${step.toFixed(0)} m`);
          meters += step;
        }
        // Three-point median reduces spikes. A 1.5 m deadband rejects small changes
        // while retaining gradual climbs once they pass the threshold.
        const window = segment
          .slice(Math.max(0, i - 1), i + 2)
          .map((p) => p[2])
          .sort((a, b) => a - b);
        const smoothed = window[Math.floor(window.length / 2)];
        if (i === 0) accepted = smoothed;
        const change = smoothed - accepted;
        if (Math.abs(change) >= 1.5) {
          gain += Math.max(0, change);
          loss += Math.max(0, -change);
          accepted = smoothed;
        }
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
        return [meters / 1609.344, feet(elevation), lon, lat];
      });
    });
    if (meters === 0) throw new Error("Track has no horizontal travel");
    const distanceMiles = meters / 1609.344;
    if (Math.abs(distanceMiles - expectedMiles) > 0.03)
      console.warn(`${slug}: distance differs from reference`);
    if (gain > meters * 0.3) console.warn(`${slug}: unusual elevation gain`);
    const elevationGainFeet = feet(gain);
    const stats = {
      distanceMiles,
      distanceEstimated: false,
      returnsToStart: true,
      elevationGainFeet,
      elevationLossFeet: feet(loss),
      minElevationFeet: feet(minElevation),
      maxElevationFeet: feet(maxElevation),
      durationMinutes: Math.ceil((distanceMiles * 40 + elevationGainFeet / 50 + 10) / 5) * 5,
    };
    Object.assign(hike, stats);
    total += distanceMiles;
    const geoJson = `${stem}.geojson`;
    const gpx = `${stem}.gpx`;
    const route = {
      ...stats,
      start,
      end,
      closureMeters,
      bbox,
      gpx,
      geoJson,
      profile,
      routeType: hike.routeType,
      allTrailsRouteType: hike.allTrailsRouteType,
      waypoints: `${stem}.waypoints.geojson`,
    };
    files.push(
      [gpx, xml],
      [
        geoJson,
        JSON.stringify({
          type: "Feature",
          bbox,
          properties: {},
          geometry: { type: "MultiLineString", coordinates: segments },
        }),
      ],
      [
        `${stem}.waypoints.geojson`,
        JSON.stringify({ type: "FeatureCollection", features: waypoints }),
      ],
      [`${stem}.json`, JSON.stringify(route)],
    );
    console.log(
      `${stem}: ${distanceMiles.toFixed(3)} mi, ↑${elevationGainFeet.toFixed(0)} ↓${feet(loss).toFixed(0)} ft, ${feet(minElevation).toFixed(0)}–${feet(maxElevation).toFixed(0)} ft, ${stats.durationMinutes} min, ends ${closureMeters.toFixed(1)} m from start, ${waypoints.length} waypoints`,
    );
  } catch (error) {
    throw new Error(`${input}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}
edition.targetMiles = total;
if (Math.abs(total - 13.71) > 0.06) console.warn("Challenge mileage differs from reference");
await mkdir(outputDir, { recursive: true });
for (const [file, content] of files) await writeFile(join(outputDir, file), content);
const { completionBadge: _, ...summary } = edition;
await writeFile("src/data/2026.json", JSON.stringify(edition, null, 2) + "\n");
await writeFile(
  "public/data/hikes.json",
  JSON.stringify(
    {
      ...summary,
      hikes: edition.hikes.map(({ badge, ...hike }) => ({
        ...hike,
        badge: {
          ...badge,
          unlockedImage: `badges/${badge.unlockedImage}`,
          lockedImage: `badges/${badge.lockedImage}`,
        },
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Challenge total: ${total.toFixed(3)} mi`);
