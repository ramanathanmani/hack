# ARCHITECTURE — Sentinel

Phase: ARCHITECTURE (complete) · Agent: architect · Date: 2026-09-19
Implements: `/home/user/hack/.hackathon/specs/spec-a.md` as amended by `decision.md` §4–§5.
Binding acceptance surface: decision.md §7 (AC-1..AC-14). Binding build order: decision.md A1 (M1→M4).

> **Architect's freeze restatement.** This document adds *no features*. Everything below maps to an
> AC number or to an amendment. If a builder cannot trace a file they are writing to an AC, they
> should not write it.

---

## 0. One-paragraph shape

One Node process is the whole product. It owns SQLite (`better-sqlite3`), a deterministic telemetry
simulator running on a single `setInterval` tick, a Fastify HTTP API, a `ws` WebSocket broadcast
channel, and — in production mode — it also serves the pre-built React bundle as static files. So
the "deploy" is `npm run build && npm start`, one process, one port, one `.db` file, no network.
The React app is a pure view over server state: it never computes exam time, never computes a
verdict, never computes a hash. It renders what the server pushes. That single rule kills the
biggest risk in the register (clock/bookkeeping drift, decision.md §6 row 2).

---

## 1. Stack + why (5 bullets)

| Layer | Choice |
|---|---|
| Language | TypeScript on Node.js 22 (verified present: `node v22.22.2`, `npm 10.9.7`) |
| Backend | Fastify 5 + `@fastify/static` + `ws` (raw, not socket.io) |
| DB | SQLite via `better-sqlite3` (synchronous, embedded, single file `data/sentinel.db`) |
| Ledger | Hand-rolled SHA-256 hash chain on `node:crypto`, one chain **per center** |
| Frontend | React 19 + Vite 6 + TypeScript, plain CSS (no UI kit, no CDN) |
| Host | **localhost, self-hosted, offline.** `npm start` serves API + WS + static UI on `:8080` |

Why, five bullets:

1. **One language, one process, one file to show a judge.** Shared TS types between simulator,
   server and UI mean the discriminated-union session state machine (`active|frozen|resumed|
   submitted`) is compile-checked on both ends. The whole persisted truth is one `.db` file we can
   literally point at on stage — which is what makes the tamper beat (AC-8) legible.
2. **`better-sqlite3` is synchronous.** No await races in checkpoint append, no interleaving between
   a simulator tick and a kill-switch request. Hash-chain append order is therefore trivially
   correct without a queue or a lock. This is the single highest-value boring choice here.
3. **Fastify + raw `ws` over socket.io.** We need one broadcast channel and a hand-written reconnect
   that degrades to polling (merge M5 / AC-9 resilience). socket.io's reconnect is a black box we'd
   have to fight to make *visibly* degrade; 40 lines of our own `WebSocket` + `setInterval(2000)`
   fallback is less code and is demoable.
4. **Vite builds to static files the same Node process serves.** No second runtime, no proxy in
   production, no CORS, no Docker required to run. `npm start` on a laptop with wifi off satisfies
   AC-9 and AC-14 by construction, because there is nothing to call out to.
5. **Hash chain, not blockchain** (verbatim from research.md §1, required in this doc by decision.md
   §6): *"a real blockchain adds consensus/latency problems irrelevant to a single-authority exam
   ledger, and would read as cargo-culting to a judge who asks 'why blockchain?' A plain hash chain
   honestly demonstrates tamper-evidence and is trivial to verify live."* The exam authority is
   singular (MPOnline); the property we need is tamper-*evidence*, not distributed consensus.

---

## 2. What we will NOT use

Hard bans. A PR introducing any of these is rejected on sight.

- **No blockchain / DLT / Merkle library.** (research.md §2 NO-GO.) `node:crypto` only.
- **No hosted DB, no Supabase/Neon/Postgres, no ORM (no Prisma, no Drizzle).** Hand-written SQL in
  one `db/` module. Migrations are `.sql` files run at boot.
- **No cloud host, no Vercel/Render/Railway/Fly, no account signup, no API key.** There is no
  credential in this environment and the demo is in-person at a team station.
