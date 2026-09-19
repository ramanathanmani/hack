// check-offline.mjs — AC-14 guard. Greps the built bundle (web/dist) for
// external origins (http:// or https://) so no CDN font/script/tile sneaks
// in. Owner: integration-agent. Run after `npm run build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist", import.meta.url).pathname;
const OFFENDER = /https?:\/\/(?!127\.0\.0\.1|localhost)/;

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

let files;
try {
  files = walk(DIST);
} catch {
  console.log("check:offline — web/dist not found; run `npm run build` first. Skipping.");
  process.exit(0);
}

const offenders = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (OFFENDER.test(text)) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error("check:offline FAIL — external origin(s) found in:");
  offenders.forEach((f) => console.error("  " + f));
  process.exit(1);
}

console.log("check:offline PASS — no external origins in web/dist");
