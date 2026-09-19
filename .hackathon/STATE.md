# Hackathon State

- hackathon_url: https://innovate.mponline.gov.in/
- event_name: MPOnline Idea & Innovation Hackathon 2026
- event_dates: 09–10 October 2026, in-person, SSRGSP Bhopal (starts 09:00 IST, hack begins 10:30)
- track: Technical
- phase: BUILD (Phase 0 SCAFFOLD complete; frontend M1 complete, backend M1 pending)
- status: in_progress
- last_agent: frontend-builder (M1)
- next_agent: backend-builder (server/** M1 routes/index.ts/ws still needed), then data-seeder,
  then integration-agent
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
- repo_url: TBD
- preview_url: TBD
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

## Notes
- Technical rubric shape: Innovation 20 / Prototype 20 / Problem understanding 15 / Technical
  feasibility 15 / Governance impact 15 / Scalability 10 / Presentation 5. Working code beats slides.
- Submission files are capped at **1 MB each**. Ten items. Submission is draft-then-lock; no edits after.
- MPOnline retains full ownership of anything submitted.
- Hard scheduling fact: Round 1 judging is 13:30 on Day 1, ~3 hours after the start gun. Plan the MVP
  against that cut, not against the Day 2 finale.
