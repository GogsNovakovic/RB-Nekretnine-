// Bundles the 3D viewer into a standalone script for the static website:
// dist/viewer.js (IIFE, global `BuildingViewer`, Three.js included), copied to website/js/viewer.js.
// Run with `npm run build:viewer`. The Next.js app (`npm run build`) is unaffected.
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/viewer.js");
const site = resolve(root, "website/js/viewer.js");

const result = await build({
  entryPoints: [resolve(root, "lib/viewer/embed.ts")],
  outfile: out,
  bundle: true,
  format: "iife",
  globalName: "BuildingViewer",
  platform: "browser",
  target: ["es2020", "safari15"],
  minify: true,
  legalComments: "eof",
  metafile: true,
  logLevel: "info",
});

await mkdir(dirname(site), { recursive: true });
await copyFile(out, site);
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(`viewer.js ${(bytes / 1024).toFixed(0)} KB -> ${site}`);
