// Serves the static homepage (website/) on http://localhost:3000 for `npm run dev` / `npm start`.
// Always port 3000: if it is taken, say so instead of silently moving to another port.
// Range requests are supported (Safari needs them to play the hero video).
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const port = Number(process.env.PORT) || 3000;
const site = resolve(dirname(fileURLToPath(import.meta.url)), "../website");

const server = http.createServer((req, res) => handler(req, res, { public: site }));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${port} is already in use, probably by an older dev server.`);
    console.error("  Stop it (Ctrl+C in the terminal where it runs), then run `npm run dev` again.\n");
    process.exit(1);
  }
  throw err;
});

server.listen(port, () => {
  console.log(`\n  RB Residences homepage: http://localhost:${port}\n  (Ctrl+C to stop)\n`);
});