- **No `sqlite3` CLI dependency anywhere** — not installed (research.md line 8). Amendment A2: the
  tamper path is an in-app control plus an `npm run tamper` node script. Any builder who writes
  `sqlite3 data/sentinel.db "UPDATE..."` has broken the demo.
- **No external network at runtime (AC-14).** No CDN fonts (`@fontsource`-style local packages or
  system font stack only), no map tiles, no icon CDN, no Google Fonts, no analytics, no telemetry.
  Icons are inline SVG we write. A CI-ish check (`npm run check:offline`) greps the built bundle for
  `http://`/`https://` origins.
- **No auth/login/roles** (spec-a §12, research.md §2 "do not build it; do not mock it either").
- **No LLM, no ML model, no vector DB.** The "anomaly detection" is threshold rules on synthetic
  signals and is stated as such on screen (A6). There is no AI in this product and we will not
  pretend otherwise.
- **No Tailwind/MUI/shadcn/Chakra, no charting library, no `recharts`.** Plain CSS + CSS grid +
  inline SVG. (Sparkline is cut-list item 3 anyway.)
- **No socket.io, no xstate, no Temporal/Camunda, no Redis, no message queue.**
- **No test framework beyond `node:test`** (stdlib, zero install, runs under `tsx`).
- **No Docker requirement.** A Compose wrapper is M4 / cut-list item 2 — optional polish only, never
  the documented way to run the demo.
- **No load-test theater** (A5). Scalability lives in §12 of this doc as prose and code comments.

---

## 3. Repo folder map + owners

Monorepo, npm workspaces, two workspaces (`server`, `web`) plus a shared types package that is just
a folder (no build step — `web` imports it via a Vite alias, `server` via tsconfig paths).

**One writer per path. These boundaries are the parallelism contract.**

