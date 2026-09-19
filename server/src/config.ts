/**
 * config.ts — env var parsing + defaults (architecture.md §6). Every var has
 * a working default so `npm start` works with no `.env` at all. Names must
 * match `.env.example` exactly (integration-agent owns that file).
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

export const config = {
  port: num("PORT", 8080),
  host: process.env.HOST ?? "127.0.0.1",
  nodeEnv: process.env.NODE_ENV ?? "development",
  dbPath: process.env.SENTINEL_DB_PATH ?? "./data/sentinel.db",

  simSeed: num("SIM_SEED", 20261009),
  simTickMs: num("SIM_TICK_MS", 1000),
  simCenters: num("SIM_CENTERS", 8),
  simSessionsPerCenter: num("SIM_SESSIONS_PER_CENTER", 3),

  examDurationS: num("EXAM_DURATION_S", 3600),
  verdictFreezeThresholdS: num("VERDICT_FREEZE_THRESHOLD_S", 10),
  verdictReconductThresholdS: num("VERDICT_RECONDUCT_THRESHOLD_S", 600),
  verdictCostPerCandidateInr: num("VERDICT_COST_PER_CANDIDATE_INR", 850),

  enableSimControls: bool("ENABLE_SIM_CONTROLS", true),
} as const;

/** Derived: exam duration in ms (fixtures + clock.ts want ms, never seconds). */
export const examDurationMs = config.examDurationS * 1000;
export const verdictFreezeThresholdMs = config.verdictFreezeThresholdS * 1000;
export const verdictReconductThresholdMs = config.verdictReconductThresholdS * 1000;

/**
 * Missed-heartbeat detection threshold (architecture.md §13: "detection then
 * runs for real (missed-heartbeat threshold)"). Kept well inside the AC-2/
 * AC-3 <2s budget while still requiring at least one missed tick.
 */
export const missedHeartbeatThresholdMs = Math.max(2000, config.simTickMs * 2);
