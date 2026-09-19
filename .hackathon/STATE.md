# Hackathon State

- hackathon_url: https://innovate.mponline.gov.in/
- event_name: MPOnline Idea & Innovation Hackathon 2026
- event_dates: 09–10 October 2026, in-person, SSRGSP Bhopal (starts 09:00 IST, hack begins 10:30)
- track: Technical
- phase: DEPLOY (blocked)
- status: blocked
- last_agent: devops-deploy
- next_agent: conductor-decision (proceed to SHOW/SUBMIT on local-only + documented deploy path, or wait for unrestricted-network re-run of deploy.md §5)
- stack: Node.js 22 + TypeScript · Fastify 5 + raw `ws` · SQLite via better-sqlite3 (single file,
  forward-only .sql migrations) · hand-rolled SHA-256 hash chain (node:crypto), sharded per center ·
  React 19 + Vite 6 + plain CSS · deterministic seeded telemetry simulator · npm workspaces
  (`server/`, `web/`, `shared/`) · host = self-hosted localhost:8080, one process serves API + WS +
  built UI, fully offline, no cloud/no auth/no API keys
- winner_spec: spec-a.md — "Sentinel" (full 5-stage control tower), as amended by decision.md §4–§5
- runner_up_spec: spec-b.md — "Checkpoint" (absorbed as Sentinel milestone M1, not discarded)
- chosen_problem: PS06 — Resilient & Trustworthy Online Assessment Ecosystem
- chosen_idea: Live exam-integrity control tower — one vertical slice of
  Prevention → Detection → Response → Recovery → Trust
