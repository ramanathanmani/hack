/**
 * test/chain.test.ts — AC-7 / AC-8. Written first, DB-free, per
 * architecture.md §14 ("First code written should be chain.ts +
 * chain.test.ts, because AC-7/AC-8 fail silently and late if that is
 * wrong").
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalJson,
  hashEntry,
  buildNextEntry,
  verifyChain,
  GENESIS_PREV_HASH,
  type ChainRow,
} from "../src/domain/chain.js";

test("canonicalJson is deterministic regardless of key insertion order", () => {
  const a = { b: 2, a: 1, c: { z: 1, y: 2 } };
  const b = { c: { y: 2, z: 1 }, a: 1, b: 2 };
  assert.equal(canonicalJson(a), canonicalJson(b));
});

test("canonicalJson drops undefined values, sorts nested arrays' object keys", () => {
  const a = { x: 1, y: undefined, list: [{ b: 1, a: 2 }] };
  assert.equal(canonicalJson(a), '{"list":[{"a":2,"b":1}],"x":1}');
  assert.equal(JSON.parse(canonicalJson(a)).y, undefined);
});

test("hashEntry is deterministic for identical logical input", () => {
  const h1 = hashEntry({
    prevHash: GENESIS_PREV_HASH,
    centerId: "C1",
    seq: 0,
    ts: 1000,
    kind: "genesis",
    payload: { a: 1, b: 2 },
  });
  const h2 = hashEntry({
    prevHash: GENESIS_PREV_HASH,
    centerId: "C1",
    seq: 0,
    ts: 1000,
    kind: "genesis",
    payload: { b: 2, a: 1 },
  });
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);
});

test("hashEntry changes when any field changes", () => {
  const base = {
    prevHash: GENESIS_PREV_HASH,
    centerId: "C1",
    seq: 0,
    ts: 1000,
    kind: "genesis",
    payload: { a: 1 },
  };
  const h0 = hashEntry(base);
  assert.notEqual(hashEntry({ ...base, ts: 1001 }), h0);
  assert.notEqual(hashEntry({ ...base, seq: 1 }), h0);
  assert.notEqual(hashEntry({ ...base, kind: "freeze" }), h0);
  assert.notEqual(hashEntry({ ...base, payload: { a: 2 } }), h0);
});

function buildRow(
  centerId: string,
  prev: { seq: number; hash: string } | null,
  id: number,
  ts: number,
  kind: string,
  payload: unknown
): ChainRow {
  const { seq, prevHash, hash } = buildNextEntry(centerId, prev, ts, kind, payload);
  return { id, seq, ts, kind, payloadJson: JSON.stringify(payload), prevHash, hash };
}

test("verifyChain passes on an untampered multi-center chain", () => {
  const c1r0 = buildRow("C1", null, 1, 1000, "genesis", { note: "genesis" });
  const c1r1 = buildRow("C1", c1r0, 2, 2000, "answer_save", { q: 1, a: "B" });
  const c2r0 = buildRow("C2", null, 3, 1000, "genesis", { note: "genesis" });

  const rowsByCenter = new Map<string, ChainRow[]>([
    ["C1", [c1r0, c1r1]],
    ["C2", [c2r0]],
  ]);

  const result = verifyChain(rowsByCenter);
  assert.deepEqual(result, { ok: true });
});

test("verifyChain detects a tampered payload and identifies the exact broken row (AC-8)", () => {
  const c1r0 = buildRow("C1", null, 1, 1000, "genesis", { note: "genesis" });
  const c1r1 = buildRow("C1", c1r0, 2, 2000, "answer_save", { q: 1, a: "B" });
  const c1r2 = buildRow("C1", c1r1, 3, 3000, "freeze", { reason: "kill" });

  // Simulate a raw UPDATE tamper (A2): mutate row 2's payload directly,
  // leaving its stored hash untouched — exactly what scripts/tamper.ts does.
  const tampered: ChainRow = { ...c1r1, payloadJson: JSON.stringify({ q: 1, a: "TAMPERED" }) };

  const rowsByCenter = new Map<string, ChainRow[]>([["C1", [c1r0, tampered, c1r2]]]);

  const result = verifyChain(rowsByCenter);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.brokenAt.centerId, "C1");
    assert.equal(result.brokenAt.rowId, 2);
    assert.equal(result.brokenAt.seq, 1);
    assert.notEqual(result.brokenAt.expectedHash, result.brokenAt.actualHash);
  }
});

test("verifyChain detects a broken prev_hash link", () => {
  const c1r0 = buildRow("C1", null, 1, 1000, "genesis", { note: "genesis" });
  const c1r1 = buildRow("C1", c1r0, 2, 2000, "answer_save", { q: 1, a: "B" });
  const brokenLink: ChainRow = { ...c1r1, prevHash: "f".repeat(64) };

  const rowsByCenter = new Map<string, ChainRow[]>([["C1", [c1r0, brokenLink]]]);
  const result = verifyChain(rowsByCenter);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.brokenAt.rowId, 2);
    assert.equal(result.brokenAt.actualHash, "f".repeat(64));
  }
});

test("genesis row uses the all-zero prev_hash and seq 0", () => {
  const entry = buildNextEntry("C1", null, 1000, "genesis", { note: "genesis" });
  assert.equal(entry.seq, 0);
  assert.equal(entry.prevHash, GENESIS_PREV_HASH);
});
