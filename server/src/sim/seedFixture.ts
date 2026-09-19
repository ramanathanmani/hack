/**
 * sim/seedFixture.ts — the one intentional demo fixture, shared by
 * `scripts/seed.ts` (cold start / `npm run seed`) and `Simulator.reset()`
 * (AC-12 in-process reset) so "Reset Demo" reproduces the exact same
 * backstory state a fresh `npm run seed` does, instead of a bare
 * `repo.seedScenario()` (P1-3).
 *
 * Truncates, re-seeds the fixed scenario 22 minutes into the exam, gives
 * every session a short deterministic answer-save history, and seeds one
 * pre-resolved backstory incident (missed-heartbeat -> freeze -> resume ->
 * verdict) at `BACKSTORY_CENTER_INDEX`, using the exact same domain
 * functions the live simulator uses so the resulting hash chain is real and
 * /audit-verifiable.
 */

import type { Repo } from "../repo.js";
import { buildScenario, fixedAnswer, BACKSTORY_CENTER_INDEX, type Scenario } from "./scenario.js";
import { mulberry32, rngInt } from "./rng.js";
import { isFreezable } from "../domain/sessions.js";
import { computeVerdict } from "../domain/verdict.js";
import { config, examDurationMs } from "../config.js";

const MINUTE_MS = 60_000;

export interface SeedFixtureResult {
  scenario: Scenario;
  answerCheckpointCount: number;
  backstoryCenterName: string;
  backstoryDecision: string;
}

/**
 * Truncates the DB and replays the fixed demo fixture. `now` lets callers
 * (tests, simulator.reset()) control the wall-clock anchor deterministically;
 * defaults to `Date.now()` for the normal seed/reset path.
 */
export function seedDemoFixture(repo: Repo, now: number = Date.now()): SeedFixtureResult {
  repo.truncateAll();
  const scenario = buildScenario(config.simCenters, config.simSessionsPerCenter);

  // Exam "started" 22 minutes before seed time — the app opens mid-exam.
  const examStartedAt = now - 22 * MINUTE_MS;
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

  return {
    scenario,
    answerCheckpointCount,
    backstoryCenterName: backstoryCenter.name,
    backstoryDecision: decision,
  };
}
