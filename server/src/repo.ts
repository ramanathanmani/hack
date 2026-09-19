/**
 * repo.ts — all SQL lives here. The only file importing `better-sqlite3`
 * directly besides `db/connection.ts` (architecture.md §3). Domain logic
 * (chain hashing, clock math, classification rules) is imported from
 * `domain/*` but every statement against SQLite is issued from this module.
 *
 * `better-sqlite3` is synchronous, so every multi-statement operation below
 * that must be atomic (freeze-all-sessions-at-a-center, tamper, reset) runs
 * inside a single `db.transaction()` — no interleaving with the simulator's
 * own tick loop (architecture.md §1 bullet 2).
 */

import { getDb, type SentinelDb } from "./db/connection.js";
import { buildNextEntry, verifyChain, type ChainRow, type ChainVerifyResult } from "./domain/chain.js";
import { remainingMs, freezeFields, resumeFields } from "./domain/clock.js";
import { isFreezable, isResumable } from "./domain/sessions.js";
import { severityForAffected, CLASSIFICATION_CONNECTIVITY_LOSS } from "./domain/incidents.js";
import type {
  Center,
  CenterStatus,
  CandidateSession,
  SessionState,
  Incident,
  Checkpoint,
  CheckpointKind,
  Verdict,
  VerdictDecision,
  VerdictReasoning,
  ApiState,
} from "../../shared/types.js";

// ---------------------------------------------------------------------------
// Raw row shapes (snake_case, exactly as SQLite returns them)
// ---------------------------------------------------------------------------

interface CenterRow {
  id: string;
  name: string;
  status: CenterStatus;
  risk_score: number;
  candidate_cnt: number;
  updated_at: number;
}

interface SessionRow {
  id: string;
  center_id: string;
  candidate_name: string;
  roll_no: string;
  state: SessionState;
  exam_started_at: number;
  exam_duration_ms: number;
  frozen_at: number | null;
  frozen_ms_total: number;
  current_question_idx: number;
  last_answer: string | null;
  last_checkpoint_hash: string | null;
}

interface IncidentRow {
  id: string;
  center_id: string;
  opened_at: number;
  closed_at: number | null;
  classification: string;
  severity: string;
  status: string;
  affected_count: number;
  detail_json: string;
}

interface CheckpointRow {
  id: number;
  center_id: string;
  session_id: string;
  seq: number;
  ts: number;
  kind: string;
  payload_json: string;
  prev_hash: string;
  hash: string;
}

interface VerdictRow {
  id: number;
  incident_id: string;
  decision: string;
  reasoning_json: string;
  computed_at: number;
}

// ---------------------------------------------------------------------------
// Mappers: row -> shared type
// ---------------------------------------------------------------------------

function toCenter(row: CenterRow): Center {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    riskScore: row.risk_score,
    candidateCnt: row.candidate_cnt,
    updatedAt: row.updated_at,
  };
}

function toSession(row: SessionRow, now: number): CandidateSession {
  const clockInput = {
    state: row.state,
    examStartedAt: row.exam_started_at,
    examDurationMs: row.exam_duration_ms,
    frozenAt: row.frozen_at,
    frozenMsTotal: row.frozen_ms_total,
  };
  return {
    id: row.id,
    centerId: row.center_id,
    candidateName: row.candidate_name,
    rollNo: row.roll_no,
    state: row.state,
    examStartedAt: row.exam_started_at,
    examDurationMs: row.exam_duration_ms,
    frozenAt: row.frozen_at,
    frozenMsTotal: row.frozen_ms_total,
    currentQuestionIdx: row.current_question_idx,
    lastAnswer: row.last_answer,
    lastCheckpointHash: row.last_checkpoint_hash,
    remainingMs: remainingMs(clockInput, now),
    serverNow: now,
  };
}

function toIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    centerId: row.center_id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    classification: row.classification,
    severity: row.severity as Incident["severity"],
    status: row.status as Incident["status"],
    affectedCount: row.affected_count,
    detailJson: row.detail_json,
  };
}

function toCheckpoint(row: CheckpointRow): Checkpoint {
  return {
    id: row.id,
    centerId: row.center_id,
    sessionId: row.session_id,
    seq: row.seq,
    ts: row.ts,
    kind: row.kind as CheckpointKind,
    payloadJson: row.payload_json,
    prevHash: row.prev_hash,
    hash: row.hash,
  };
}

