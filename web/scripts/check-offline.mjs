// check-offline.mjs — AC-14 guard. Greps the built bundle (web/dist) for
// external origins (http:// or https://) so no CDN font/script/tile sneaks
// in. Owner: integration-agent. Run after `npm run build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist", import.meta.url).pathname;

// Known-safe strings that are not runtime network calls:
//  - XML/SVG/MathML namespace URIs (React/DOM constants, never fetched)
//  - react.dev/errors/ links embedded in minified error messages (doc links
//    shown in console text, never requested by the app)
const SAFE = [
  /https?:\/\/www\.w3\.org\//,
  /https?:\/\/react\.dev\/errors\//,
];
const OFFENDER = /https?:\/\/(?!127\.0\.0\.1|localhost)\S+/g;

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
  const matches = text.match(OFFENDER) ?? [];
  const bad = matches.filter((m) => !SAFE.some((safe) => safe.test(m)));
  if (bad.length > 0) {
    offenders.push({ file, bad: [...new Set(bad)] });
  }
}

if (offenders.length > 0) {
  console.error("check:offline FAIL — external origin(s) found in:");
  offenders.forEach(({ file, bad }) => {
    console.error("  " + file);
    bad.forEach((b) => console.error("    " + b));
  });
  process.exit(1);
}

console.log("check:offline PASS — no external origins in web/dist");
