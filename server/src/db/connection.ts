/**
 * db/connection.ts — the ONLY file that imports the SQLite driver.
 *
 * Owner: integration-agent (scaffold). Everything else in the codebase talks
 * to `repo.ts`, which imports this module — never the driver directly
 * (architecture.md §3, §11 risk 5).
 *
 * Driver: node:sqlite (DatabaseSync), Node's built-in synchronous SQLite
 * module — no native compiled addon, so no ABI-version risk.
 *
 * FALLBACK HISTORY (architecture.md §11 risk 5): this module originally used
 * `better-sqlite3`. That native addon compiled fine (verified in
 * .hackathon/qa.md "integration - scaffold" on Node v22.22.2) but crashed at
 * runtime on a different deployment host (Vercel Sandbox, Node v24.21.0)
 * with a native-cleanup-hook assertion failure — a real ABI mismatch between
 * the compiled binding and that host's Node/V8 build, exactly the risk this
 * comment used to warn about. Swapped to `node:sqlite` here, behind the same
 * `.prepare()/.pragma()/.transaction()/.close()` shape, so `repo.ts`'s call
 * sites did not change at all.
 */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface Stmt {
  run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface SentinelDb {
  prepare(sql: string): Stmt;
  pragma(pragma: string): unknown;
  exec(sql: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}

function wrap(raw: DatabaseSync): SentinelDb {
  return {
    prepare(sql: string): Stmt {
      const stmt = raw.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...(params as never[])) as never,
        get: (...params: unknown[]) => stmt.get(...(params as never[])),
        all: (...params: unknown[]) => stmt.all(...(params as never[])) as unknown[],
      };
    },
    pragma(pragma: string): unknown {
      return raw.exec(`PRAGMA ${pragma}`);
    },
    exec(sql: string): void {
      raw.exec(sql);
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T {
      return ((...args: unknown[]) => {
        raw.exec("BEGIN");
        try {
          const result = fn(...args);
          raw.exec("COMMIT");
          return result;
        } catch (err) {
          raw.exec("ROLLBACK");
          throw err;
        }
      }) as T;
    },
    close(): void {
      raw.close();
    },
  };
}

let db: SentinelDb | null = null;

export function getDb(dbPath: string = process.env.SENTINEL_DB_PATH ?? "./data/sentinel.db"): SentinelDb {
  if (db) return db;

  const dir = dirname(dbPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }

  const raw = new DatabaseSync(dbPath);
  raw.exec("PRAGMA journal_mode = WAL");
  raw.exec("PRAGMA foreign_keys = ON");
  db = wrap(raw);
  return db;
}

/** Test/utility helper — closes and clears the cached handle. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
