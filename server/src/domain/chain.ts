/**
 * domain/chain.ts — the SHA-256 hash chain. FIRST file written for the
 * backend (architecture.md §14: "First code written should be chain.ts +
 * chain.test.ts"). AC-7/AC-8 depend entirely on this module being correct
 * and deterministic.
 *
 * The chain is sharded per center (A5 / architecture.md §12): each center
 * has its own append-only sequence starting at seq=0 (genesis), so
 * verification is O(rows-in-one-center) and parallelises across centers.
 *
 * Hash rule (architecture.md §4, single definition — nowhere else):
 *   hash = sha256(prev_hash + "|" + center_id + "|" + seq + "|" + ts + "|"
 *                 + kind + "|" + canonicalJson(payload))
 *   genesis: prev_hash = "0".repeat(64), seq = 0, one per center.
 *
 * This module is pure/DB-free on purpose so it can be unit-tested without a
 * database (chain.test.ts) and reused identically by repo.ts (append),
 * routes/audit.ts (verify), and scripts/verify-chain.ts / scripts/tamper.ts.
 */

import { createHash } from "node:crypto";

export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * Deterministic JSON serialization: recursively sort object keys, no
 * whitespace, `undefined` values dropped (matches JSON.stringify's own
 * behavior for undefined object values). Must be deterministic or AC-7
 * flakes (architecture.md §4).
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value));
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      const v = input[key];
      if (v === undefined) continue;
      output[key] = sortForCanonicalJson(v);
    }
    return output;
  }
  return value;
}

export interface ChainEntryInput {
  prevHash: string;
  centerId: string;
  seq: number;
  ts: number;
  kind: string;
  payload: unknown;
}

/** Computes the hash for one chain entry per the rule above. */
export function hashEntry(input: ChainEntryInput): string {
  const material = [
    input.prevHash,
    input.centerId,
    String(input.seq),
    String(input.ts),
    input.kind,
    canonicalJson(input.payload),
  ].join("|");
  return createHash("sha256").update(material, "utf8").digest("hex");
}

/** Row shape as persisted in the `checkpoints` table (camelCase). */
export interface ChainRow {
  id: number;
  seq: number;
  ts: number;
  kind: string;
  payloadJson: string;
  prevHash: string;
  hash: string;
}

export interface ChainVerifyBrokenAt {
  centerId: string;
  rowId: number;
  seq: number;
  expectedHash: string;
  actualHash: string;
}

export type ChainVerifyResult =
  | { ok: true }
  | { ok: false; brokenAt: ChainVerifyBrokenAt };

/**
 * Walks each center's chain in seq order, recomputes every hash, and on the
 * first mismatch (either a broken prev_hash link or a broken hash) returns
 * the exact row identity plus both hashes (AC-8).
 */
export function verifyChain(
  rowsByCenter: Map<string, ChainRow[]>
): ChainVerifyResult {
  for (const [centerId, rowsUnsorted] of rowsByCenter) {
    const rows = [...rowsUnsorted].sort((a, b) => a.seq - b.seq);
    let expectedPrev = GENESIS_PREV_HASH;
    for (const row of rows) {
      if (row.prevHash !== expectedPrev) {
        return {
          ok: false,
          brokenAt: {
            centerId,
            rowId: row.id,
            seq: row.seq,
            expectedHash: expectedPrev,
            actualHash: row.prevHash,
          },
        };
      }
      let payload: unknown;
      try {
        payload = JSON.parse(row.payloadJson);
      } catch {
        payload = row.payloadJson;
      }
      const expectedHash = hashEntry({
        prevHash: row.prevHash,
        centerId,
        seq: row.seq,
        ts: row.ts,
        kind: row.kind,
        payload,
      });
      if (expectedHash !== row.hash) {
        return {
          ok: false,
          brokenAt: {
            centerId,
            rowId: row.id,
            seq: row.seq,
            expectedHash,
            actualHash: row.hash,
          },
        };
      }
      expectedPrev = row.hash;
    }
  }
  return { ok: true };
}

/**
 * Builds the fields for the next checkpoint row given the previous row (or
 * null for genesis). Pure — repo.ts is responsible for persisting the
 * result inside its own transaction so append order matches DB order.
 */
export function buildNextEntry(
  centerId: string,
  prev: { seq: number; hash: string } | null,
  ts: number,
  kind: string,
  payload: unknown
): { seq: number; prevHash: string; hash: string } {
  const seq = prev ? prev.seq + 1 : 0;
  const prevHash = prev ? prev.hash : GENESIS_PREV_HASH;
  const hash = hashEntry({ prevHash, centerId, seq, ts, kind, payload });
  return { seq, prevHash, hash };
}