```
/home/user/hack/
├── package.json                 # workspaces, root scripts    [integration-agent]
├── package-lock.json                                          [integration-agent]
├── tsconfig.base.json                                         [integration-agent]
├── .env.example                                               [integration-agent]
├── .gitignore                   # data/*.db, node_modules, dist, *.mp4 EXCEPT demo/
├── README.md                    # written at SUBMIT           [readme-submit]
│
├── shared/                      # ── SHARED TYPES: integration-agent owns, others read-only
│   └── types.ts                 # Center, Session, Incident, Checkpoint, Verdict, WsEvent union,
│                                # ApiState (the GET /api/state payload). Single source of truth.
│
├── server/                      # ─────────────────── backend-builder owns everything below
│   ├── package.json
│   ├── src/
│   │   ├── index.ts             # boot: migrate → seed → Fastify → ws → simulator.start()
│   │   ├── config.ts            # env var parsing + defaults (§6)
│   │   ├── db/
│   │   │   ├── connection.ts    # better-sqlite3 handle, PRAGMA journal_mode=WAL, foreign_keys=ON
│   │   │   ├── migrate.ts       # runs migrations/*.sql in filename order, tracks schema_migrations
│   │   │   ├── migrations/
│   │   │   │   ├── 001_init.sql
│   │   │   │   └── 002_*.sql    # only if M2+ needs a column; never edit 001 after M1 ships
│   │   │   └── repo.ts          # all SQL. Nothing else in the codebase writes SQL.
│   │   ├── domain/
│   │   │   ├── chain.ts         # canonicalJson(), hashEntry(), appendCheckpoint(), verifyChain()
│   │   │   ├── clock.ts         # remainingMs(session, now) — THE authoritative exam clock
│   │   │   ├── sessions.ts      # state machine active→frozen→resumed→submitted
│   │   │   ├── incidents.ts     # open/classify/severity/escalate/close
│   │   │   └── verdict.ts       # policy object + compute(): rule, inputs, arithmetic, cost avoided
│   │   ├── sim/
│   │   │   ├── simulator.ts     # seeded tick loop, kill(), reconnect(), reset()
│   │   │   ├── rng.ts           # mulberry32 seeded PRNG — no Math.random() anywhere
│   │   │   └── scenario.ts      # fixed centers/candidates/questions/answers fixtures
│   │   ├── routes/
│   │   │   ├── state.ts         # GET /api/state          (merge M5)
│   │   │   ├── centers.ts       # GET /api/centers, /api/centers/:id
│   │   │   ├── sessions.ts      # GET /api/sessions/:id, /:id/checkpoints
│   │   │   ├── incidents.ts     # GET /api/incidents, /api/incidents/:id
│   │   │   ├── verdicts.ts      # GET /api/verdicts/:incidentId
│   │   │   ├── audit.ts         # POST /api/audit/verify, POST /api/sim/tamper  (A2)
│   │   │   └── sim.ts           # POST /api/sim/kill/:centerId, /reconnect/:centerId, /reset
│   │   ├── ws/hub.ts            # client registry + broadcast(event)
│   │   └── static.ts            # prod-only: @fastify/static serving ../../web/dist + SPA fallback
│   ├── scripts/
│   │   ├── verify-chain.ts      # npm run verify-chain  (cut-list item 8 fallback)
│   │   ├── tamper.ts            # npm run tamper        (A2 second path)
│   │   └── seed.ts              # npm run seed          [data-seeder may edit this ONE file]
│   └── test/
│       ├── chain.test.ts        # AC-7 / AC-8
│       ├── clock.test.ts        # AC-5 time restoration
│       ├── verdict.test.ts      # AC-6 incl. cost-avoided arithmetic
│       └── determinism.test.ts  # AC-12 same seed ⇒ same event stream
│
├── web/                         # ─────────────────── frontend-builder owns everything below
│   ├── package.json
│   ├── index.html               # title, no external <link>/<script> (AC-14)
│   ├── vite.config.ts           # dev proxy /api + /ws → :8080; alias @shared
│   └── src/
│       ├── main.tsx, App.tsx, router.tsx
│       ├── styles/              # tokens.css, app.css — plain CSS, system font stack
│       ├── lib/
│       │   ├── api.ts           # fetch wrappers, typed by @shared/types
│       │   └── useLiveState.ts  # WS subscribe + auto-degrade to 2s poll of /api/state (M5/M4)
│       ├── routes/
│       │   ├── ControlTower.tsx # `/`  — self-sufficient for the whole arc (AC-10)
│       │   ├── Audit.tsx        # `/audit` — verifier + quarantined SIMULATOR panel (A2)
│       │   ├── CenterDetail.tsx # `/center/:id`      (M4, cut #1)
│       │   ├── SessionDetail.tsx# `/session/:id`     (M4, cut #4)
│       │   ├── Incidents.tsx    # `/incidents`       (M4, cut #1)
│       │   └── IncidentDetail.tsx # `/incidents/:id` (verdict + reasoning)
│       └── components/
│           ├── FramingHeader.tsx    # A3 — exam/session/center/candidate counts
│           ├── CenterGrid.tsx       # AC-1
│           ├── CandidatePanel.tsx   # AC-3, AC-5 — question, answer, server-rendered clock
│           ├── LedgerPanel.tsx      # AC-4 — seq, hash, prev-hash, live append
│           ├── IncidentTimeline.tsx # AC-2
│           ├── VerdictCard.tsx      # AC-6 — rule + inputs + arithmetic + cost avoided
│           ├── SimulatorControls.tsx# red-bordered, "SIMULATOR CONTROLS" (A2/A6)
│           ├── SimulatedBadge.tsx   # AC-13 — reusable "simulated telemetry source" chip
│           └── ConnectionPill.tsx   # LIVE (ws) / POLLING (2s) / OFFLINE
│
├── docs/
│   ├── architecture.md          # copy of this doc for the submission kit [integration-agent]
│   └── diagram.txt / .svg       # §8 diagram                              [integration-agent]
├── demo/
│   ├── script.md                # [demo-director]
│   └── fallback-run.mp4         # merge M4, ≤1 MB constraint applies to submission copies
└── data/                        # gitignored. sentinel.db created at boot.
```

**Owner summary (the line builders are held to):**

- **frontend-builder owns:** `web/**` and nothing else. Reads `shared/types.ts`. Never edits
  `server/**`, never edits root `package.json`.
