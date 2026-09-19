/**
 * domain/sessions.ts — the session state machine: active -> frozen ->
 * resumed -> submitted. Pure helpers only; repo.ts owns persistence so that
 * state transitions and hash-chain appends happen inside one synchronous
 * better-sqlite3 transaction (architecture.md §1 bullet 2 — no interleaving
 * between a simulator tick and a kill-switch request).
 */

import type { SessionState } from "../../../shared/types.js";

/** Sessions eligible to be frozen when their center goes down. */
export function isFreezable(state: SessionState): boolean {
  return state === "active" || state === "resumed";
}

/** Sessions eligible to be resumed when their center recovers. */
export function isResumable(state: SessionState): boolean {
  return state === "frozen";
}
