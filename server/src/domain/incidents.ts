/**
 * domain/incidents.ts — open/classify/severity. Detection itself (the
 * missed-heartbeat check) lives in sim/simulator.ts because it needs the
 * telemetry tick loop; this module holds the pure classification rules so
 * they are unit-testable and reused by repo.ts when a real
 * `POST /api/ingest/telemetry` seam replaces the simulator (architecture.md
 * §12).
 */

import type { IncidentSeverity } from "../../../shared/types.js";

/** M1/M2 keep a single classification per the cut list (decision.md §8 item 5). */
export const CLASSIFICATION_CONNECTIVITY_LOSS = "Connectivity Loss";

export function severityForAffected(affectedCount: number): IncidentSeverity {
  if (affectedCount >= 10) return "critical";
  if (affectedCount >= 5) return "high";
  if (affectedCount >= 2) return "medium";
  return "low";
}
