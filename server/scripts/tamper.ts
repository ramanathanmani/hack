/**
 * scripts/tamper.ts — `npm run tamper`. A2's second, terminal-visible
 * tamper path (the first is `POST /api/sim/tamper` behind the quarantined
 * "SIMULATOR CONTROLS" panel). This does a raw `better-sqlite3` UPDATE,
 * bypassing the append-only application API on purpose — no `sqlite3` CLI
 * anywhere, per architecture.md §2.
 */

import { migrate } from "../src/db/migrate.js";
import { getDb } from "../src/db/connection.js";
import { Repo } from "../src/repo.js";
import { config } from "../src/config.js";

function main(): void {
  const db = getDb(config.dbPath);
  migrate(db);
  const repo = new Repo(db);

  const target = repo.pickTamperTarget();
  if (!target) {
    console.error("No checkpoints to tamper with yet — run `npm run seed` first.");
    process.exit(1);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(target.payloadJson);
  } catch {
    payload = {};
  }
  const tamperedPayload =
    payload && typeof payload === "object"
      ? { ...(payload as Record<string, unknown>), answer: "TAMPERED", tamperedAt: Date.now() }
      : { tamperedAt: Date.now() };

  repo.tamperCheckpoint(target.id, tamperedPayload);

  console.log(
    `Tampered checkpoint id=${target.id} (center=${target.centerId}, seq=${target.seq}) via raw UPDATE.`
  );
  console.log("Run `npm run verify-chain` to see it caught.");
}

main();
