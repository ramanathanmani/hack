/**
 * scripts/seed.ts — `npm run seed`. Resets the DB to the fixed scenario and
 * populates it so the golden path looks alive the instant a judge opens the
 * app, instead of a blank t=0 dashboard.
 *
 * What it does (all deterministic — no Math.random anywhere, per
 * architecture.md §13 / decision #5 — only fixed offsets and the shared
 * seeded `mulberry32` PRNG from `sim/rng.ts`):
 *
 *  1. Truncate + re-create centers/sessions from `sim/scenario.ts`, with the
 *     exam "started" ~22 minutes before seed time so the demo opens mid-exam
 *     (not a suspicious freshly-booted t=0).
 *  2. Give every session a short answer-save history (2-4 real checkpoints,
 *     real SHA-256 hash chain) so the ledger panel isn't just genesis rows.
 *  3. Seed one pre-resolved "backstory" incident at
 *     `sim/scenario.ts`'s `BACKSTORY_CENTER_INDEX` center: a 47s simulated
 *     outage that already happened, froze that center's sessions, recovered,
 *     and got a computed verdict — using the exact same domain functions
 *     (`repo.freezeSessionsAtCenter` / `resumeSessionsAtCenter` /
 *     `openIncident` / `closeIncident` / `computeVerdict`) the live simulator
 *     uses for a real, `/audit`-verifiable kill-switch run. This leaves every
 *     other center pristine/healthy for the operator's live kill-switch demo.
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
import { config, examDurationMs } from "../src/config.js";
import { buildScenario, fixedAnswer, BACKSTORY_CENTER_INDEX } from "../src/sim/scenario.js";
import { mulberry32, rngInt } from "../src/sim/rng.js";
import { isFreezable } from "../src/domain/sessions.js";
import { computeVerdict } from "../src/domain/verdict.js";

const MINUTE_MS = 60_000;

function main(): void {
  const db = getDb(config.dbPath);
  migrate(db);
  const repo = new Repo(db);

  repo.truncateAll();
  const scenario = buildScenario(config.simCenters, config.simSessionsPerCenter);

  // Exam "started" 22 minutes before seed time — the app opens mid-exam.
  const examStartedAt = Date.now() - 22 * MINUTE_MS;
  repo.seedScenario(scenario.centers, scenario.sessions, examDurationMs, examStartedAt);

  const rng = mulberry32(config.simSeed);

  // 2) Real answer-save history per session (deterministic PRNG, same rule
  // the live simulator uses), so the ledger/candidate panels look mid-exam.
  let answerCheckpointCount = 0;
  for (const session of scenario.sessions) {
    let ts = examStartedAt + 30_000; // first answer ~30s after exam start
    let questionIdx = 0;
    const answerCount = rngInt(rng, 2, 4);
    for (let i = 0; i < answerCount; i++) {
      const question = scenario.questions[questionIdx % scenario.questions.length];
      const answer = fixedAnswer(rng, question);
      const nextIdx = (questionIdx + 1) % scenario.questions.length;
      repo.recordAnswer(session.id, nextIdx, answer);
      repo.appendCheckpoint(session.centerId, session.id, ts, "answer_save", {
        sessionId: session.id,
        questionId: question.id,
        answer,
      });
      answerCheckpointCount++;
      questionIdx = nextIdx;
      ts += rngInt(rng, 45_000, 90_000); // stays well inside the 5-6 min pre-incident window below
    }
  }

  // 3) Backstory incident: already opened, resolved, and verdicted before
  // the app is ever opened. Uses the same domain functions as the live
  // simulator so the resulting hash chain is real and /audit-verifiable.
  const backstoryIdx = Math.min(BACKSTORY_CENTER_INDEX, scenario.centers.length - 1);
  const backstoryCenter = scenario.centers[backstoryIdx];
  const incidentOpenedAt = examStartedAt + 6 * MINUTE_MS; // after the answer-save window above
  const incidentClosedAt = incidentOpenedAt + 47_000; // 47s outage -> partial-extension verdict

  const sessionsBefore = repo
    .listSessionsByCenter(backstoryCenter.id, incidentOpenedAt)
    .filter((s) => isFreezable(s.state));

  const incident = repo.openIncident(backstoryCenter.id, incidentOpenedAt, sessionsBefore.length, {
    signal: "missed_heartbeat",
    lastHeartbeatTs: incidentOpenedAt - 5_000,
    thresholdMs: 4_000,
  });
  repo.updateCenterStatus(backstoryCenter.id, "down", 90, incidentOpenedAt);
  repo.freezeSessionsAtCenter(backstoryCenter.id, incidentOpenedAt);

  const resumed = repo.resumeSessionsAtCenter(backstoryCenter.id, incidentClosedAt);
  repo.updateCenterStatus(backstoryCenter.id, "healthy", 15, incidentClosedAt);
  const closedIncident = repo.closeIncident(incident.id, incidentClosedAt);

  const { decision, reasoning } = computeVerdict({
    frozenDurationsMs: resumed.map((s) => s.frozenMsTotal),
    checkpointsLost: 0,
    examDurationMs,
    totalCandidateCount: repo.totalCandidateCount(),
  });
  repo.insertVerdict(closedIncident.id, decision, reasoning, incidentClosedAt);

  console.log(
    `Seeded ${scenario.centers.length} centers, ${scenario.sessions.length} sessions, ` +
      `${answerCheckpointCount} answer-save checkpoints, and one resolved backstory incident ` +
      `at ${backstoryCenter.name} (${closedIncident.id} -> ${decision}, ` +
      `${resumed.length} sessions affected). Exam started at t=${examStartedAt}, ` +
      `incident ${incidentOpenedAt}-${incidentClosedAt}.`
  );
}

main();
