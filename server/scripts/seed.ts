/**
 * scripts/seed.ts — `npm run seed`. Resets the DB to the fixed scenario at
 * t=0: centers healthy, sessions active, one genesis checkpoint per
 * session, zero incidents (architecture.md §13). Ownership note: created
 * here by backend-builder for M1; data-seeder may edit this file later to
 * tune demo data (architecture.md §3).
 */

import { migrate } from "../src/db/migrate.js";
import { getDb } from "../src/db/connection.js";
import { Repo } from "../src/repo.js";
import { config, examDurationMs } from "../src/config.js";
import { buildScenario } from "../src/sim/scenario.js";

function main(): void {
  const db = getDb(config.dbPath);
  migrate(db);
  const repo = new Repo(db);

  repo.truncateAll();
  const scenario = buildScenario(config.simCenters, config.simSessionsPerCenter);
  const now = Date.now();
  repo.seedScenario(scenario.centers, scenario.sessions, examDurationMs, now);

  console.log(
    `Seeded ${scenario.centers.length} centers, ${scenario.sessions.length} sessions ` +
      `(one genesis checkpoint each) at t=${now}.`
  );
}

main();
