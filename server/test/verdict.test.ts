/**
 * test/verdict.test.ts — AC-6, including cost-avoided arithmetic (A4).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { computeVerdict } from "../src/domain/verdict.js";

test("short freeze below threshold -> no-action", () => {
  const { decision } = computeVerdict({
    frozenDurationsMs: [5_000, 4_000],
    checkpointsLost: 0,
    examDurationMs: 3_600_000,
    totalCandidateCount: 412,
  });
  assert.equal(decision, "no-action");
});

test("freeze above freeze-threshold but below reconduct-threshold -> partial-extension, with cost avoided > 0", () => {
  const result = computeVerdict({
    frozenDurationsMs: [47_000, 40_000, 45_000],
    checkpointsLost: 0,
    examDurationMs: 3_600_000,
    totalCandidateCount: 412,
  });
  assert.equal(result.decision, "partial-extension");
  assert.equal(result.reasoning.inputs.affected_candidates, 3);
  assert.equal(result.reasoning.inputs.max_frozen_ms, 47_000);
  assert.ok(result.reasoning.arithmetic.some((line) => line.includes("PARTIAL EXTENSION")));
  assert.ok(result.reasoning.cost_avoided.candidates_spared > 0);
  assert.equal(
    result.reasoning.cost_avoided.total_inr,
    result.reasoning.cost_avoided.candidates_spared * result.reasoning.cost_avoided.per_candidate_cost_inr
  );
  assert.match(result.reasoning.cost_avoided.basis, /illustrative/i);
});

test("very long freeze -> re-conduct", () => {
  const result = computeVerdict({
    frozenDurationsMs: [700_000],
    checkpointsLost: 0,
    examDurationMs: 3_600_000,
    totalCandidateCount: 412,
  });
  assert.equal(result.decision, "re-conduct");
});

test("any checkpoints lost forces re-conduct regardless of duration", () => {
  const result = computeVerdict({
    frozenDurationsMs: [5_000],
    checkpointsLost: 1,
    examDurationMs: 3_600_000,
    totalCandidateCount: 412,
  });
  assert.equal(result.decision, "re-conduct");
});

test("reasoning shape matches the fixed contract (policy_version/rule/inputs/arithmetic/cost_avoided)", () => {
  const { reasoning } = computeVerdict({
    frozenDurationsMs: [47_000],
    checkpointsLost: 0,
    examDurationMs: 3_600_000,
    totalCandidateCount: 412,
  });
  assert.equal(reasoning.policy_version, "v1");
  assert.equal(typeof reasoning.rule, "string");
  assert.equal(typeof reasoning.inputs, "object");
  assert.ok(Array.isArray(reasoning.arithmetic));
  assert.equal(typeof reasoning.cost_avoided.basis, "string");
});
