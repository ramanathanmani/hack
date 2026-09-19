/**
 * scripts/verify-chain.ts — `npm run verify-chain`. CLI PASS/FAIL fallback
 * for AC-7/AC-8 (decision.md §8 cut-list item 8, last-resort if the /audit
 * UI is cut). Uses the same `verifyChain()` the HTTP route uses — no
 * `sqlite3` CLI, no separate logic (architecture.md §2 hard ban).
 */

import { migrate } from "../src/db/migrate.js";
import { getDb } from "../src/db/connection.js";
import { Repo } from "../src/repo.js";
import { config } from "../src/config.js";

function main(): void {
  const db = getDb(config.dbPath);
  migrate(db);
  const repo = new Repo(db);
  const result = repo.verifyLedger();

  if (result.ok) {
    console.log("PASS — chain integrity verified across all centers.");
    process.exit(0);
  } else {
    console.log("FAIL — broken link detected:");
    console.log(JSON.stringify(result.brokenAt, null, 2));
    process.exit(1);
  }
}

main();
