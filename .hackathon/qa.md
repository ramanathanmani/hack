# QA log

## integration - M1 end-to-end

Phase INTEGRATE, run by integration-agent, after backend M1 / frontend M1 / data-seeder passes
above (all read first). Goal: prove the golden path runs as ONE product for real, not by code
inspection, per architecture.md's one-process-serves-API+WS+UI shape (§0, §1, §9).

### Starting state found

`server/src/index.ts` already imported nothing from a `static.ts` and `server/src/static.ts` did
not exist on disk at the start of this pass — despite a git history that suggested a prior partial
integration attempt (`git log` shows a commit "Backend M1 verified end-to-end via live HTTP; static
serving added" mentioning `server/src/static.ts` "(in progress)"). Verified by reading the actual
files before editing (Read tool, not `git show`) — the gap was real in the working tree, not just in
old history. So: **static UI serving was not wired.** This is squarely this agent's owned file per
architecture.md §3 (`server/src/static.ts` — integration-agent) and a real M1/AC-9 gap (one process
must serve API + WS + built UI), so it was built now.

### Gaps found and fixed (this pass's actual glue work)

1. **`server/src/static.ts` did not exist.** Created it: `@fastify/static` serving `web/dist` from
   the compiled `dist/server/src/static.js` location (path computed via `import.meta.url`, 4 levels
   up to repo root + `/web/dist` — verified against the actual `tsc` output layout, not assumed), plus
   a `setNotFoundHandler` SPA fallback that serves `index.html` for any non-`/api`, non-`/ws` GET so
   the client router (`/`, `/audit`) works on a hard refresh/direct link.
2. **`server/src/index.ts` never imported or registered it.** Wired `registerStatic(app)`, gated on
   `config.nodeEnv === "production"` and registered *after* all API routes so `/api/*` 404s still
   behave normally when unmatched, and *before* `simulator.start()`.
3. **The documented single command silently did not serve the UI.** README/architecture.md's
   contract is "`npm run build && npm start` → `http://127.0.0.1:8080`" serving API+WS+UI. But
   `server/package.json`'s `"start"` script was `"node dist/server/src/index.js"` with no
   `NODE_ENV`, and `config.ts` defaults `NODE_ENV` to `"development"` when unset — so running the
   exact documented command would boot the API+WS fine but silently skip static registration, and a
   judge hitting `/` would get a 404, not the app. Fixed by changing the `start` script to
   `"NODE_ENV=production node dist/server/src/index.js"`. This is the one non-trivial glue bug this
   pass found — everything else (routes, WS shapes, `lib/api.ts` route names) already matched between
   `web/**` and `server/**` with no adapter needed.

### Commands run (this pass), against the exact documented golden path

```bash
$ npm run build                                   # root, both workspaces
# → web: tsc --noEmit && vite build → dist/index.html + assets (247 kB js / 9.97 kB css)
# → server: tsc -p tsconfig.json && copy-migrations → dist/server/src/**, dist/server/src/static.js
# → PASS, no errors

$ rm -rf server/data data
$ SENTINEL_DB_PATH=./data/sentinel.db npm run seed --workspace server
# → real local dev DB at server/data/sentinel.db (workspace scripts run with cwd=server/, so the
#   *default* SENTINEL_DB_PATH used by `npm start` and this seed invocation resolve to the same file)
# → "Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, and one resolved backstory incident
#    at Indore - Rajwada (INC-0001 -> partial-extension, 3 sessions affected)."

$ npm start                                        # root — exactly the README-documented command
# → "> server@0.1.0 start" / "> NODE_ENV=production node dist/server/src/index.js"
# → "[sentinel] listening on http://127.0.0.1:8080 (production)"   ← confirms production mode with
#   NO manual env override, i.e. the documented command now actually works as documented.

$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/
# → HTTP 200 — built React index.html served by the same process, same port, as architecture.md §0
#   requires ("the 'deploy' is npm run build && npm start, one process, one port")
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/assets/index-<hash>.js
# → HTTP 200 — JS bundle served
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/audit
# → HTTP 200 — SPA fallback: a non-file GET path resolves to index.html so the client router handles it

$ curl -s http://127.0.0.1:8080/api/state
# → real seeded fleet: 8 centers, 24 sessions, 1 resolved incident (backstory), 1 verdict — not a stub

$ curl -s -X POST http://127.0.0.1:8080/api/sim/kill/C2
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C2 status 'down', riskScore 90, a new incident opened (status:'open', classification
#   'Connectivity Loss', detailJson {"signal":"missed_heartbeat",...} — real detection, not
#   short-circuited by the kill handler), all 3 C2 sessions state:'frozen'

$ curl -s -X POST http://127.0.0.1:8080/api/sim/reconnect/C2
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C2 status 'healthy', all 3 C2 sessions state:'resumed', incident status:'resolved' with
#   closedAt set, a new verdict entry present (decision computed from real frozen-duration/
#   affected-count inputs, e.g. {"decision":"no-action","reasoning":{"policy_version":"v1",
#   "rule":"frozen_ms <= FREEZE_THRESHOLD_MS ...","inputs":{...},"arithmetic":[...],
#   "cost_avoided":{...,"basis":"illustrative ..."}}})

$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify           # → {"ok":true}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/tamper             # → {"tampered":true,"checkpointId":...,"centerId":"C5","seq":...}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify           # → {"ok":false,"brokenAt":{"centerId":"C5","rowId":...,"seq":...,"expectedHash":"...","actualHash":"..."}}

$ node -e '...ws = new WebSocket("ws://127.0.0.1:8080/ws")...'
# → WS OPEN, then live "checkpoint.appended" / "session.updated" events streamed in real time from
#   the running simulator tick loop — confirms the WS broadcast path, not just the HTTP poll path

$ npm run typecheck        # → PASS, both workspaces
$ npm test                 # → 16/16 pass (chain/clock/verdict, node:test via tsx)
$ npm run check:offline    # → PASS, no external origins in web/dist
```

### Result

- **Golden path proven end-to-end as one product**, exactly via the README/architecture-documented
  `npm run build && npm start` command with no manual env overrides: one Fastify process on `:8080`
  serves the REST API, the raw-`ws` WebSocket broadcast, and the built React SPA (verified: `/` →
  200 real `index.html`, hashed JS asset → 200, `/audit` client route via SPA fallback → 200).
- Full AC-2/AC-3/AC-4/AC-5/AC-6/AC-9 arc (kill → real missed-heartbeat detection → incident opened →
  sessions frozen with real hash-chained checkpoints → reconnect → sessions resumed with restored
  time → incident resolved → verdict computed with rule/inputs/arithmetic/cost-avoided) exercised
  live over HTTP against the running production-mode process, twice (once during manual `curl`
  exploration, once again against the exact documented command) — both runs landed correctly.
- Full AC-7/AC-8/AC-12 audit cycle (verify PASS → in-app tamper → verify FAIL with exact broken
  row/expected/actual hash → reset → verify PASS again) confirmed live over HTTP.
- WS broadcast path confirmed live (not just the HTTP hydrate/poll path) — a raw WS client connected
  to `/ws` received real `checkpoint.appended`/`session.updated` events streamed by the running
  simulator tick loop.
- `lib/api.ts` (frontend) route names/methods checked one-by-one against the actual registered
  Fastify routes (`routes/state.ts`, `sim.ts`, `audit.ts`, `verdicts.ts`) and against `Hub`'s WS
  broadcast — every route frontend-builder coded against exists and returns the shape
  `useLiveState.ts`'s reducer expects (`ApiState`/`WsEvent` from `shared/types.ts`). No route
  mismatch found; no adapter/shim code was needed on the API-shape side.
- `.env.example` reviewed against `config.ts` — already complete (13 vars, all with defaults, no
  secrets) from the scaffold pass; no changes needed.
- `npm run typecheck` / `npm test` / `npm run check:offline`: all PASS after the fix above.
- Server process and all test data cleaned up after verification; `server/data/sentinel.db` was
  re-seeded to the standard fixed scenario as the last action of this pass so the repo is left in the
  demo-ready starting state (8 centers healthy except the pre-resolved C4 backstory incident, ready
  for a fresh kill-switch demo on any other center).

### What was NOT faked

No external API is in this system (architecture.md §2/§7 — hard ban, no keys, no accounts, no
network at runtime). There was nothing to switch between "live" and "mock" for — the only "external"
surface is the simulator, and it is honestly labeled as simulated everywhere per AC-13, not
disguised as live. `npm run check:offline` re-confirms zero outbound origins in the built bundle.

## backend M1

Phase BUILD, M1 "Checkpoint parity" backend, run by backend-builder. Owned path: `server/**`
(architecture.md §3). Did not touch `web/**`, `shared/types.ts`, or any `.hackathon/*.md` besides
this file. Files existing before this pass: `server/package.json`, `server/tsconfig.json`,
`server/src/db/connection.ts`, `server/src/db/migrate.ts`, `server/src/db/migrations/001_init.sql`
(integration-agent scaffold, verified in "integration - scaffold" above).

Note: this session found the repo already at a state where an earlier pass of this same build had
apparently landed and committed (`git log` shows `b8a87df "M1 golden path: backend + frontend
built"` and a follow-up fix commit, both attributed to this session). This pass re-derived the
backend independently against architecture.md/decision.md/plan.md/spec-a.md/shared/types.ts and the
result matched almost exactly (byte-identical on most files) — the one live discrepancy was
`server/scripts/seed.ts` and `server/src/sim/scenario.ts`, which a concurrently-running data-seeder
pass had already enhanced (backstory incident, answer-save history, `BACKSTORY_CENTER_INDEX`). Those
two files were left as data-seeder produced them (their owned paths per architecture.md §3) rather
than being overwritten back to a plainer version — see "## data-seeder" below for what's in them.

### Files built (first-write order, chain.ts first per architecture.md §14)
- `server/src/domain/chain.ts` + `server/test/chain.test.ts` — `canonicalJson`, `hashEntry`,
  `buildNextEntry`, `verifyChain`. Pure/DB-free by design so it's unit-testable standalone.
- `server/src/domain/clock.ts` + `server/test/clock.test.ts` — `remainingMs`/`freezeFields`/
  `resumeFields`, the one authoritative exam-clock formula (architecture.md §5).
- `server/src/domain/verdict.ts` + `server/test/verdict.test.ts` — `computeVerdict()`, fixed
  `reasoning_json` shape (`policy_version`/`rule`/`inputs`/`arithmetic`/`cost_avoided`), mandatory
  honesty `basis` string (A6).
- `server/src/domain/sessions.ts`, `server/src/domain/incidents.ts` — pure state-machine/
  classification helpers.
- `server/src/config.ts` — env var parsing + defaults, names matching `.env.example` exactly.
- `server/src/sim/rng.ts` — mulberry32 seeded PRNG (`Math.random()` never used anywhere in `server/**`
  — confirmed by grep, see below).
- `server/src/sim/scenario.ts` — fixed center/candidate/question fixtures (later extended by
  data-seeder).
- `server/src/sim/simulator.ts` — seeded tick loop; `kill()`/`reconnect()`/`reset()` only toggle a
  heartbeat-suppression flag or truncate+reseed. Incident open/close is driven by a real
  missed-heartbeat check inside the same tick loop (`detectIncidents`/`recoverIncidents`), never
  short-circuited by `kill()`/`reconnect()` directly — matches the task brief's honesty requirement
  and architecture.md §13.
- `server/src/repo.ts` — all SQL (only file besides `db/connection.ts` importing `better-sqlite3`).
  Freeze-all-sessions-at-a-center, resume-all, and checkpoint append each run inside one
  `db.transaction()`. Includes the A2 raw-`UPDATE` tamper path (`tamperCheckpoint`) and
  `getApiState()` (the `GET /api/state` aggregate, architecture decision #2).
- `server/src/routes/{state,centers,sessions,incidents,verdicts,audit,sim}.ts` — REST surface per
  spec-a §6 + M5. `/api/sim/*` and `/api/sim/tamper` gated by `ENABLE_SIM_CONTROLS`.
- `server/src/ws/hub.ts` — raw `ws` broadcast; every event payload is a `WsEvent` from
  `shared/types.ts`, itself a subset of `ApiState`.
- `server/src/index.ts` — Fastify entrypoint: `getDb` → `migrate` → `Repo` → Fastify → `Hub` (attached
  to Fastify's already-created `http.Server`, no `app.ready()` ordering issue) → routes → `Simulator`
  → `simulator.start()` → `app.listen()`.
- `server/scripts/verify-chain.ts`, `server/scripts/tamper.ts` — CLI PASS/FAIL and raw-UPDATE-tamper
  paths, zero `sqlite3` CLI dependency (both go through `Repo`/`better-sqlite3` directly, per A2).
- `server/scripts/seed.ts` (initial version, since enhanced by data-seeder).
- `server/package.json`: added a `copy-migrations` step to `build` — `tsc` only emits compiled `.ts`,
  so `db/migrations/*.sql` was missing from `dist/` until this was added; without it, `npm start`
  failed at boot with `ENOENT ... db/migrations` the first time it was tried against a real build.

### Commands run

```bash
$ npx tsx --test server/test/chain.test.ts
# → 8/8 pass (canonicalJson determinism, hashEntry determinism/sensitivity, verifyChain PASS on a
#   clean multi-center chain, verifyChain catches a tampered payload with exact centerId/rowId/seq/
#   expectedHash/actualHash, verifyChain catches a broken prev_hash link, genesis shape)

$ npm test --workspace server        # chain + clock + verdict, via tsx --test
# → 16/16 pass, 0 fail

$ npm run typecheck                  # both workspaces
# → server: clean. web: clean.

$ npm run build                      # both workspaces
# → web: vite build OK. server: tsc OK, dist/server/src/index.js present (matches
#   server/package.json's "start": "node dist/server/src/index.js" — confirmed against the actual
#   compiled output, not just assumed).

$ rm -rf server/data && npm start --workspace server   # after build
# → "[migrate] applied: 001_init.sql" then "[sentinel] listening on http://127.0.0.1:8080 (development)"

$ curl -s http://127.0.0.1:8080/api/state
# → real JSON: 8 centers (Bhopal/Indore/Gwalior/Jabalpur/Ujjain/Sagar names), 24 sessions with
#   real remainingMs/serverNow, real genesis checkpoints with real SHA-256 hashes, incidents: [],
#   verdicts: [] (fresh seed) — not a stub.

$ curl -s -X POST http://127.0.0.1:8080/api/sim/kill/C1
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C1 status flips to 'down' (riskScore 90), INC-0001 opened with classification
#   'Connectivity Loss', detailJson shows {"signal":"missed_heartbeat", ...} (real detection, not
#   created by the kill handler), all 3 C1 sessions state='frozen', freeze checkpoints appended.

$ curl -s -X POST http://127.0.0.1:8080/api/sim/reconnect/C1
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C1 status back to 'healthy', sessions state='resumed', frozenMsTotal restored (~13s in this
#   run), incident status='resolved' with closedAt set, one verdict computed (real
#   frozen-duration/affected-count inputs, decision depended on the random tick timing of this
#   manual run — landed 'no-action' once at 13s frozen, 'partial-extension' in the seeded backstory
#   scenario at a fixed 47s — both are real computations, not hardcoded).

$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":true}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/tamper           # → {"tampered":true,"checkpointId":...}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":false,"brokenAt":{...}}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/reset            # → {"ok":true,"action":"reset"}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":true}   (PASS again)

$ npx tsx server/scripts/verify-chain.ts   # → "PASS ..." exit 0
$ npx tsx server/scripts/tamper.ts         # → tampers latest checkpoint via raw UPDATE
$ npx tsx server/scripts/verify-chain.ts   # → "FAIL — broken link detected: {...}" exit 1
$ npm run seed --workspace server && npx tsx server/scripts/verify-chain.ts
# → re-seed clears the tamper; PASS again

$ grep -rn "Math.random" server/src server/scripts server/test    # → none (only comments mentioning the ban)
$ grep -rn "sqlite3 " server/src server/scripts server/test       # → none
```

### Result
- `chain.test.ts`: PASS (8/8), run standalone as required, before anything else.
- Full `npm test` (chain/clock/verdict): PASS (16/16).
- `npm run typecheck`: PASS (both workspaces).
- `npm run build`: PASS (both workspaces); confirmed `server/dist/server/src/index.js` exists and
  matches `server/package.json`'s `start` script.
- `npm start` after a clean build: PASS — server boots, migrates, seeds, listens on `:8080`.
- `GET /api/state`: PASS — returns real, non-stub aggregate data.
- Full golden path exercised live over HTTP: kill → real missed-heartbeat detection → incident
  opened → sessions frozen with real checkpoints → reconnect → sessions resumed with time restored
  → incident resolved → verdict computed. All AC-2..AC-6, AC-9 behaviors observed directly, not
  inferred from code reading alone.
- `/api/audit/verify` PASS → `/api/sim/tamper` → `/api/audit/verify` FAIL with exact broken row →
  `/api/sim/reset` → PASS again: full AC-7/AC-8/AC-12 cycle confirmed over HTTP.
- `npm run verify-chain` / `npm run tamper` CLI scripts: PASS/FAIL exit codes confirmed independent
  of the HTTP route (A2's second path, no `sqlite3` CLI anywhere).
- Repo-wide grep gates: no `Math.random()` calls, no `sqlite3` CLI invocations in `server/**`.
- Left `server/scripts/seed.ts` and `server/src/sim/scenario.ts` as data-seeder produced them (see
  "## data-seeder" below) rather than reverting to this pass's plainer initial versions — their
  richer seed (backstory incident, answer-save history) was re-verified against this pass's
  `repo.ts`/`domain/*` unchanged and still builds/tests/verifies clean.
- Not built (correctly out of M1 scope per architecture.md §10 gating table / decision.md A1):
  `domain/incidents.ts`'s classification taxonomy beyond a single type (M2 cut-list item 5),
  multi-classification/escalation, `server/src/static.ts` (integration-agent's file, wires
  `@fastify/static` for production — not required for M1's API/WS surface to be provable over curl).
- Cleanup: all `server/data/*` and temporary log files removed after manual testing; nothing left
  running (`node dist/server/src/index.js` processes killed).

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
