/**
 * db/migrate.ts — runs migrations/*.sql in filename order at boot.
 *
 * Owner: integration-agent (scaffold, T03). Forward-only, no down migrations,
 * no ORM. Each migration file runs inside one transaction and is recorded in
 * `schema_migrations`. backend-builder may add `002_*.sql`, `003_*.sql`, etc,
 * but must never edit `001_init.sql` after M1 ships (architecture.md §4).
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export function migrate(db: Database.Database): string[] {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)`
  );

  const applied = new Set(
    db.prepare("SELECT name FROM schema_migrations").all().map((r: any) => r.name)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const runOne = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
        file,
        Date.now()
      );
    });
    runOne();
    ran.push(file);
  }

  return ran;
}