function toVerdict(row: VerdictRow): Verdict {
  return {
    id: row.id,
    incidentId: row.incident_id,
    decision: row.decision as VerdictDecision,
    reasoning: JSON.parse(row.reasoning_json) as VerdictReasoning,
    computedAt: row.computed_at,
  };
}

// ---------------------------------------------------------------------------
// Repo class
// ---------------------------------------------------------------------------

export class Repo {
  private db: SentinelDb;

  constructor(db: SentinelDb = getDb()) {
    this.db = db;
  }

  // -- Centers --------------------------------------------------------------

  listCenters(): Center[] {
    const rows = this.db.prepare("SELECT * FROM centers ORDER BY id").all() as CenterRow[];
    return rows.map(toCenter);
  }

  getCenter(id: string): Center | null {
    const row = this.db.prepare("SELECT * FROM centers WHERE id = ?").get(id) as CenterRow | undefined;
    return row ? toCenter(row) : null;
  }

  updateCenterStatus(id: string, status: CenterStatus, riskScore: number, now: number): void {
    this.db
      .prepare("UPDATE centers SET status = ?, risk_score = ?, updated_at = ? WHERE id = ?")
      .run(status, riskScore, now, id);
  }

  updateCenterRisk(id: string, riskScore: number, now: number): void {
    this.db.prepare("UPDATE centers SET risk_score = ?, updated_at = ? WHERE id = ?").run(riskScore, now, id);
  }

  // -- Sessions ---------------------------------------------------------------

  listSessions(now: number): CandidateSession[] {
    const rows = this.db.prepare("SELECT * FROM candidate_sessions ORDER BY id").all() as SessionRow[];
    return rows.map((r) => toSession(r, now));
  }

  listSessionsByCenter(centerId: string, now: number): CandidateSession[] {
    const rows = this.db
      .prepare("SELECT * FROM candidate_sessions WHERE center_id = ? ORDER BY id")
      .all(centerId) as SessionRow[];
    return rows.map((r) => toSession(r, now));
  }

  getSession(id: string, now: number): CandidateSession | null {
    const row = this.db.prepare("SELECT * FROM candidate_sessions WHERE id = ?").get(id) as
      | SessionRow
      | undefined;
    return row ? toSession(row, now) : null;
  }

  private getSessionRow(id: string): SessionRow | undefined {
    return this.db.prepare("SELECT * FROM candidate_sessions WHERE id = ?").get(id) as SessionRow | undefined;
  }

  recordAnswer(sessionId: string, questionIdx: number, answer: string): void {
    this.db
      .prepare(
        "UPDATE candidate_sessions SET current_question_idx = ?, last_answer = ? WHERE id = ?"
      )
      .run(questionIdx, answer, sessionId);
  }

  /**
   * Freezes every freezable session at a center and appends a `freeze`
   * checkpoint for each, atomically. Returns the sessions that were frozen.
   */
  freezeSessionsAtCenter(centerId: string, now: number): CandidateSession[] {
    const tx = this.db.transaction(() => {
      const rows = this.db
        .prepare("SELECT * FROM candidate_sessions WHERE center_id = ?")
        .all(centerId) as SessionRow[];
      const frozen: CandidateSession[] = [];
      for (const row of rows) {
        if (!isFreezable(row.state)) continue;
        const fields = freezeFields(now);
        this.db
          .prepare("UPDATE candidate_sessions SET state = ?, frozen_at = ? WHERE id = ?")
          .run(fields.state, fields.frozenAt, row.id);
        const cp = this.appendCheckpointRaw(centerId, row.id, now, "freeze", {
          sessionId: row.id,
          reason: "center disconnected (missed heartbeat)",
        });
        this.db
          .prepare("UPDATE candidate_sessions SET last_checkpoint_hash = ? WHERE id = ?")
          .run(cp.hash, row.id);
        frozen.push(toSession(this.getSessionRow(row.id)!, now));
      }
      return frozen;
    });
    return tx();
  }