- fallbacks: PS03 (AI-driven OSM), PS04 (Digital inclusion, rural HE)
- repo_url: https://github.com/ramanathanmani/hack (branch: main)
- preview_url: BLOCKED: outbound TCP/UDP port 7844 to Cloudflare edge not permitted in this sandbox (HTTP-CONNECT-only egress proxy, port 443 only) — cloudflared installed and ran successfully, printed a real trycloudflare.com hostname, but the tunnel data connection could never establish; see deploy.md §4-5 for exact logs/evidence and the exact commands a human on an unrestricted network can run to finish this in under a minute. LOCAL (`npm run build && npm start` -> http://127.0.0.1:8080) is fully working, re-verified live in this session.
- demo_freeze: false
- hours_total: ~3h to the Round 1 cut on Day 1 (10:30 → 13:30 IST, 09 Oct), then evening off-venue,
  then Day 2 finale presentations from 09:00
- hours_remaining: N/A, pre-event reference-prototype build (real event in 20 days: 09–10 Oct)

## blockers (human/process only — do not block BUILD; see decisions.md D6)
1. **Rules conflict, needs eventual human confirmation.** FAQ: project/code/design/idea/content "must
   be created during the hackathon duration"; previously built projects are ineligible. Agenda: 10:30
   session reviews "premade presentations/solutions". Ask hackathon@mponline.gov.in /
   +91-7024589934 / +91-7880172879 before the real event. Not a blocker for building a reference
   prototype now — see D6.
2. **No registered team.** Requires 2–4 humans aged 16–25, physically in Bhopal on 09–10 Oct, with a
   paid non-refundable registration. Outside this session's control; does not block building the
   product itself.
3. Registration close date, submission-lock deadline (+timezone) and fee are UNKNOWN.

## Scaffold status (Phase 0, plan.md T00–T05 — complete)
- Root npm workspaces (`server`, `web`) + `tsconfig.base.json` + `.env.example` (13 vars) +
  `.gitignore` landed. `npm install` succeeds (197 packages).
- `shared/types.ts` is the single source of truth for Center/CandidateSession/Incident/Checkpoint/
  Verdict/WsEvent/ApiState shapes — both workspaces typecheck against it.
- `server/src/db/connection.ts` (better-sqlite3 wrapper, WAL + foreign_keys) + `db/migrate.ts` +
  `db/migrations/001_init.sql` (full schema per architecture.md §4) — smoke-tested: migration runs,
  all 7 tables created, native module loads (`node -e "require('better-sqlite3')"` succeeds on
  v22.22.2). node:sqlite fallback plan is documented as a comment in connection.ts, not implemented.
- `web/vite.config.ts` has the dev proxy (`/api`, `/ws` → :8080) + `@shared` alias; `web/src/main.tsx`
  is a placeholder pending frontend-builder.
- `npm run typecheck` (both workspaces) and `npm run build` (web + server) both pass on the
  placeholder code. `npm start` is not runnable yet — `server/src/index.ts` doesn't exist yet, that's
  backend-builder's first real file.
- Full commands/results recorded in `.hackathon/qa.md` under "integration - scaffold".
- **Fork point reached:** `server/**` and `web/**` are disjoint from here. backend-builder should
  start with `domain/chain.ts` + `chain.test.ts` per architecture.md §14 (first code written, because
  AC-7/AC-8 fail silently and late otherwise).

## Frontend M1 status (BUILD, frontend-builder — complete)
- `web/src/**` built for M1 "Checkpoint parity" golden path: `App.tsx` + minimal hand-rolled router
  ("/", "/audit"), `routes/ControlTower.tsx`, `routes/Audit.tsx`, all 8 components named in
  architecture.md §3 / design.md §4 (FramingHeader, CenterGrid, CandidatePanel, LedgerPanel,
  VerdictCard, SimulatorControls, SimulatedBadge, ConnectionPill), `lib/api.ts` (typed fetch),
  `lib/useLiveState.ts` (WS + 2s-poll fallback, one shared reducer), `lib/clock.ts`,
  `styles/tokens.css` + `styles/app.css` (brand.md colors, 8px grid, AA contrast, focus rings,
  aria-live). All user-facing strings pulled from `copy.md`.
- Built against `shared/types.ts` only — `server/**` had no `index.ts`/routes/`ws` yet at build
  time, so the app was verified with the backend absent (ConnectionPill correctly shows
  OFFLINE/polling failure paths, no crash) rather than against mocks.
- `npm run typecheck --workspace web`, `npm run build --workspace web`, and
  `npm run check:offline --workspace web` all PASS. Full command output in
  `.hackathon/qa.md` under "frontend M1". Could not run a full headless-browser render check (no
  puppeteer/playwright/jsdom in this environment) — recommend test-runner/integration-agent confirm
  with a real browser once `server/src/index.ts` exists.
- Not built (deferred, per M1 scope): multi-center fleet polish, IncidentTimeline component,
  `/center/:id`, `/session/:id`, `/incidents`, `/incidents/:id` drill-downs — these are M2/M4 per
  architecture.md §10's gating table.
- **Next for backend-builder:** implement `server/src/index.ts`, routes (`state.ts`, `sim.ts`,
  `audit.ts`, `verdicts.ts`, etc.), and `ws/hub.ts` per architecture.md §3, matching the exact
  `ApiState`/`WsEvent` shapes in `shared/types.ts` that this frontend pass already codes against.

## Backend M1 status (BUILD, backend-builder — complete, re-verified)
- `server/src/**` built for M1 "Checkpoint parity": `domain/{chain,clock,verdict,sessions,incidents}.ts`,
  `sim/{rng,scenario,simulator}.ts`, `repo.ts` (all SQL), `routes/{state,centers,sessions,incidents,
  verdicts,audit,sim}.ts`, `ws/hub.ts`, `index.ts` (Fastify boot), `config.ts`, plus
  `scripts/{verify-chain,tamper,seed}.ts` and `test/{chain,clock,verdict}.test.ts`. `chain.ts` +
  `chain.test.ts` were the first files written/verified, per architecture.md §14.
- Kill switch never opens an incident directly — `sim/simulator.ts`'s tick loop detects a real missed
  heartbeat and only then opens/classifies the incident and freezes sessions; reconnect only restores
  the heartbeat source, and the same detection loop observes recovery and resumes/closes/computes the
  verdict. Verified live over HTTP, not just by code reading (see qa.md "backend M1").
- `server/package.json`'s `build` script now also runs `copy-migrations` (copies `db/migrations/*.sql`
  into `dist/`) — without it, a fresh `npm start` after `npm run build` failed at boot with
  `ENOENT ... db/migrations`. This was the one real gap found in the prior scaffold/build wiring.
- Re-verified end-to-end against data-seeder's enhanced `seed.ts`/`scenario.ts` (left as data-seeder
  produced them — see below): `npm test` (16/16), `npm run typecheck` and `npm run build` (both
  workspaces) all PASS; fresh `npm start` after a clean build serves real `GET /api/state` data over
  curl; full kill→detect→freeze→checkpoint→reconnect→resume→verdict loop and the
  verify→tamper→verify(FAIL)→reset→verify(PASS) audit loop both exercised live over HTTP and via the
  CLI scripts. Full commands/output in `.hackathon/qa.md` under "backend M1".