- **backend-builder owns:** `server/**` and nothing else. Reads `shared/types.ts`. Never edits
  `web/**`.
- **integration-agent owns:** root `package.json` / lockfile / `tsconfig.base.json` / `.env.example`
  / `.gitignore`, `shared/types.ts`, `web/vite.config.ts` **proxy block only**, `server/src/static.ts`,
  `docs/**`. Integration-agent is also the only agent allowed to change a file that both builders
  depend on — if a type must change mid-build, the builders request it, integration-agent edits it.
- **data-seeder** may edit only `server/scripts/seed.ts` and `server/src/sim/scenario.ts`.
- Anything not listed is unowned and must not be created.

Parallelism is safe because `server/**` and `web/**` are disjoint and both sides code against
`shared/types.ts`, which integration-agent must write **first**, before either builder starts.

---

## 4. Data model + migrations

Spec-a §5 tables, plus the minimum the amendments force. SQLite types are loose; we use INTEGER
epoch-milliseconds for every timestamp (never ISO strings, never SQLite `datetime()`), because the
clock is the risk (§11 R2).

```sql
-- 001_init.sql   (authoritative; do not edit after M1 ships — add 002_*.sql instead)

CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);

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
```

**Hash rule (single definition, `server/src/domain/chain.ts` — nowhere else):**

```
hash = sha256( prev_hash + "|" + center_id + "|" + seq + "|" + ts + "|" + kind + "|" + canonicalJson(payload) )
genesis: prev_hash = "0".repeat(64), seq = 0, one per center
```

`canonicalJson` = recursively sort object keys, no whitespace, no `undefined`. It must be
deterministic or AC-7 flakes. It is unit-tested first (`chain.test.ts`) before anything else is
built.

`verifyChain()` walks each center's chain in `seq` order, recomputes, and on first mismatch returns
`{ ok:false, brokenAt:{ centerId, rowId, seq, expectedHash, actualHash } }` — AC-8 requires the row
identity *and* both hashes.

**Verdict reasoning payload** (AC-6 / A4) is a fixed shape so the UI can render arithmetic generically:

```
{ policy_version: "v1",
  rule: "frozen_ms > FREEZE_THRESHOLD_MS AND checkpoints_lost == 0 → partial-extension",
  inputs: { affected_candidates: 3, max_frozen_ms: 47000, avg_frozen_ms: 44300,
            checkpoints_lost: 0, threshold_ms: 30000, exam_duration_ms: 3600000 },
  arithmetic: ["47000ms frozen > 30000ms threshold", "0 checkpoints lost", "→ PARTIAL EXTENSION +47s"],
  cost_avoided: { candidates_spared: 412, per_candidate_cost_inr: 850, total_inr: 350200,
                  basis: "illustrative per-candidate re-conduct cost; configurable policy input" } }
```
`basis` is mandatory: the cost figure is illustrative and must say so on screen (A6 honesty).

**Migrations approach:** forward-only plain `.sql` files in `server/src/db/migrations/`, applied in
filename order at boot inside one transaction each, recorded in `schema_migrations`. No down
migrations, no migration tool, no ORM. Because the demo DB is disposable, the supported reset is
`npm run reset` (delete `data/sentinel.db`, re-migrate, re-seed) — but **AC-12 requires in-process
reset too**: `POST /api/sim/reset` truncates all tables, re-seeds from the fixed scenario, re-seeds
the RNG, and rebroadcasts state, without restarting the server.

---

## 5. Session clock — the one invariant everyone must obey

`remainingMs(session, now)`:
```
elapsed  = (state === 'frozen' ? frozen_at : now) - exam_started_at
remaining = exam_duration_ms - (elapsed - frozen_ms_total)
```
On freeze: set `frozen_at = now`. On resume: `frozen_ms_total += now - frozen_at; frozen_at = null;
state='resumed'`. The server includes `remaining_ms` and `server_now` in every session payload. The
UI may tick a local display clock between pushes **only** by extrapolating from the last
`server_now`, and must snap to the server value on every message. The UI never owns the clock. This
is what makes AC-5 ("remaining time visibly increases at the moment of resume") deterministic.