  /**
   * Resumes every frozen session at a center, restores accumulated frozen
   * time (AC-5), and appends a `resume` checkpoint for each, atomically.
   */
  resumeSessionsAtCenter(centerId: string, now: number): CandidateSession[] {
    const tx = this.db.transaction(() => {
      const rows = this.db
        .prepare("SELECT * FROM candidate_sessions WHERE center_id = ?")
        .all(centerId) as SessionRow[];
      const resumed: CandidateSession[] = [];
      for (const row of rows) {
        if (!isResumable(row.state)) continue;
        const fields = resumeFields({ frozenAt: row.frozen_at, frozenMsTotal: row.frozen_ms_total }, now);
        this.db
          .prepare(
            "UPDATE candidate_sessions SET state = ?, frozen_at = ?, frozen_ms_total = ? WHERE id = ?"
          )
          .run(fields.state, fields.frozenAt, fields.frozenMsTotal, row.id);
        const cp = this.appendCheckpointRaw(centerId, row.id, now, "resume", {
          sessionId: row.id,
          frozenMsTotal: fields.frozenMsTotal,
        });
        this.db
          .prepare("UPDATE candidate_sessions SET last_checkpoint_hash = ? WHERE id = ?")
          .run(cp.hash, row.id);
        resumed.push(toSession(this.getSessionRow(row.id)!, now));
      }
      return resumed;
    });
    return tx();
  }

  // -- Telemetry --------------------------------------------------------------

  insertTelemetry(centerId: string, ts: number, type: string, valueJson: string): void {
    this.db
      .prepare("INSERT INTO telemetry_events (center_id, ts, type, value_json) VALUES (?, ?, ?, ?)")
      .run(centerId, ts, type, valueJson);
  }

  lastHeartbeatTs(centerId: string): number | null {
    const row = this.db
      .prepare(
        "SELECT ts FROM telemetry_events WHERE center_id = ? AND type = 'heartbeat' ORDER BY ts DESC LIMIT 1"
      )
      .get(centerId) as { ts: number } | undefined;
    return row ? row.ts : null;
  }

  // -- Incidents ----------------------------------------------------------

  listIncidents(): Incident[] {
    const rows = this.db.prepare("SELECT * FROM incidents ORDER BY opened_at DESC").all() as IncidentRow[];
    return rows.map(toIncident);
  }

  getIncident(id: string): Incident | null {
    const row = this.db.prepare("SELECT * FROM incidents WHERE id = ?").get(id) as IncidentRow | undefined;
    return row ? toIncident(row) : null;
  }

  getOpenIncidentForCenter(centerId: string): Incident | null {
    const row = this.db
      .prepare("SELECT * FROM incidents WHERE center_id = ? AND status != 'resolved' ORDER BY opened_at DESC LIMIT 1")
      .get(centerId) as IncidentRow | undefined;
    return row ? toIncident(row) : null;
  }

  openIncident(centerId: string, openedAt: number, affectedCount: number, detail: unknown): Incident {
    const id = this.nextIncidentId();
    const severity = severityForAffected(affectedCount);
    this.db
      .prepare(
        `INSERT INTO incidents (id, center_id, opened_at, closed_at, classification, severity, status, affected_count, detail_json)
         VALUES (?, ?, ?, NULL, ?, ?, 'open', ?, ?)`
      )
      .run(id, centerId, openedAt, CLASSIFICATION_CONNECTIVITY_LOSS, severity, affectedCount, JSON.stringify(detail));
    return this.getIncident(id)!;
  }

  closeIncident(id: string, closedAt: number): Incident {
    this.db.prepare("UPDATE incidents SET status = 'resolved', closed_at = ? WHERE id = ?").run(closedAt, id);
    return this.getIncident(id)!;
  }

  private nextIncidentId(): string {
    const row = this.db.prepare("SELECT COUNT(*) as n FROM incidents").get() as { n: number };
    return `INC-${String(row.n + 1).padStart(4, "0")}`;
  }

  // -- Checkpoints (append-only, per-center hash chain) --------------------

  private lastCheckpointForCenter(centerId: string): { seq: number; hash: string } | null {
    const row = this.db
      .prepare("SELECT seq, hash FROM checkpoints WHERE center_id = ? ORDER BY seq DESC LIMIT 1")
      .get(centerId) as { seq: number; hash: string } | undefined;
    return row ?? null;
  }

