# QA log

## data-seeder

Phase BUILD, data-seeder pass, run after backend-builder's M1 backend landed. Owned files only
(architecture.md §3): `server/scripts/seed.ts`, `server/src/sim/scenario.ts`. Read but did not edit
`architecture.md`, `shared/types.ts`, `server/src/repo.ts`, `server/src/domain/*.ts`,
`server/src/sim/simulator.ts`, `server/src/config.ts`, `server/src/sim/rng.ts`, brand.md.

### What changed
- `server/src/sim/scenario.ts`: added `BACKSTORY_CENTER_INDEX` export (center C4 by default,
  "Indore - Rajwada") documenting which center hosts the pre-seeded incident, kept away from index 0
  so the operator's live kill-switch demo still has a pristine first center. No changes to the
  existing center/candidate/question fixtures — they already used real MP district/city names
  (Bhopal, Indore, Gwalior, Jabalpur, Ujjain, Sagar) and a realistic Indian candidate-name pool with
  `MPO2026-####`-style roll numbers, matching brand.md's "Sentinel" / MPOnline framing.
- `server/scripts/seed.ts`: rewrote to make the golden path look alive from t=0 instead of an empty
  dashboard:
  1. Exam `examStartedAt` is set 22 minutes before seed time (not `Date.now()`), so sessions open
     mid-exam with a partially-consumed clock, not a suspicious fresh boot.
  2. Every session gets 2-4 real `answer_save` checkpoints (deterministic `mulberry32(SIM_SEED)` PRNG
     from `sim/rng.ts` — no `Math.random()`, per architecture.md §13/decision #5) so the ledger and
     candidate panels show real progress, not just genesis rows.
  3. One pre-resolved "backstory" incident is seeded at `BACKSTORY_CENTER_INDEX`'s center using the
     *same* domain functions the live simulator uses (`repo.freezeSessionsAtCenter`,
     `resumeSessionsAtCenter`, `openIncident`, `closeIncident`, `domain/verdict.computeVerdict`,
     `insertVerdict`) — a 47s simulated outage, 3 affected sessions, real hash-chained freeze/resume
     checkpoints, real computed `partial-extension` verdict with cost-avoided arithmetic. Every other
     center is left `healthy`/untouched so the operator can still run the live
     kill -> incident -> reconnect -> recovery -> verdict arc via `SimulatorControls` for the demo.
  No routes/ws/domain files were touched — only the two owned files, calling already-public `Repo`
  methods and already-public domain functions.

### Commands run (against a real local SQLite file, not the dev DB)

```bash
$ npm run build --workspace server
# → tsc -p tsconfig.json && copy-migrations → PASS, no errors

$ rm -f data/sentinel_seedtest.db
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run seed --workspace server
# → Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, and one resolved backstory incident
#   at Indore - Rajwada (INC-0001 -> partial-extension, 3 sessions affected).

$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run verify-chain --workspace server
# → PASS — chain integrity verified across all centers.

# Idempotency: re-ran seed against the same file, then re-verified.
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run seed --workspace server
# → Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, one resolved backstory incident
#   (same shape, new timestamps — truncateAll() runs first, so no duplication/drift).
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run verify-chain --workspace server
# → PASS — chain integrity verified across all centers.

# Direct DB inspection (better-sqlite3, read-only) to confirm realistic data landed:
$ node -e "... SELECT id,name,status,candidate_cnt FROM centers ..."
# → 8 centers: C1 Bhopal - Arera Colony, C2 Bhopal - MP Nagar, C3 Indore - Vijay Nagar,
#   C4 Indore - Rajwada, C5 Gwalior - City Centre, C6 Jabalpur - Napier Town, C7 Ujjain - Freeganj,
#   C8 Sagar - Civil Lines — all status 'healthy', candidate_cnt 3 each.
$ node -e "... SELECT id,center_id,candidate_name,roll_no,state,frozen_ms_total FROM candidate_sessions LIMIT 8 ..."
# → e.g. S-C1-01 / Aarav Sharma / MPO2026-0001 / active; S-C2-02 / Vivaan Joshi / MPO2026-0005 / active
$ node -e "... SELECT * FROM incidents ..."
# → INC-0001, center C4, opened/closed 47s apart, classification 'Connectivity Loss',
#   severity 'medium', status 'resolved', affected_count 3
$ node -e "... SELECT reasoning_json FROM verdicts ..."
# → decision partial-extension; inputs {affected_candidates:3, max_frozen_ms:47000,
#   avg_frozen_ms:47000, checkpoints_lost:0, threshold_ms:30000, exam_duration_ms:3600000};
#   arithmetic ["47000ms frozen > 30000ms threshold", "0 checkpoints lost",
#   "-> PARTIAL EXTENSION +47s"]; cost_avoided.basis states the INR figure is illustrative (A6).
$ node -e "... SELECT kind, COUNT(*) FROM checkpoints GROUP BY kind ..."
# → answer_save 70, freeze 3, genesis 24, resume 3  (100 total, all real SHA-256 chain entries)
```

### Result
- `npm run build --workspace server`: PASS
- Seed against a real local SQLite file (`SENTINEL_DB_PATH` override, not the tracked `data/sentinel.db`): PASS
- `npm run verify-chain --workspace server`: PASS, both on first seed and after a re-seed (idempotent)
- Direct SQL inspection confirms: realistic MP center names, realistic Indian candidate names + roll
  numbers, one resolved incident with a real computed verdict populated before any operator action,
  100 real hash-chained checkpoints, 7 of 8 centers left pristine for the live kill-switch demo arc.
- No auth exists in this system (architecture.md §7 — "No auth for demo", explicit hard-ban on
  auth/login/roles). No "judge user" was created; nothing to document in deploy.md for credentials.
- Test artifacts (`server/data/sentinel_seedtest.db*`) were removed after verification; `server/data/`
  and root `data/` are gitignored per architecture.md, so no DB files are tracked in git.

## frontend M1

Phase BUILD, M1 "Checkpoint parity" frontend, run by frontend-builder. Built against
`shared/types.ts` as source of truth; `server/**` had no routes/index.ts/ws yet at build time
(only db/connection.ts, migrate.ts, 001_init.sql existed), so the app was verified against a dead
backend — no mocks were added, since the API/WS routes are named by architecture.md §3 and the app
must degrade honestly (ConnectionPill OFFLINE) rather than fake data.

### Files added (web/src/** only)
- `styles/tokens.css`, `styles/app.css` — brand.md forest-green accent + neutrals, 8px grid,
  AA-checked status colors (amber darkened per design.md §6), focus rings, no web fonts.
- `router.tsx` — minimal hand-rolled pushState router (no new dependency; only "/" and "/audit"
  are wired for M1 per design.md §1).
- `lib/api.ts` — typed fetch wrappers for GET /api/state, POST /api/sim/kill|reconnect|reset,
  POST /api/audit/verify, POST /api/sim/tamper, GET /api/verdicts/:id.
- `lib/useLiveState.ts` — WS client (`/ws`) with auto-degrade to 2s polling of GET /api/state after
  a 3s connect timeout or a close/error event; single reducer shared by both the WS event path and
  the poll/snapshot path, per architecture.md §8/§11 risk 3.
- `lib/clock.ts` — display-only duration formatter; the client never computes the exam clock
  (architecture.md §5), it only extrapolates the *display* and snaps to server `remainingMs` /
  `serverNow` on every push.
- `components/`: FramingHeader, ConnectionPill, CenterGrid (+ skeleton), CandidatePanel,
  LedgerPanel, VerdictCard (+ skeleton), SimulatorControls, SimulatedBadge — all copy pulled
  verbatim from `copy.md` (no inline copy authoring; the handful of structural labels not covered
  by copy.md, e.g. table column-adjacent field labels like "Question N", are plain factual UI
  labels, not narrative copy).
- `routes/ControlTower.tsx` (`/`) — self-sufficient for the whole kill→freeze→checkpoint→
  reconnect→resume→verdict arc (AC-10): auto-selects the first center on hydrate, escalation
  banner, SimulatorControls, VerdictCard, CandidatePanel + LedgerPanel scoped to the selected
  center. Loading = skeleton cards (no shimmer). Empty (zero centers) = the copy.md seed message.
  Error/WS-drop = ConnectionPill flips to POLLING/OFFLINE silently, Retry link after 3s offline.
- `routes/Audit.tsx` (`/audit`) — Verify Chain Integrity button (large, top, no-scroll), neutral/
  verifying/PASS/FAIL/error banner exactly per copy.md wording, quarantined red Tamper (simulator)
  control, full chain table with the broken row highlighted on FAIL.
- `App.tsx` — renders ControlTower or Audit based on pathname; unknown paths fall back to `/` since
  M1's route surface is fixed to these two.
- `main.tsx` — now renders `<App />` (replaced the scaffold placeholder), imports the two stylesheets.

### Commands run

```bash
$ npm run typecheck --workspace web
# → tsc -p tsconfig.json --noEmit  → clean, no errors

$ npm run build --workspace web
# → tsc --noEmit && vite build
# → dist/index.html (0.43 kB), dist/assets/index-*.css (9.97 kB, gzip 2.32 kB),
#   dist/assets/index-*.js (247.05 kB, gzip 76.08 kB)
# → built in 1.34s

$ npm run check:offline --workspace web
# → check:offline PASS — no external origins in web/dist

# Manual dev-server smoke (no backend running on :8080):
$ npx vite --port 5183 &
$ curl -s http://127.0.0.1:5183/                 # → 200, index.html served, no server-side crash
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5183/api/state
# → 500 (proxy target :8080 not listening — expected, no backend yet)
```

### Result

- `npm run typecheck` (web): PASS
- `npm run build` (web): PASS
- `npm run check:offline` (web): PASS
- `vite` dev server: starts and serves `index.html` without crashing. Could not run a full headless
  browser render check in this environment (no puppeteer/playwright/jsdom installed and none named
  in architecture.md as a dependency to add). By code inspection: `useLiveState`'s initial
  `getState()` call and its WS-connect-timeout/error/close handlers all route failures through
  `ApiError` → `catch` blocks that set `connection: "offline"` and `error`, never throw during
  render — so with the backend absent (confirmed via the `/api/state` 500 above), the expected
  behavior is `ConnectionPill` = OFFLINE with the seed-message/empty state, not a blank screen or an
  uncaught exception. Recommend integration-agent or test-runner re-verify with a real browser once
  `server/src/index.ts` exists and again with it stopped, to close this gap with an actual rendered
  screenshot.
- Not implemented in this pass (out of M1 scope, deferred to later milestones per architecture.md
  §10 gating table): CenterGrid multi-center fleet view (M1 renders whatever `centers[]` the backend
  returns — no hardcoded count), IncidentTimeline component, `/center/:id`, `/session/:id`,
  `/incidents`, `/incidents/:id` drill-down routes, ConnectionPill's M4-listed polish. `Reset Demo`
  button is wired to `POST /api/sim/reset` even though AC-12 is formally an M2 gating AC, since
  `SimulatorControls`' component inventory (design.md §4) includes it for M1 and it costs nothing to
  wire against the same route the M1 backend must already expose for rehearsal resets.


## integration - scaffold

Phase 0 SCAFFOLD (plan.md T00–T05), run by integration-agent. Environment: Node v22.22.2,
npm 10.9.7, Linux.

### Commands run

```bash
$ npm install
# → added 197 packages, and audited 200 packages in 17s
# → 1 high severity vulnerability (transitive, not addressed — pre-existing advisory noise,
#   not a runtime dependency added by this task; left for security-linter at HARDEN)

$ node -e "console.log(require('better-sqlite3'))"
# → [Function: Database] { SqliteError: [Function: SqliteError] }
# native module loads successfully — no ABI/prebuild failure in this environment.
# (architecture.md §11 risk 5 — node:sqlite fallback plan documented as a comment in
#  server/src/db/connection.ts, NOT implemented, since the primary driver works here.)

# End-to-end smoke: open/create the DB via connection.ts, run migrate.ts, confirm schema.
$ npx tsx <scratchpad>/smoke.mts
# → migrations applied this run: [ '001_init.sql' ]
# → tables: [ 'candidate_sessions', 'centers', 'checkpoints', 'incidents',
#             'schema_migrations', 'sqlite_sequence', 'telemetry_events', 'verdicts' ]
# → SMOKE OK
# (temporary sentinel.db removed afterward; data/ stays empty/gitignored until data-seeder runs)

$ npm run typecheck
# → server@0.1.0 typecheck: tsc -p tsconfig.json --noEmit   → clean, no errors
# → web@0.1.0 typecheck: tsc -p tsconfig.json --noEmit      → clean, no errors

$ npm run build
# → web: tsc --noEmit && vite build → dist/index.html + dist/assets/index-*.js (224 kB, gzip 70 kB)
# → server: tsc -p tsconfig.json → dist/server/src/**, dist/shared/**
#   (rootDir is auto-inferred to the monorepo root because server/tsconfig.json includes
#    ../shared/types.ts for cross-workspace typechecking with no build step for shared/;
#    this means the compiled entrypoint lands at dist/server/src/index.js, not dist/index.js —
#    server/package.json's "start" script is set accordingly:
#    "start": "node dist/server/src/index.js". backend-builder: keep this in mind, or adjust
#    tsconfig later if you want a flatter dist/ layout.)

$ npm run check:offline
# → FAIL on first run: matched http://www.w3.org/... (SVG/XML namespace constants, not network
#   calls) and https://react.dev/errors/... (doc link embedded in a minified React error string).
#   Both are compile-time constants baked into React/DOM internals, never fetched at runtime.
#   Fixed by whitelisting those two known-safe patterns in web/scripts/check-offline.mjs.
# → re-run: PASS — no external origins in web/dist
```

### Result

- npm install: PASS
- better-sqlite3 native module smoke check: PASS (loads directly; also proven via a full
  connection.ts → migrate.ts → schema smoke run)
- npm run typecheck (both workspaces): PASS
- npm run build (both workspaces): PASS
- npm run check:offline: PASS (after whitelisting two false-positive constant strings)
- npm start: NOT YET RUNNABLE — `server/src/index.ts` (boot: migrate → seed → Fastify → ws →
  simulator.start) is backend-builder's file, not created in this scaffold pass by design (task
  scope: "Do NOT implement backend routes, business logic, or frontend UI").

### Scope note

This pass touched only integration-agent-owned paths per architecture.md §3: root `package.json` /
`tsconfig.base.json` / `.env.example` / `.gitignore`, `shared/types.ts`, `server/src/db/connection.ts`
+ `db/migrate.ts` + `db/migrations/001_init.sql`, `web/vite.config.ts` (+ minimal `web/package.json`,
`web/tsconfig.json`, `web/index.html`, `web/src/main.tsx` placeholder, `web/scripts/check-offline.mjs`
as scaffold necessities), `docs/architecture.md` (copy), `README.md` stub. No backend routes,
domain logic, or real UI were implemented — that is backend-builder's and frontend-builder's next
work, per plan.md's fork point after T05.