---

## 6. Env vars (names only — no secrets exist in this project)

`.env` is optional; every var has a working default so `npm start` works with no `.env` at all.

| Name | Purpose |
|---|---|
| `PORT` | HTTP + WS port (default 8080) |
| `HOST` | Bind address (default 127.0.0.1) |
| `NODE_ENV` | `development` \| `production` (production enables static serving) |
| `SENTINEL_DB_PATH` | SQLite file path (default `./data/sentinel.db`) |
| `SIM_SEED` | Deterministic PRNG seed (default `20261009`) — AC-12 |
| `SIM_TICK_MS` | Telemetry tick interval (default 1000) |
| `SIM_CENTERS` | Number of centers (default 8; **floor 6** per cut-list item 6) |
| `SIM_SESSIONS_PER_CENTER` | Visible candidate sessions per center (default 3) |
| `EXAM_DURATION_S` | Simulated exam length (default 3600) |
| `VERDICT_FREEZE_THRESHOLD_S` | Partial-extension threshold (default 30) — A4 |
| `VERDICT_RECONDUCT_THRESHOLD_S` | Re-conduct threshold (default 600) |
| `VERDICT_COST_PER_CANDIDATE_INR` | Illustrative re-conduct cost input (default 850) |
| `ENABLE_SIM_CONTROLS` | Gates kill/reconnect/tamper routes (default `true`) — see §7 |

There are **no API keys, tokens, passwords or secrets in this system.** `.env.example` ships with
all names and defaults and is committed; `.env` is gitignored on principle even though it holds
nothing sensitive.

---

## 7. Auth approach

