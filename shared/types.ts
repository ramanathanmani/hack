/**
 * shared/types.ts — single source of truth for cross-cutting shapes.
 *
 * Owner: integration-agent (per architecture.md §3). backend-builder and
 * frontend-builder read this file but do not edit it; if a shape must
 * change mid-build, request it from integration-agent.
 *
 * Rule (architecture.md §8): every WS event's payload is a subset of
 * `/api/state`'s shape, so the poll fallback and the push path converge on
 * identical reducer code on the client.
 *
 * Timestamps are always INTEGER epoch-milliseconds, never ISO strings.
 */

// ---------------------------------------------------------------------------
// Core domain shapes (mirror server/src/db/migrations/001_init.sql)
// ---------------------------------------------------------------------------

export type CenterStatus = "healthy" | "degraded" | "down";

export interface Center {
  id: string; // 'C1'..'C8'
  name: string; // 'Bhopal - Arera Colony'
  status: CenterStatus;
  riskScore: number; // 0..100
  candidateCnt: number;
  updatedAt: number; // epoch ms
}

export type SessionState = "active" | "frozen" | "resumed" | "submitted";

export interface CandidateSession {
  id: string; // 'S-C3-01'
  centerId: string;
  candidateName: string;
  rollNo: string;
  state: SessionState;
  examStartedAt: number; // epoch ms
  examDurationMs: number;
  frozenAt: number | null; // non-null iff state === 'frozen'
  frozenMsTotal: number; // accumulated; added back on resume (AC-5)
  currentQuestionIdx: number;
  lastAnswer: string | null;
  lastCheckpointHash: string | null;
  // Server-computed, authoritative clock fields (architecture.md §5).
  // Present on every payload that includes a session; the UI never computes these.
  remainingMs: number;
  serverNow: number;
}

export type TelemetryEventType =
  | "heartbeat"
  | "latency"
  | "answer_save"
  | "disconnect";

export interface TelemetryEvent {
  id: number;
  centerId: string;
  ts: number;
  type: TelemetryEventType;
  valueJson: string;
}

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "escalated" | "resolved";

export interface Incident {
  id: string; // 'INC-0001'
  centerId: string;
  openedAt: number;
  closedAt: number | null;
  classification: string; // 'Connectivity Loss' | 'Application Crash' | ...
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedCount: number;
  detailJson: string; // detection signals that fired, for the timeline
}

export type CheckpointKind =
  | "genesis"
  | "answer_save"
  | "freeze"
  | "resume"
  | "submit";

export interface Checkpoint {
  id: number;
  centerId: string; // chain is sharded per center (A5)
  sessionId: string;
  seq: number; // per-center sequence, starts at 0 = genesis
  ts: number;
  kind: CheckpointKind;
  payloadJson: string; // canonical JSON
  prevHash: string; // 64 hex; genesis prevHash = 64 zeros
  hash: string;
}

export type VerdictDecision = "re-conduct" | "partial-extension" | "no-action";

export interface VerdictReasoning {
  policy_version: string; // e.g. "v1"
  rule: string;
  inputs: {
    affected_candidates: number;
    max_frozen_ms: number;
    avg_frozen_ms: number;
    checkpoints_lost: number;
    threshold_ms: number;
    exam_duration_ms: number;
    [key: string]: number;
  };
  arithmetic: string[];
  cost_avoided: {
    candidates_spared: number;
    per_candidate_cost_inr: number;
    total_inr: number;
    basis: string; // mandatory — cost figure is illustrative, must say so on screen (A6)
  };
}

export interface Verdict {
  id: number;
  incidentId: string;
  decision: VerdictDecision;
  reasoning: VerdictReasoning;
  computedAt: number;
}

// ---------------------------------------------------------------------------
// Chain verification result (AC-8)
// ---------------------------------------------------------------------------

export interface ChainVerifyOk {
  ok: true;
}

export interface ChainVerifyBroken {
  ok: false;
  brokenAt: {
    centerId: string;
    rowId: number;
    seq: number;
    expectedHash: string;
    actualHash: string;
  };
}

export type ChainVerifyResult = ChainVerifyOk | ChainVerifyBroken;

// ---------------------------------------------------------------------------
// Connection status (client-side, but shape lives here for consistency)
// ---------------------------------------------------------------------------

export type ConnectionMode = "live" | "polling" | "offline";

// ---------------------------------------------------------------------------
// ApiState — the GET /api/state payload. Single aggregate the whole UI can
// hydrate from, and the shape every WS event payload is a subset of.
// ---------------------------------------------------------------------------

export interface ApiState {
  serverNow: number;
  centers: Center[];
  sessions: CandidateSession[];
  incidents: Incident[];
  // Most recent checkpoints only (tail), for the live-appending ledger panel.
  // Full history is fetched via GET /api/sessions/:id/checkpoints.
  recentCheckpoints: Checkpoint[];
  verdicts: Verdict[];
}

// ---------------------------------------------------------------------------
// WS event union — exhaustive switch on the client (architecture.md §8)
// ---------------------------------------------------------------------------

export type WsEvent =
  | { type: "center.updated"; payload: Center }
  | { type: "session.updated"; payload: CandidateSession }
  | { type: "incident.opened"; payload: Incident }
  | { type: "incident.updated"; payload: Incident }
  | { type: "checkpoint.appended"; payload: Checkpoint }
  | { type: "verdict.computed"; payload: Verdict }
  | { type: "sim.reset"; payload: ApiState }
  | { type: "state.snapshot"; payload: ApiState };
