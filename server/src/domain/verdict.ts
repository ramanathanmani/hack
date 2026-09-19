/**
 * domain/verdict.ts — policy object + compute() (AC-6 / A4). The reasoning
 * payload is a FIXED shape so the UI can render arithmetic generically
 * (architecture.md §4, mirrored in shared/types.ts VerdictReasoning).
 *
 * The re-conduct-cost-avoided number is required (A4) and its `basis` field
 * is mandatory — the INR figure is illustrative and must say so on screen
 * (A6 honesty).
 */

import {
  config,
  verdictFreezeThresholdMs,
  verdictReconductThresholdMs,
} from "../config.js";
import type { VerdictDecision, VerdictReasoning } from "../../../shared/types.js";

export const POLICY_VERSION = "v1";

export interface VerdictInput {
  /** Frozen duration per affected session, in ms. */
  frozenDurationsMs: number[];
  /** Checkpoints expected vs. actually present across affected sessions. */
  checkpointsLost: number;
  examDurationMs: number;
  /** Total candidates across the whole exam (all centers), for cost-avoided. */
  totalCandidateCount: number;
}

export interface VerdictComputation {
  decision: VerdictDecision;
  reasoning: VerdictReasoning;
}

export function computeVerdict(input: VerdictInput): VerdictComputation {
  const affected = input.frozenDurationsMs.length;
  const maxFrozenMs = affected > 0 ? Math.max(...input.frozenDurationsMs) : 0;
  const avgFrozenMs =
    affected > 0 ? Math.round(input.frozenDurationsMs.reduce((a, b) => a + b, 0) / affected) : 0;

  let decision: VerdictDecision;
  let rule: string;
  let arithmetic: string[];

  if (input.checkpointsLost > 0) {
    decision = "re-conduct";
    rule =
      "checkpoints_lost > 0 -> re-conduct (unrecoverable candidate work forces full re-conduct " +
      "regardless of frozen duration)";
    arithmetic = [
      `${input.checkpointsLost} checkpoint(s) lost`,
      "-> RE-CONDUCT",
    ];
  } else if (maxFrozenMs > verdictReconductThresholdMs) {
    decision = "re-conduct";
    rule =
      `frozen_ms > RECONDUCT_THRESHOLD_MS (${verdictReconductThresholdMs}ms) AND ` +
      "checkpoints_lost == 0 -> re-conduct";
    arithmetic = [
      `${maxFrozenMs}ms frozen > ${verdictReconductThresholdMs}ms re-conduct threshold`,
      `${input.checkpointsLost} checkpoints lost`,
      "-> RE-CONDUCT",
    ];
  } else if (maxFrozenMs > verdictFreezeThresholdMs) {
    decision = "partial-extension";
    rule =
      `frozen_ms > FREEZE_THRESHOLD_MS (${verdictFreezeThresholdMs}ms) AND ` +
      "checkpoints_lost == 0 -> partial-extension";
    arithmetic = [
      `${maxFrozenMs}ms frozen > ${verdictFreezeThresholdMs}ms threshold`,
      `${input.checkpointsLost} checkpoints lost`,
      `-> PARTIAL EXTENSION +${Math.round(maxFrozenMs / 1000)}s`,
    ];
  } else {
    decision = "no-action";
    rule =
      `frozen_ms <= FREEZE_THRESHOLD_MS (${verdictFreezeThresholdMs}ms) -> no-action ` +
      "(disruption too brief to warrant intervention)";
    arithmetic = [
      `${maxFrozenMs}ms frozen <= ${verdictFreezeThresholdMs}ms threshold`,
      "-> NO ACTION",
    ];
  }

  // Cost avoided: candidates who did NOT need a re-conduct because this
  // incident was contained to `affected` candidates instead of the whole
  // exam. Illustrative constant — the `basis` string says so on screen (A6).
  const candidatesSpared = Math.max(0, input.totalCandidateCount - affected);
  const perCandidateCostInr = config.verdictCostPerCandidateInr;
  const totalInr = candidatesSpared * perCandidateCostInr;

  const reasoning: VerdictReasoning = {
    policy_version: POLICY_VERSION,
    rule,
    inputs: {
      affected_candidates: affected,
      max_frozen_ms: maxFrozenMs,
      avg_frozen_ms: avgFrozenMs,
      checkpoints_lost: input.checkpointsLost,
      threshold_ms: verdictFreezeThresholdMs,
      exam_duration_ms: input.examDurationMs,
    },
    arithmetic,
    cost_avoided: {
      candidates_spared: candidatesSpared,
      per_candidate_cost_inr: perCandidateCostInr,
      total_inr: totalInr,
      basis:
        "illustrative per-candidate re-conduct cost; configurable policy input " +
        `(VERDICT_COST_PER_CANDIDATE_INR=${perCandidateCostInr}), not a real MPOnline figure`,
    },
  };

  return { decision, reasoning };
}
