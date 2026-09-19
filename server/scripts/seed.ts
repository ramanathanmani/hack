/**
 * scripts/seed.ts — `npm run seed`. Resets the DB to the fixed scenario and
 * populates it so the golden path looks alive the instant a judge opens the
 * app, instead of a blank t=0 dashboard.
 *
 * The actual fixture (scenario + answer-save history + pre-resolved
 * backstory incident/verdict) lives in `src/sim/seedFixture.ts` so both this
 * cold-start script and `Simulator.reset()` (AC-12's in-process "Reset
 * Demo") replay the exact same demo state (P1-3 — reset() must not diverge
 * from what `npm run seed` produces).
 *
 * Ownership note (architecture.md §3): created by backend-builder for M1;
 * data-seeder (this pass) tuned it for demo realism — still the only file
 * besides `sim/scenario.ts` that data-seeder may edit.
 *
 * Idempotent: always truncates first, so re-running produces the same shape
 * of state (timestamps shift with wall-clock `Date.now()`, but the scenario,
 * the answer-history sizes, and the backstory incident/verdict decision are
 * fully deterministic given the same config/seed).
 */

import { migrate } from "../src/db/migrate.js";
import { getDb } from "../src/db/connection.js";
import { Repo } from "../src/repo.js";
import { config } from "../src/config.js";
import { seedDemoFixture } from "../src/sim/seedFixture.js";

function main(): void {
  const db = getDb(config.dbPath);
  migrate(db);
  const repo = new Repo(db);

  const now = Date.now();
  const result = seedDemoFixture(repo, now);

  console.log(
    `Seeded ${result.scenario.centers.length} centers, ${result.scenario.sessions.length} sessions, ` +
      `${result.answerCheckpointCount} answer-save checkpoints, and one resolved backstory incident ` +
      `at ${result.backstoryCenterName} (-> ${result.backstoryDecision}).`
  );
}

main();
