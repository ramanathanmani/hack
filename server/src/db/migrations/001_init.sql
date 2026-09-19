-- 001_init.sql   (authoritative; do not edit after M1 ships — add 002_*.sql instead)
-- Source of truth: architecture.md §4. INTEGER epoch-milliseconds for every
-- timestamp (never ISO strings, never SQLite datetime()).

-- schema_migrations is bootstrapped by db/migrate.ts before this file runs.

CREATE TABLE centers (
  id            TEXT PRIMARY KEY,           -- 'C1'..'C8'
  name          TEXT NOT NULL,              -- 'Bhopal - Arera Colony'
  status        TEXT NOT NULL CHECK (status IN ('healthy','degraded','down')),
  risk_score    INTEGER NOT NULL DEFAULT 0, -- 0..100, computed by simulator+rules
  candidate_cnt INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE candidate_sessions (
  id                   TEXT PRIMARY KEY,    -- 'S-C3-01'
  center_id            TEXT NOT NULL REFERENCES centers(id),
  candidate_name       TEXT NOT NULL,
  roll_no              TEXT NOT NULL,
  state                TEXT NOT NULL CHECK (state IN ('active','frozen','resumed','submitted')),
  exam_started_at      INTEGER NOT NULL,
  exam_duration_ms     INTEGER NOT NULL,
  frozen_at            INTEGER,             -- non-null iff state='frozen'
  frozen_ms_total      INTEGER NOT NULL DEFAULT 0,   -- accumulated; added back on resume (AC-5)
  current_question_idx INTEGER NOT NULL DEFAULT 0,
  last_answer          TEXT,
  last_checkpoint_hash TEXT
);

CREATE TABLE telemetry_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id  TEXT NOT NULL REFERENCES centers(id),
  ts         INTEGER NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('heartbeat','latency','answer_save','disconnect')),
  value_json TEXT NOT NULL
);
CREATE INDEX idx_tel_center_ts ON telemetry_events(center_id, ts);

CREATE TABLE incidents (
  id             TEXT PRIMARY KEY,          -- 'INC-0001'
  center_id      TEXT NOT NULL REFERENCES centers(id),
  opened_at      INTEGER NOT NULL,
  closed_at      INTEGER,
  classification TEXT NOT NULL,             -- 'Connectivity Loss' | 'Application Crash' | ...
  severity       TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status         TEXT NOT NULL CHECK (status IN ('open','escalated','resolved')),
  affected_count INTEGER NOT NULL DEFAULT 0,
  detail_json    TEXT NOT NULL              -- detection signals that fired, for the timeline
);

CREATE TABLE checkpoints (                  -- APPEND-ONLY. No UPDATE, no DELETE, ever, in app code.
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id  TEXT NOT NULL REFERENCES centers(id),   -- chain is sharded per center (A5)
  session_id TEXT NOT NULL REFERENCES candidate_sessions(id),
  seq        INTEGER NOT NULL,              -- per-center sequence, starts at 0 = genesis
  ts         INTEGER NOT NULL,
  kind       TEXT NOT NULL,                 -- 'genesis'|'answer_save'|'freeze'|'resume'|'submit'
  payload_json TEXT NOT NULL,               -- canonical JSON
  prev_hash  TEXT NOT NULL,                 -- 64 hex; genesis prev_hash = 64 zeros
  hash       TEXT NOT NULL,
  UNIQUE (center_id, seq)
);
CREATE INDEX idx_cp_session ON checkpoints(session_id, seq);

CREATE TABLE verdicts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id   TEXT NOT NULL REFERENCES incidents(id),
  decision      TEXT NOT NULL CHECK (decision IN ('re-conduct','partial-extension','no-action')),
  reasoning_json TEXT NOT NULL,             -- {policy_version, rule, inputs{}, arithmetic[], cost_avoided{}}
  computed_at   INTEGER NOT NULL
);