**No auth for demo.** Explicitly, per spec-a §2/§12 and research.md §2 ("out of scope by design —
do not build it; do not mock it either, just skip the screen"). There is no login screen, no user
table, no session cookie, no role check. The app binds to `127.0.0.1` by default and is presented on
one laptop.

What we do instead, because judges *will* ask:
- The destructive routes (`/api/sim/*`, including tamper) live under a single `/api/sim` prefix
  behind the `ENABLE_SIM_CONTROLS` flag, so "in production this prefix is not mounted and the
  operator console sits behind MPOnline SSO with an ops role" is a one-line, credible answer with
  code to point at.
- The tamper control is visually quarantined in a red **"SIMULATOR CONTROLS — not part of the
  production system"** panel (A2), and every simulated surface carries the `SimulatedBadge` chip
  (AC-13).

---

## 8. Runtime / tooling diagram

No LLM is used anywhere in this product (see §2). The diagram below is the data path; the dashed box
is the only simulated part, and it is the documented seam where a real agent plugs in (A5/A6).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ONE NODE PROCESS  (:8080)                                                  │
│                                                                             │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                                                │
│    SIMULATED SOURCE  (A6)    ← seeded PRNG, SIM_SEED, 1 tick/s               │
│  │ sim/simulator.ts        │                                                │
│    · heartbeat / latency                                                    │
│  │ · answer_save           │   ⇠⇠ THE SEAM: a real center agent would POST   │
│    · disconnect (kill)         the same telemetry_event shape here.          │
│  └ ─ ─ ─ ─ ─ ┬ ─ ─ ─ ─ ─ ─ ┘                                                │
│              │ telemetry events (real ingestion path from here on)          │
│              ▼                                                              │
│  ┌───────────────────────┐   rules/thresholds   ┌────────────────────────┐  │
│  │ domain/incidents.ts   │◀────────────────────▶│ domain/sessions.ts     │  │
│  │ detect · classify     │                      │ active→frozen→resumed  │  │
│  │ severity · escalate   │                      │ clock.ts (authoritative)│ │
│  └──────────┬────────────┘                      └───────────┬────────────┘  │
│             │                                               │ freeze/resume │
│             │                                               ▼               │
│             │                                  ┌────────────────────────┐   │
│             │                                  │ domain/chain.ts        │   │
│             │                                  │ sha256 append-only     │   │
│             │                                  │ chain PER CENTER (A5)  │   │
│             │                                  └───────────┬────────────┘   │
│             ▼                                              ▼               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ db/repo.ts  →  better-sqlite3  →  data/sentinel.db  (single file)     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│             │                        ▲                                      │
│             │                        └── scripts/tamper.ts & POST /api/sim/ │
│             │                            tamper  = RAW UPDATE, bypasses     │
│             │                            the append-only API on purpose (A2)│
│             ▼                                                               │
│  ┌───────────────────┐    ┌──────────────────┐    ┌──────────────────────┐ │
│  │ domain/verdict.ts │    │ Fastify routes   │    │ ws/hub.ts broadcast  │ │
│  │ rule+inputs+math  │    │ /api/*           │    │ center.updated ...   │ │
│  └───────────────────┘    └────────┬─────────┘    └──────────┬───────────┘ │
│                                    │                         │             │
│      @fastify/static → web/dist ───┤                         │             │
└────────────────────────────────────┼─────────────────────────┼─────────────┘
                                     │ HTTP (hydrate/drill-down)│ WS push <2s
                                     ▼                         ▼
                         ┌───────────────────────────────────────────────┐
                         │ React SPA — useLiveState()                    │
                         │  WS open? → live.  WS dead? → poll /api/state │
                         │  every 2s, silently. ConnectionPill shows it.  │
                         │  Renders only server-computed values.          │
                         └───────────────────────────────────────────────┘
```

**WS event union** (`shared/types.ts`, exhaustive switch on the client):
`center.updated | session.updated | incident.opened | incident.updated | checkpoint.appended |
verdict.computed | sim.reset | state.snapshot`.
Rule: **every WS event's payload is a subset of `/api/state`'s shape**, so the poll fallback and the
push path converge on identical reducer code.

---

## 9. Commands

Root `package.json` scripts (integration-agent writes these; they are the contract the demo runs on):

```bash
# install (the ONLY step that touches the network — AC-14 applies after this)
npm install

# local dev (two processes, HMR): API :8080 + Vite :5173 with proxy
npm run dev

# single-command run of the real thing (build UI, serve everything from :8080)
npm run build && npm start        #  → http://127.0.0.1:8080

# tests
npm test                # node:test via tsx across server/test/**
npm run test:chain      # AC-7/AC-8 only — fast loop for the ledger
npm run typecheck       # tsc --noEmit, both workspaces
npm run check:offline   # greps web/dist + src for external origins (AC-14 guard)

# demo utilities
npm run seed            # reset DB to the fixed scenario
npm run reset           # delete data/sentinel.db, migrate, seed  (hard reset)
npm run verify-chain    # CLI PASS/FAIL — cut-list item 8 fallback
npm run tamper          # CLI raw-UPDATE tamper — A2 second path

# optional M4 packaging (cut-list item 2)
docker compose up --build   # same thing, port 8080
```

**Deploy definition for this project:** deploy = `npm run build && npm start` producing a live
`http://127.0.0.1:8080` on the presenting laptop, with wifi off. There is no cloud target and none
is required (research.md §4: in-person team-station judging). If DEPLOY phase later demands a
shareable URL, the *only* sanctioned path is `cloudflared tunnel --url http://localhost:8080`
(no account) — and per CLAUDE.md, if that binary cannot be obtained, devops-deploy must record
**blocked**, not fake a URL. Note for the conductor: a localhost URL does not satisfy the
project-wide DEPLOY exit condition, so that decision has to be made explicitly, not by drift.

---

## 10. Milestone gating (A1) — what "done" means per milestone

Each milestone ends with `npm run build && npm start` working and its ACs passing. No milestone
starts before the previous one's ACs pass.

| M | Scope | Gating ACs | Server files | Web files |
|---|---|---|---|---|
| **M1 Checkpoint parity** | 1 center live, 3 candidates, kill/restore, ledger, verdict, CLI verify | AC-3, AC-4, AC-5, AC-6, AC-9, AC-10 | db/*, chain, clock, sessions, verdict, sim (1 center), routes state+sim, ws hub, verify-chain script | ControlTower, CandidatePanel, LedgerPanel, VerdictCard, SimulatorControls, useLiveState (poll-only is acceptable at M1) |
| **M2 Fleet** | 6–8 centers, risk scores, per-center kill, incident row + classification + severity + timeline | AC-1, AC-2, AC-12 | incidents.ts, risk scoring in simulator, /api/sim/reset | CenterGrid, IncidentTimeline, FramingHeader (A3) |
| **M3 Trust** | /audit verifier UI, PASS, in-app tamper, FAIL with broken link | AC-7, AC-8, AC-11, AC-13 | routes/audit.ts, verifyChain, /api/sim/tamper | Audit.tsx, SimulatedBadge everywhere |
| **M4 Depth** | drill-down routes, verdict reasoning breakdown, WS→poll degrade, Docker Compose | AC-14 + cut-list top items if time | — | CenterDetail, SessionDetail, Incidents, IncidentDetail, ConnectionPill |

AC-11 (<60s core loop) and AC-14 (no outbound requests) are re-verified at every milestone by
test-runner, not only at M3/M4.

---

## 11. Top 5 technical risks + mitigations

1. **Tamper demo depends on an absent `sqlite3` CLI (High).** Mitigation: A2 — tamper is
   `POST /api/sim/tamper` doing a raw `UPDATE checkpoints SET payload_json=? WHERE id=?` through
   `better-sqlite3`, plus `npm run tamper` as a terminal-visible second path. Architecturally this
   is *better*: it proves the API is append-only while the storage layer is not, which is exactly
   the threat model a tamper-evident ledger addresses. **Guard:** the ban on `sqlite3` CLI is in §2;
   test-runner greps the repo for it.
2. **Frozen-time bookkeeping drift; resumed clock off by seconds (Medium).** Mitigation: §5 — one
   `clock.ts`, server-authoritative, `remaining_ms` + `server_now` in every payload, UI snaps on
   every message and never counts independently. `clock.test.ts` asserts that after a 47s freeze,
   `remaining_ms` at resume equals `remaining_ms` at freeze ±50ms. AC-5 is verified on screen.
3. **WS drops mid-demo, dashboard goes stale and looks broken (Medium).** Mitigation: `useLiveState`
   treats WS as an *optimisation*: hydrate from `GET /api/state` on mount and on every reconnect,
   fall back to a 2s poll after one failed reconnect, and show `ConnectionPill`. Because WS payloads
   are subsets of `/api/state`, both paths feed one reducer, so the degraded mode is not a second
   code path that can rot. Full page reload mid-demo is survivable by design.
4. **Scope creep past M4 / the 12-sub-ask trap (Medium).** Mitigation: decision.md freeze rule + the
   owner map in §3 (unowned paths must not be created) + the AC-traceability rule in §0. Cut-list
   order is decision.md §8 and the architecture makes cuts cheap: each cut item is a whole file or
   route that can be deleted without touching another owner's code.
5. **`better-sqlite3` is a native module — install/ABI failure would be terminal (Medium/Low but
   fatal if it lands).** Mitigation: integration-agent installs and runs a one-line smoke check
   (`node -e "require('better-sqlite3')"`) as the *very first* build action, before either builder
   starts, and commits the lockfile. If prebuilt binaries for Node 22 fail, the documented fallback
   is `node:sqlite` (Node 22 built-in, same synchronous API shape) behind `db/connection.ts` — which
   is why *all* SQL lives in `repo.ts` behind that one module. No other file imports the driver.

Also carried from decision.md §6 (Low): six routes confusing a stranger — mitigated by AC-10 (`/`
is self-sufficient); "why not blockchain?" — answered verbatim in §1 bullet 5.

---

## 12. Scalability answer (A5 — prose + code comments, NOT features)

To be reproduced in the submission's Technology Architecture doc and as header comments in
`chain.ts`, `simulator.ts`, and `connection.ts`:

- **Ledger shards per center.** The chain is already keyed on `center_id` with a per-center `seq`,
  so verification is O(rows-in-one-center) and parallelises across centers on day one. Nothing
  about the demo topology assumes one global chain.
- **SQLite → Postgres is a `repo.ts` change.** Every statement is in one module; the domain layer
  takes plain objects. Same schema, add partitioning on `center_id`.
- **Simulator → real ingestion is a route swap.** `sim/simulator.ts` writes `telemetry_events`
  through the same function a real center agent's `POST /api/ingest/telemetry` would call. The seam
  is marked in code. Everything downstream of that write is production logic already.
- **Single process → workers + queue.** Detection is stateless per telemetry batch; the natural
  split is ingestion workers → durable queue → detection/verdict workers → WS fan-out via a pub/sub.
- Deliberately **not** demonstrated live (research.md §3): scale is a written-answer criterion worth
  10%, and faking load would cost build hours and credibility.

---

## 13. Dummy / mock strategy (the synthetic telemetry)

**Principle:** the *source* is simulated; everything downstream of the source is real. This is
stated on screen (AC-13), in the README, and in the pitch. It earns Technical Feasibility (15)
rather than costing it (research.md §3, A6).

- **Determinism (AC-12).** `sim/rng.ts` is a mulberry32 PRNG seeded from `SIM_SEED`. **`Math.random()`
  is banned repo-wide** — test-runner greps for it. Center names, candidate names, roll numbers,
  questions and the candidate answer sequence are *fixtures* in `sim/scenario.ts`, not generated.
  Given the same seed and the same operator actions, every rehearsal produces the same numbers.
- **Tick model.** One `setInterval(SIM_TICK_MS)`. Each tick, per center: emit `heartbeat`, emit a
  `latency` sample from a seeded distribution (healthy ~40–90ms, degraded ~200–900ms, down = no
  heartbeat), and occasionally emit `answer_save` for one session, which appends a real checkpoint
  to the real chain. Risk score is a pure function of the last N ticks' signals — a documented
  threshold rule, never called "AI".
- **Kill switch.** `POST /api/sim/kill/:centerId` sets the simulated center to `down`: heartbeats
  stop and answer-saves fail. Detection then runs for real (missed-heartbeat threshold) and opens
  the incident — we do **not** short-circuit by creating the incident inside the kill handler. That
  distinction is the demo's honesty and should be said out loud on stage.
- **Reconnect.** `POST /api/sim/reconnect/:centerId` restores heartbeats; recovery logic resumes
  sessions, restores time, appends `resume` checkpoints, closes the incident, computes the verdict.
- **Reset (AC-12).** `POST /api/sim/reset` truncates, re-seeds fixtures, re-seeds the PRNG,
  broadcasts `sim.reset`. No server restart. Rehearse as many times as we like.
- **Tamper (A2).** `POST /api/sim/tamper` mutates one checkpoint row's `payload_json` directly,
  returning which row it touched, so the verifier's answer can be checked against ground truth.
- **Candidate UI is a stand-in.** A mock question + answer box + clock, labeled "illustrative
  candidate view — production integrates MPOnline's existing assessment front end."
- **No fake data anywhere else.** Verdict numbers are computed from real rows. Checkpoint hashes are
  real SHA-256. Chain verification really recomputes. The only illustrative constant is
  `VERDICT_COST_PER_CANDIDATE_INR`, and its `basis` string says so on screen.
- **`npm run seed`** produces the scenario at t=0: centers healthy, sessions `active`, one genesis
  checkpoint per center, zero incidents. The demo always starts from that state.

---

## 14. Handover to planner

- Build order is fixed by A1: M1 → M2 → M3 → M4, each demoable.
- **Sequencing constraint:** integration-agent must land the skeleton (root workspace config,
  `shared/types.ts`, `db/connection.ts` + `001_init.sql`, `better-sqlite3` smoke check) **before**
  backend-builder and frontend-builder fork. After that, `server/**` ∥ `web/**` is safe for the rest
  of the build.
- First code written should be `chain.ts` + `chain.test.ts` (canonical JSON determinism), because
  AC-7/AC-8 fail silently and late if that is wrong.
- Cut list (decision.md §8) maps cleanly onto deletable files — planner should schedule M4 items
  last and in cut-list reverse order.
