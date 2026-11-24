import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const sourceRoot = "assets/six-hikes-of-christmas-2026";
const publicRoot = "public";
const badgeRoot = join(publicRoot, "badges");

await mkdir(badgeRoot, { recursive: true });
await mkdir(join(publicRoot, "icons"), { recursive: true });
await mkdir(join(publicRoot, "data"), { recursive: true });

const raw = JSON.parse(await readFile(join(sourceRoot, "hikes.json"), "utf8")) as {
  hikes: Array<Record<string, unknown> & { badge: { unlockedImage: string; lockedImage: string } }>;
};

for (const hike of raw.hikes) {
  delete hike.plannedDate;
  delete hike.plannedStart;
  delete hike.plannedEnd;
  for (const key of ["unlockedImage", "lockedImage"] as const) {
    const sourceName = basename(hike.badge[key]);
    const outputName = sourceName.replace(/\.png$/i, ".webp");
    await sharp(join(sourceRoot, "badges", sourceName))
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 95, effort: 5 })
      .toFile(join(badgeRoot, outputName));
    hike.badge[key] = `badges/${outputName}`;
  }
}

await writeFile(join(publicRoot, "data", "hikes.json"), `${JSON.stringify(raw, null, 2)}\n`);

const iconSource = join(sourceRoot, "badges", "01-weverton-cliffs.png");
for (const size of [192, 512]) {
  await sharp(iconSource)
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(join(publicRoot, "icons", `icon-${size}.png`));
}

console.log("Prepared sanitized hike data, optimized WebP badges, and app icons.");
