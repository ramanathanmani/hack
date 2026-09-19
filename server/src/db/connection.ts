/**
 * db/connection.ts — the ONLY file that imports the SQLite driver.
 *
 * Owner: integration-agent (scaffold). Everything else in the codebase talks
 * to `repo.ts`, which imports this module — never the driver directly
 * (architecture.md §3, §11 risk 5).
 *
 * Driver: better-sqlite3 (synchronous, embedded, single file). Verified via
 * the native-module smoke check recorded in .hackathon/qa.md under
 * "integration - scaffold": `node -e "require('better-sqlite3')"` succeeded
 * in this environment on Node v22.22.2.
 *
 * FALLBACK PLAN (documented, not implemented — architecture.md §11 risk 5):
 * if prebuilt binaries for better-sqlite3 ever fail to load for the target
 * Node ABI (e.g. a judge's laptop with a different Node build), the
 * documented fallback is Node 22's built-in `node:sqlite` module, which
 * exposes a synchronous API shape close enough to swap in behind this one
 * module without touching `repo.ts`'s call sites. Do NOT implement that
 * fallback now — only `repo.ts` (backend-builder) may ever import a driver,
 * and only this file chooses which one.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let db: Database.Database | null = null;

export function getDb(dbPath: string = process.env.SENTINEL_DB_PATH ?? "./data/sentinel.db"): Database.Database {
  if (db) return db;

  const dir = dirname(dbPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

/** Test/utility helper — closes and clears the cached handle. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
