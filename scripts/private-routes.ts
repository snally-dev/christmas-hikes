import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite-plus";

const directory = ".routes.local";
const routeFile = /^0[1-6]-[a-z0-9-]+\.(?:json|geojson|waypoints\.geojson|gpx)$/;
const contentTypes: Record<string, string> = {
  json: "application/json",
  geojson: "application/geo+json",
  gpx: "application/gpx+xml",
};

async function loadRoutes() {
  const names = (
    await readdir(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT")
        throw new Error("Run vp run routes:generate before using private mode.");
      throw error;
    })
  )
    .filter((name) => routeFile.test(name))
    .sort();
  if (names.length !== 24)
    throw new Error("Run vp run routes:generate to regenerate all six routes.");
  const settings = await readFile(join(directory, "settings.json"), "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return "{}";
      throw error;
    },
  );
  const files = new Map<string, string | Buffer>([["settings.json", settings]]);
  const { allowGpxDownload } = JSON.parse(settings);
  await Promise.all(
    names.map(async (name) => {
      if (!name.endsWith(".gpx") || allowGpxDownload === true) {
        files.set(name, await readFile(join(directory, name)));
      }
    }),
  );
  return files;
}

export function privateRoutes(): Plugin {
  return {
    name: "christmas-hikes-private-routes",
    async generateBundle() {
      const files = await loadRoutes();
      for (const [name, source] of files) {
        this.emitFile({ type: "asset", fileName: `routes/${name}`, source });
      }
    },
    async configureServer(server) {
      const prefix = `${server.config.base}routes/`;
      const files = await loadRoutes();
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0];
        if (!path?.startsWith(prefix)) return next();
        const name = path.slice(prefix.length);
        const source = files.get(name);
        if (source === undefined) {
          response.statusCode = 404;
          return response.end();
        }
        response.setHeader("Content-Type", contentTypes[name.split(".").at(-1)!]);
        response.end(source);
      });
    },
  };
}
