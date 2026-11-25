import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite-plus";

export function offlineBuild(): Plugin {
  let output: string;
  let base: string;
  return {
    name: "christmas-hikes-offline",
    apply: "build",
    configResolved(config) {
      output = resolve(config.root, config.build.outDir);
      base = config.base;
    },
    async closeBundle() {
      const template = await readFile(
        fileURLToPath(new URL("./service-worker.js", import.meta.url)),
        "utf8",
      );
      const manifestPath = join(output, "branding/manifest.webmanifest");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
      await writeFile(
        manifestPath,
        JSON.stringify({ ...manifest, id: base, start_url: base, scope: base }, null, 2) + "\n",
      );
      const entries = await readdir(output, { recursive: true, withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => join(entry.parentPath, entry.name).slice(output.length + 1))
        .filter((path) => path !== "sw.js")
        .sort();
      const hash = createHash("sha256").update(template);
      for (const file of files) hash.update(file).update(await readFile(join(output, file)));

      await writeFile(
        join(output, "sw.js"),
        `const BUILD_ID = ${JSON.stringify(hash.digest("hex").slice(0, 16))};\n` +
          `const BUILD_FILES = ${JSON.stringify(files)};\n` +
          template,
      );
    },
  };
}