- Not built in this pass (out of M1 scope / integration-agent's file): `server/src/static.ts`
  (`@fastify/static` prod wiring) — M1's acceptance surface is provable over the raw API/WS without it.
- **Next:** integration-agent to wire `static.ts` for a single-process `npm start` demo (serving
  `web/dist`), then a full browser-based end-to-end pass (kill-switch click, ledger render, verdict
  card, audit tamper) since this pass only verified the backend via curl/CLI, not the rendered UI.

## Data-seeding status (BUILD, data-seeder — complete)
- Owned files only (architecture.md §3): `server/scripts/seed.ts` (rewritten) and
  `server/src/sim/scenario.ts` (added `BACKSTORY_CENTER_INDEX` export). No routes/ws/domain files
  touched.
- `npm run seed` now produces a lived-in demo state instead of a blank t=0 dashboard: exam started
  ~22 min before seed time, 2-4 real answer-save checkpoints per session (deterministic
  `mulberry32(SIM_SEED)`, no `Math.random()`), and one pre-resolved "backstory" incident (47s outage,
  3 sessions, real freeze/resume checkpoints, real computed `partial-extension` verdict with
  cost-avoided arithmetic) at center C4 "Indore - Rajwada" — built from the same `Repo`/domain
  functions the live simulator uses. Every other center stays healthy/pristine so the operator can
  still run the live kill -> incident -> reconnect -> recovery -> verdict arc for the demo.
- Verified against a real local SQLite file (not the tracked dev DB): `npm run build --workspace
  server` PASS, seed PASS, `npm run verify-chain --workspace server` PASS both on first seed and
  after re-seeding (idempotent — `truncateAll()` runs first), direct SQL inspection confirmed
  realistic MP center names / Indian candidate names+roll numbers / 100 real hash-chained
  checkpoints / one resolved incident+verdict. Full commands and output in `.hackathon/qa.md` under
  "data-seeder".
- No auth exists in this system (architecture.md §7 explicitly bans auth/login/roles for the demo),
  so no "judge user" was created and there is nothing to add to a future deploy.md credentials
  section.
- **Next:** integration-agent (or backend-builder once `index.ts`/routes/ws land) should run
  `npm run build && npm start` end-to-end against this seeded data to confirm the UI renders the
  populated golden path (healthy fleet + one resolved incident/verdict visible immediately, plus a
  live center available for the kill-switch demo).

## Integration M1 end-to-end status (INTEGRATE, integration-agent — M1 gate T1G: PASSED)
- Found and fixed the real gap flagged above: `server/src/static.ts` did not exist, so
  `server/src/index.ts` never served the built UI. Created `static.ts` (`@fastify/static` on
  `web/dist`, computed from `import.meta.url` against the actual compiled `dist/` layout, plus a
  SPA-fallback `setNotFoundHandler`) and wired it into `index.ts`, gated on `NODE_ENV=production`,
  registered after all API routes and before `simulator.start()`.
- Found and fixed a second gap: `server/package.json`'s `start` script did not set `NODE_ENV`, so
  the README/architecture-documented `npm run build && npm start` command would boot the API+WS but
  silently skip static registration (config.ts defaults `NODE_ENV` to `development`). Changed
  `start` to `"NODE_ENV=production node dist/server/src/index.js"` so the documented command now
  actually serves API + WS + UI from one process on one port, as architecture.md §0 requires.
- Re-verified `lib/api.ts` route names/methods one-by-one against the actual registered Fastify
  routes and `ws/hub.ts`'s broadcast shape — no mismatch found, no adapter code needed.
- Proved the full golden path live, over HTTP, against the exact documented command
  (`npm run build && npm start`, no manual env overrides): `/` serves the real built `index.html`
  (200), a hashed JS asset (200), and `/audit` resolves via SPA fallback (200); `GET /api/state`
  returns the real seeded fleet (8 centers / 24 sessions / 1 resolved backstory incident+verdict);
  kill→real missed-heartbeat detection→incident opened→sessions frozen with real checkpoints→
  reconnect→sessions resumed with restored time→incident resolved→verdict computed, all confirmed
  via curl; `/api/audit/verify` PASS→tamper→verify FAIL with exact broken row→reset→PASS again,
  confirmed via curl; a raw WS client connected to `/ws` received live `checkpoint.appended`/
  `session.updated` events from the running simulator (not just the HTTP poll path).
- `npm run typecheck`, `npm test` (16/16), `npm run check:offline`: all PASS after the fixes.
- `.env.example` reviewed against `config.ts`: already complete, no changes needed. No external API
  exists in this system to switch live/mock — the only simulated surface is the telemetry simulator,
  already honestly labeled (AC-13); nothing was faked.
- Repo left in the standard demo-ready seeded state (`server/data/sentinel.db` re-seeded as the last
  action). Full commands and output in `.hackathon/qa.md` under "integration - M1 end-to-end".
- **M1 gate T1G: PASSED.** Golden path runs end-to-end as one product, for real, in this environment.
- **Next:** test-runner (M1 AC re-verification + repo-wide gates per architecture.md §10/§11), then
  debugger only if a P0 surfaces.

## QA demo-path status (TEST, qa-demo-path — no P0s)
- Ran the product for real from a clean rebuild (`rm -f server/data/sentinel.db`, `npm run build`,
  `npm run seed --workspace server`, `npm start`) and exercised the full golden path via curl/WS
  exactly as a judge would click through it: `/` (real built HTML, not blank) → kill → detect →
  freeze/checkpoint → reconnect → resume/verdict → `/audit` verify PASS → tamper → verify FAIL with
  exact broken row → reset → verify PASS. **All 14 acceptance criteria (AC-1..AC-14) PASS.** No P0s.
- Two P1s: (1) `README.md`'s "Run locally" quickstart is stale ("Status: scaffold only...") and
  never calls `npm run seed`, so a stranger following it literally boots the plain/bare auto-seed
  scenario instead of the intended richer "lived-in" demo fixture (backstory incident + verdict at
  Indore-Rajwada) — fix before SUBMIT. (2) design.md's golden-path step 6 describes clicking an
  incident row to navigate to `/incidents/:id`, which does not exist in the shipped build — the
  shipped UI instead renders VerdictCard inline on `/`, which is allowed by design.md §4 and
  actually satisfies AC-10 better (zero navigation), but the demo script/design doc should be
  corrected so a presenter doesn't try to click a nonexistent row live.
- Disclosed gap (not new): no browser automation tool exists in this environment, so the rendered
  UI was verified by full HTTP/WS-level behavior checks plus careful code reading of every
  `web/src/**` component, not by an actual screenshot. Recommend one human dry-run in a real browser
  before presenting.
- Full detail, AC-by-AC table, and P2 bug list: `.hackathon/qa.md` under "qa-demo-path".
- **No blocker set — no P0s found.** Proceeding to HARDEN is safe.

## DEPLOY status (DEPLOY, devops-deploy — BLOCKED, local run verified)
- Downloaded `cloudflared` v2026.9.1 directly from GitHub Releases (not preinstalled, `apt` has no
  package for it) — no account/API key needed, binary runs fine (`cloudflared --version` passes).
- Rebuilt clean (`npm run build`), re-seeded (`npm run seed --workspace server`), started
  `NODE_ENV=production npm start` in the background, and re-verified `http://127.0.0.1:8080/`,
  `/api/state`, `/audit` all return real `200`s with real seeded data — local run is solid.
- Ran `cloudflared tunnel --url http://localhost:8080` (both default QUIC/UDP and `--protocol
  http2`/TCP transports). Cloudflare's control plane issued a real `*.trycloudflare.com` hostname
  both times, but the tunnel's data connection never came up: this sandbox's egress only permits
  outbound TCP/443 through a pre-configured HTTP CONNECT proxy, and cloudflared's edge connection
  needs TCP-or-UDP **port 7844**, which is neither 443 nor proxyable. Confirmed via cloudflared's
  own precheck output (`ERROR: Allow outbound TCP on port 7844`) and via this session's own
  `/root/.ccr/README.md`, which explicitly lists non-443 ports / tunnel clients as unsupported
  through its proxy. Curling the printed trycloudflare.com URL from outside the local process
  returned Cloudflare's own edge error (HTTP 530), never the app.
- **This is an environment egress restriction, not a missing credential and not a product bug.**
  `ngrok` was not attempted — the same environment doc names it as unsupported for the identical
  reason, so it would reproduce the same block.
- Full evidence, exact log lines, and the exact 6-line command sequence for a human on an
  unrestricted network to get a real `https://*.trycloudflare.com` URL in under a minute:
  `.hackathon/deploy.md`.
- **`STATE.md` `preview_url` = `BLOCKED: ...` (see field above), not fabricated.** `phase: DEPLOY
  (blocked)`.
- **Next: conductor decision** — either dispatch someone to re-run deploy.md §5 on an unrestricted
  network (e.g. a teammate's laptop during the real event, which is architecture.md's actual
  intended demo environment anyway), or explicitly approve proceeding to SHOW/SUBMIT on
  local-only (`http://127.0.0.1:8080`, fully verified) with this blocker documented and disclosed,
  per CLAUDE.md ("Blocked (not done) if this environment cannot deploy... Do not pretend DEPLOY
  succeeded").

## Artifacts
- /home/user/hack/.hackathon/specs/spec-a.md — "Sentinel": full 5-stage loop, multi-center grid, incident
  classification, interactive tamper-and-verify demo. Higher wow, higher build risk under the 3h Round-1 clock.
- /home/user/hack/.hackathon/specs/spec-b.md — "Checkpoint": one center, one incident, single-page golden
  path, CLI-only chain verification. Sized to comfortably fit the 3h Round-1 budget with rehearsal margin.
  No spec-c: real Round-1 budget is ~3h, not the ≥16h threshold for a wildcard spec.
- /home/user/hack/.hackathon/decision.md — **spec-judge ruling: Spec A wins.** Contains the freeze rule
  ("Builders implement this spec's acceptance criteria only"), the 14-item authoritative acceptance list
  (AC-1..AC-14), 7 amendments (A1 milestone gating M1→M4, A2 in-app tamper control since no sqlite3 CLI,
  A3 framing header, A4 re-conduct-cost-avoided in verdict, A5/A6/A7), 5 mandatory merges from Spec B,
  a risk register, and an ordered 8-item cut list. Read before ARCHITECTURE.
- /home/user/hack/.hackathon/architecture.md — **smallest architecture for Sentinel.** One Node
  process (Fastify + ws + better-sqlite3 + simulator + static UI) on :8080. Contains the repo folder
  map with hard owner boundaries (frontend-builder = `web/**`, backend-builder = `server/**`,
  integration-agent = root config + `shared/types.ts` + `docs/**`), full SQL schema + hash rule +
  verdict reasoning payload shape, env var list (no secrets exist), "no auth for demo", the
  milestone→AC→file gating table (M1–M4), run/test/deploy commands, top-5 risks, and the
  determinism/mock strategy. Read before PLAN and before any code is written.
- /home/user/hack/.hackathon/intake.md — full rules, both rubrics with weights, agenda, 10-item
  submission kit, prizes, IP terms, confirmed-vs-unknown ledger
- /home/user/hack/.hackathon/problem.md — PS selection with scoring table, golden path, scope fence,
  kill criteria
- /home/user/hack/.hackathon/decisions.md — D1–D5
- /home/user/hack/.hackathon/research.md — stack recommendation (Node/TS + SQLite + hand-rolled
  SHA-256 hash chain + WebSocket dashboard + React/Vite + synthetic telemetry simulator), all fully
  self-contained/offline, no external accounts or API keys required; gap/mock strategy for missing
  real exam-center telemetry and any comms provider; blockchain and hosted-DB options evaluated and
  rejected as unnecessary external-dependency risk
- /home/user/hack/.hackathon/archive-ibm-bob2/ — previous, unrelated run
- /home/user/hack/.hackathon/deploy.md — devops-deploy record: local run steps (verified working),
  env var names, deploy target (self-hosted localhost per architecture.md, cloudflared quick-tunnel
  as the sanctioned shareable-URL fallback), exact cloudflared install/attempt/failure evidence,
  exact commands for a human to finish the deploy on an unrestricted network, and the rollback /
  "API down" demo fallback (kill-switch/reset, not a separate recorded video — none exists yet)

## Notes
- Technical rubric shape: Innovation 20 / Prototype 20 / Problem understanding 15 / Technical
  feasibility 15 / Governance impact 15 / Scalability 10 / Presentation 5. Working code beats slides.
- Submission files are capped at **1 MB each**. Ten items. Submission is draft-then-lock; no edits after.
- MPOnline retains full ownership of anything submitted.
- Hard scheduling fact: Round 1 judging is 13:30 on Day 1, ~3 hours after the start gun. Plan the MVP
  against that cut, not against the Day 2 finale.
