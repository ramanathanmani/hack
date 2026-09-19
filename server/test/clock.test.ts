/**
 * test/clock.test.ts — AC-5 time restoration (architecture.md §11 risk 2:
 * "after a 47s freeze, remaining_ms at resume equals remaining_ms at freeze
 * ±50ms").
 */

import test from "node:test";
import assert from "node:assert/strict";
import { remainingMs, freezeFields, resumeFields } from "../src/domain/clock.js";

test("remainingMs counts down normally while active", () => {
  const session = {
    state: "active",
    examStartedAt: 0,
    examDurationMs: 3600_000,
    frozenAt: null,
    frozenMsTotal: 0,
  };
  assert.equal(remainingMs(session, 10_000), 3_590_000);
});

test("remainingMs freezes at the value it had at frozen_at, not wall clock", () => {
  const started = { state: "active", examStartedAt: 0, examDurationMs: 3600_000, frozenAt: null, frozenMsTotal: 0 };
  const frozenAtNow = 60_000;
  const frozen = { ...started, ...freezeFields(frozenAtNow) };
  const remainingAtFreeze = remainingMs(frozen, frozenAtNow);
  // Wait "47s" of wall clock while still frozen — remaining must not move.
  const remainingLater = remainingMs(frozen, frozenAtNow + 47_000);
  assert.equal(remainingAtFreeze, remainingLater);
});

test("resume restores exactly the frozen duration (±50ms)", () => {
  const examStartedAt = 0;
  const examDurationMs = 3600_000;
  let session = { state: "active" as string, examStartedAt, examDurationMs, frozenAt: null as number | null, frozenMsTotal: 0 };

  const freezeAt = 60_000;
  const remainingAtFreeze = remainingMs(session, freezeAt);
  session = { ...session, ...freezeFields(freezeAt) };

  const resumeAt = freezeAt + 47_000; // frozen for exactly 47s
  session = { ...session, ...resumeFields(session, resumeAt) };

  const remainingAtResume = remainingMs(session, resumeAt);
  assert.ok(
    Math.abs(remainingAtResume - remainingAtFreeze) <= 50,
    `expected |${remainingAtResume} - ${remainingAtFreeze}| <= 50`
  );
  assert.equal(session.state, "resumed");
  assert.equal(session.frozenAt, null);
  assert.equal(session.frozenMsTotal, 47_000);
});