  /** Low-level append used by the higher-level freeze/resume/answer helpers. */
  private appendCheckpointRaw(
    centerId: string,
    sessionId: string,
    ts: number,
    kind: CheckpointKind,
    payload: unknown
  ): Checkpoint {
    const prev = this.lastCheckpointForCenter(centerId);
    const { seq, prevHash, hash } = buildNextEntry(centerId, prev, ts, kind, payload);
    const payloadJson = JSON.stringify(payload);
    const info = this.db
      .prepare(
        `INSERT INTO checkpoints (center_id, session_id, seq, ts, kind, payload_json, prev_hash, hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(centerId, sessionId, seq, ts, kind, payloadJson, prevHash, hash);
    return toCheckpoint({
      id: Number(info.lastInsertRowid),
      center_id: centerId,
      session_id: sessionId,
      seq,
      ts,
      kind,
      payload_json: payloadJson,
      prev_hash: prevHash,
      hash,
    });
  }

  /** Public append entry point (e.g. genesis, answer_save, submit). */
  appendCheckpoint(centerId: string, sessionId: string, ts: number, kind: CheckpointKind, payload: unknown): Checkpoint {
    const tx = this.db.transaction(() => {
      const cp = this.appendCheckpointRaw(centerId, sessionId, ts, kind, payload);
      this.db
        .prepare("UPDATE candidate_sessions SET last_checkpoint_hash = ? WHERE id = ?")
        .run(cp.hash, sessionId);
      return cp;
    });
    return tx();
  }

  getCheckpointsBySession(sessionId: string): Checkpoint[] {
    const rows = this.db
      .prepare("SELECT * FROM checkpoints WHERE session_id = ? ORDER BY seq ASC")
      .all(sessionId) as CheckpointRow[];
    return rows.map(toCheckpoint);
  }

  getRecentCheckpoints(limit: number): Checkpoint[] {
    const rows = this.db
      .prepare("SELECT * FROM checkpoints ORDER BY id DESC LIMIT ?")
      .all(limit) as CheckpointRow[];
    return rows.map(toCheckpoint).reverse();
  }

  /** Every checkpoint row, grouped by center, in the shape chain.verifyChain() wants. */
  getAllCheckpointsGroupedByCenter(): Map<string, ChainRow[]> {
    const rows = this.db.prepare("SELECT * FROM checkpoints ORDER BY center_id, seq ASC").all() as CheckpointRow[];
    const grouped = new Map<string, ChainRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.center_id) ?? [];
      list.push({
        id: row.id,
        seq: row.seq,
        ts: row.ts,
        kind: row.kind,
        payloadJson: row.payload_json,
        prevHash: row.prev_hash,
        hash: row.hash,
      });
      grouped.set(row.center_id, list);
    }
    return grouped;
  }

  verifyLedger(): ChainVerifyResult {
    return verifyChain(this.getAllCheckpointsGroupedByCenter());
  }

  /**
   * A2 — the tamper path. Raw UPDATE bypassing the append-only application
   * API on purpose, so the verifier's PASS->FAIL demo is real. Never called
   * anywhere except the quarantined `/api/sim/tamper` route and
   * `scripts/tamper.ts`.
   */
  tamperCheckpoint(checkpointId: number, newPayload: unknown): Checkpoint | null {
    const row = this.db.prepare("SELECT * FROM checkpoints WHERE id = ?").get(checkpointId) as
      | CheckpointRow
      | undefined;
    if (!row) return null;
    const payloadJson = JSON.stringify(newPayload);
    this.db.prepare("UPDATE checkpoints SET payload_json = ? WHERE id = ?").run(payloadJson, checkpointId);
    return toCheckpoint({ ...row, payload_json: payloadJson });
  }

  /** Picks a deterministic tamper target: the latest checkpoint overall, if any. */
  pickTamperTarget(): Checkpoint | null {
    const row = this.db.prepare("SELECT * FROM checkpoints ORDER BY id DESC LIMIT 1").get() as
      | CheckpointRow
      | undefined;
    return row ? toCheckpoint(row) : null;
  }

  // -- Verdicts -------------------------------------------------------------

  insertVerdict(incidentId: string, decision: VerdictDecision, reasoning: VerdictReasoning, computedAt: number): Verdict {
    const info = this.db
      .prepare(
        "INSERT INTO verdicts (incident_id, decision, reasoning_json, computed_at) VALUES (?, ?, ?, ?)"
      )
      .run(incidentId, decision, JSON.stringify(reasoning), computedAt);
    return this.getVerdict(Number(info.lastInsertRowid))!;
  }

  getVerdict(id: number): Verdict | null {
    const row = this.db.prepare("SELECT * FROM verdicts WHERE id = ?").get(id) as VerdictRow | undefined;
    return row ? toVerdict(row) : null;
  }

  getVerdictsByIncident(incidentId: string): Verdict[] {
    const rows = this.db
      .prepare("SELECT * FROM verdicts WHERE incident_id = ? ORDER BY computed_at DESC")
      .all(incidentId) as VerdictRow[];
    return rows.map(toVerdict);
  }

  listVerdicts(): Verdict[] {
    const rows = this.db.prepare("SELECT * FROM verdicts ORDER BY computed_at DESC").all() as VerdictRow[];
    return rows.map(toVerdict);
  }

  totalCandidateCount(): number {
    const row = this.db.prepare("SELECT COUNT(*) as n FROM candidate_sessions").get() as { n: number };
    return row.n;
  }

  // -- Aggregate state (GET /api/state, architecture decision #2) -----------

  getApiState(now: number): ApiState {
    return {
      serverNow: now,
      centers: this.listCenters(),
      sessions: this.listSessions(now),
      incidents: this.listIncidents(),
      recentCheckpoints: this.getRecentCheckpoints(50),
      verdicts: this.listVerdicts(),
    };
  }

  // -- Seed / reset (AC-12) ---------------------------------------------------

  isEmpty(): boolean {
    const row = this.db.prepare("SELECT COUNT(*) as n FROM centers").get() as { n: number };
    return row.n === 0;
  }

  /** Truncates every table and resets sqlite_sequence — used by seed + reset. */
  truncateAll(): void {
    const tx = this.db.transaction(() => {
      for (const table of ["verdicts", "checkpoints", "incidents", "telemetry_events", "candidate_sessions", "centers"]) {
        this.db.prepare(`DELETE FROM ${table}`).run();
      }
      this.db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('checkpoints','verdicts','telemetry_events')").run();
    });
    tx();
  }

  seedScenario(
    centers: { id: string; name: string }[],
    sessions: { id: string; centerId: string; candidateName: string; rollNo: string }[],
    examDurationMs: number,
    now: number
  ): void {
    const tx = this.db.transaction(() => {
      const perCenterCount = new Map<string, number>();
      for (const s of sessions) perCenterCount.set(s.centerId, (perCenterCount.get(s.centerId) ?? 0) + 1);

      for (const c of centers) {
        this.db
          .prepare(
            `INSERT INTO centers (id, name, status, risk_score, candidate_cnt, updated_at)
             VALUES (?, ?, 'healthy', 0, ?, ?)`
          )
          .run(c.id, c.name, perCenterCount.get(c.id) ?? 0, now);
      }

      for (const s of sessions) {
        this.db
          .prepare(
            `INSERT INTO candidate_sessions
               (id, center_id, candidate_name, roll_no, state, exam_started_at, exam_duration_ms,
                frozen_at, frozen_ms_total, current_question_idx, last_answer, last_checkpoint_hash)
             VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, 0, 0, NULL, NULL)`
          )
          .run(s.id, s.centerId, s.candidateName, s.rollNo, now, examDurationMs);

        // One genesis checkpoint per session (architecture.md §13: "npm run
        // seed produces the scenario at t=0 ... one genesis checkpoint per
        // center" — implemented here per session so every session already
        // has a chain entry before any freeze, satisfying AC-4).
        const cp = this.appendCheckpointRaw(s.centerId, s.id, now, "genesis", {
          sessionId: s.id,
          candidateName: s.candidateName,
          rollNo: s.rollNo,
        });
        this.db.prepare("UPDATE candidate_sessions SET last_checkpoint_hash = ? WHERE id = ?").run(cp.hash, s.id);
      }

      // Seed one heartbeat per center so lastHeartbeatTs() is defined immediately.
      for (const c of centers) {
        this.insertTelemetry(c.id, now, "heartbeat", JSON.stringify({ ok: true }));
      }
    });
    tx();
  }
}

let sharedRepo: Repo | null = null;

/** Process-wide singleton, mirrors getDb()'s singleton pattern. */
export function getRepo(): Repo {
  if (!sharedRepo) sharedRepo = new Repo(getDb());
  return sharedRepo;
}
