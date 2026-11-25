import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import { offlineBuild } from "./scripts/offline-build";
import { privateRoutes } from "./scripts/private-routes";

const pagesBasePath = process.env.PAGES_BASE_PATH;

export default defineConfig(({ mode }) => ({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  base: pagesBasePath === undefined ? "/christmas-hikes/" : `${pagesBasePath.replace(/\/+$/, "")}/`,
  plugins: lazyPlugins(() => [
    react(),
    ...(mode === "private" ? [privateRoutes()] : []),
    offlineBuild(),
  ]),
  server: {
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.routes.local/**",
        "**/temp/**",
        "**/*.gpx",
        "**/dist-private/**",
      ],
    },
  },
  build: {
    outDir: mode === "private" ? "dist-private" : "dist",
    sourcemap: false,
    target: ["es2020", "safari15.4"],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
}));
