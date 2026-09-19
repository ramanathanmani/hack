# PLAN — Sentinel build backlog

Phase: PLAN · Agent: planner · Date: 2026-09-19
Implements: decision.md (winning spec-a.md, amended) + architecture.md (folder map, milestone gating A1: M1→M2→M3→M4).
Acceptance IDs (AC-1..AC-14) are decision.md §7. Every task cites one.

> Framing note: this is a **pre-event reference-prototype build**, not the literal 3h Round-1 clock.
> Estimates below are wall-clock-style checkpoints for *this* session, not a ticking countdown — but
> each phase boundary is still a hard gate: do not start the next phase until the current one's ACs
> demo cleanly, exactly as decision.md A1 requires. The kill gates in §4 exist so that if this ever
> *is* run against a real clock (e.g. rehearsing for the actual Oct 9 event), the same backlog
> degrades gracefully instead of leaving a half-wired platform on stage.

---

## 1. Ordered task backlog

### Phase 0 — SCAFFOLD (sequencing constraint, architecture.md §14 — must land first, nothing else starts)

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T00 | Root workspace: `package.json` (npm workspaces `server`,`web`), root `tsconfig.base.json`, `.env.example`, `.gitignore` (data/*.db, node_modules, dist, *.mp4 except demo/) | integration-agent | 0.5h | — | infra (no AC; blocks everything) |
| T01 | `better-sqlite3` install + native-module smoke check (`node -e "require('better-sqlite3')"`) run and recorded; if it fails, switch `db/connection.ts` target to `node:sqlite` per architecture.md §11 risk 5 | integration-agent | 0.25h | T00 | infra — unblocks AC-9 |
| T02 | `shared/types.ts` — Center, Session, Incident, Checkpoint, Verdict, WsEvent union, ApiState shape (single source of truth for both builders) | integration-agent | 0.5h | T00 | infra — required by T10/T20 |
| T03 | `server/src/db/connection.ts` + `server/src/db/migrations/001_init.sql` + `server/src/db/migrate.ts` (schema from architecture.md §4) | integration-agent | 0.75h | T01, T02 | infra — required for AC-1..AC-9 |
| T04 | `web/vite.config.ts` proxy block (`/api`,`/ws` → :8080) + `@shared` alias; `web/index.html` with no external `<link>/<script>` | integration-agent | 0.25h | T00, T02 | AC-14 (guard) |
| T05 | Scaffold gate check: `npm install` completes, `npm run typecheck` runs (even with empty impl), smoke check output pasted into plan notes | integration-agent | 0.25h | T01–T04 | infra gate — **fork point** |

**Fork point: after T05, `server/**` and `web/**` are disjoint — backend-builder and frontend-builder proceed in parallel.**

---

### Phase 1 — M1 "Checkpoint parity" (the first vertical slice — golden path, not infra vanity)

This is explicitly the first 3 BUILD tasks judges could click through: kill → freeze → checkpoint →
reconnect → resume → verdict, on **one** center, backed by real (not mocked) hash-chain data, served
by a real HTTP+WS loop, rendered by a real (if rough) UI. No task in this phase is pure plumbing —
each one either produces or renders a clickable state transition.

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T10 | `domain/chain.ts` (`canonicalJson`, `hashEntry`, `appendCheckpoint`, `verifyChain`) + `chain.test.ts` FIRST, before anything else server-side (architecture.md §14: "first code written") | backend-builder | 1h | T05 | AC-7, AC-8 (foundation) |
| T11 | `domain/clock.ts` (`remainingMs`, freeze/resume math) + `clock.test.ts` (47s freeze ⇒ remaining restored ±50ms) | backend-builder | 0.5h | T10 | AC-5 |
| T12 | `domain/sessions.ts` state machine (active→frozen→resumed→submitted) + `sim/rng.ts` (mulberry32, no `Math.random()`) + `sim/scenario.ts` fixtures (1 center, 3 candidates, fixed questions/answers) | backend-builder | 1h | T11 | AC-9, AC-12 (foundation) |
| T13 | `sim/simulator.ts` — seeded tick loop (heartbeat/latency/answer_save), `kill()`, `reconnect()`, `reset()`; answer_save appends real checkpoints via T10 | backend-builder | 1h | T12 | AC-4, AC-9 |
| T14 | `domain/verdict.ts` — policy object + `compute()` (rule/inputs/arithmetic/cost-avoided shape from architecture.md §4) + `verdict.test.ts` | backend-builder | 0.75h | T13 | AC-6 |
| T15 | Routes: `GET /api/state` (M5 aggregate), `POST /api/sim/kill/:centerId`, `POST /api/sim/reconnect/:centerId`, `GET /api/sessions/:id`, `GET /api/incidents/:id`(stub ok), `GET /api/verdicts/:incidentId`; `ws/hub.ts` broadcast wired to simulator events | backend-builder | 1h | T13, T14 | AC-1..AC-6 (transport) |
| T16 | `server/src/index.ts` boot sequence (migrate→seed→Fastify→ws→simulator.start), `scripts/seed.ts`, `scripts/verify-chain.ts` | backend-builder | 0.5h | T15 | AC-9 |
| T20 | `lib/api.ts` (typed fetch) + `lib/useLiveState.ts` (WS subscribe, poll-only acceptable at M1) | frontend-builder | 0.5h | T05 | AC-9 (foundation) |
| T21 | `routes/ControlTower.tsx` `/` shell + `components/CandidatePanel.tsx` — 1 center, 3 candidates, mock question/answer, server-rendered clock, status banner on freeze | frontend-builder | 1h | T20 | AC-3, AC-10 |
| T22 | `components/LedgerPanel.tsx` — live-appending checkpoint list with seq/hash/prev-hash | frontend-builder | 0.5h | T20 | AC-4 |
| T23 | `components/SimulatorControls.tsx` (red-quarantined, kill/reconnect buttons, labeled) | frontend-builder | 0.5h | T20 | AC-2 (control), A2 quarantine |
| T24 | `components/VerdictCard.tsx` — renders rule/inputs/arithmetic/cost-avoided once `/incidents/:id`'s verdict is computed | frontend-builder | 0.5h | T21, T22 | AC-6 |
| T25 | Wire ControlTower to `useLiveState`: mount → hydrate `/api/state` → render live | frontend-builder | 0.5h | T21–T24, T15 | AC-9, AC-10 |
| **T1G** | **M1 gate**: `npm run build && npm start`; kill→detect→freeze→checkpoint→reconnect→resume→verdict completes live, wifi off, on `/` alone; `npm run verify-chain` PASS | integration-agent (checks) | 0.5h | T16, T25 | AC-3,4,5,6,9,10 — **golden path proven** |

*If the build stalls anywhere past this gate, decision.md §9 pre-authorizes shipping M1 as the demo (Spec B fallback). This is the floor, not the target.*

---

### Phase 2 — M2 "Fleet"

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T30 | Extend `sim/scenario.ts` + `simulator.ts` to 6–8 centers with per-center risk-score rule (threshold on last-N-ticks signals) | backend-builder | 1h | T1G | AC-1 |
| T31 | `domain/incidents.ts` — open/classify/severity/escalate/close, driven by real missed-heartbeat detection (not short-circuited by kill handler — architecture.md §13 honesty rule) | backend-builder | 1h | T30 | AC-2 |
| T32 | `routes/incidents.ts` (`GET /api/incidents`, `/:id`), `POST /api/sim/reset` (truncate+reseed+re-seed RNG+rebroadcast, no restart) | backend-builder | 0.5h | T31 | AC-2, AC-12 |
| T33 | `components/CenterGrid.tsx` (6–8 centers, health color, risk score, candidate count) | frontend-builder | 0.75h | T1G, T30 | AC-1 |
| T34 | `components/IncidentTimeline.tsx` (live incident feed on `/`) | frontend-builder | 0.5h | T31 | AC-2 |
| T35 | `components/FramingHeader.tsx` (A3 — "Session 2 of 3 — 8 centers — 412 candidates live") | frontend-builder | 0.25h | T33 | A3 (Presentation) |
| **T2G** | **M2 gate**: pick any center, kill it, watch grid flip red + incident appear + classification/severity shown, within 2s; reset works without restart | integration-agent (checks) | 0.5h | T32, T34, T35 | AC-1, AC-2, AC-12 |

---

### Phase 3 — M3 "Trust"

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T40 | `routes/audit.ts` — `POST /api/audit/verify` (walks all centers' chains, returns brokenAt on mismatch) | backend-builder | 0.5h | T2G | AC-7, AC-8 |
| T41 | `POST /api/sim/tamper` (raw `UPDATE checkpoints SET payload_json=?`, bypassing append-only API — A2) + `scripts/tamper.ts` CLI second path | backend-builder | 0.5h | T40 | AC-8, A2 |
| T42 | `routes/Audit.tsx` `/audit` — "Verify Chain Integrity" button, PASS/FAIL rendering with broken-row detail; quarantined "SIMULATOR CONTROLS" panel housing the tamper button | frontend-builder | 1h | T40, T41 | AC-7, AC-8, A2 |
| T43 | `components/SimulatedBadge.tsx` applied to every simulated surface (candidate panel, center grid, telemetry) | frontend-builder | 0.5h | T42 | AC-13 |
| T44 | Timing pass: confirm full kill→verdict core loop completes < 60s (trim tick intervals / thresholds if not) | backend-builder | 0.5h | T2G | AC-11 |
| **T3G** | **M3 gate**: `/audit` shows PASS on clean chain; click in-app tamper; click Verify again → FAIL with exact broken row (table/rowId/expectedHash/actualHash); core loop <60s | integration-agent (checks) | 0.5h | T42, T43, T44 | AC-7, AC-8, AC-11, AC-13 |

---

### Phase 4 — M4 "Depth" (first to cut — see §4 kill gates)

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T50 | `routes/CenterDetail.tsx`, `routes/SessionDetail.tsx`, `routes/Incidents.tsx`, `routes/IncidentDetail.tsx` (drill-downs, per architecture.md — optional for a stranger judge) | frontend-builder | 1.5h | T3G | AC-10 (drill-down, not core arc) |
| T51 | `components/ConnectionPill.tsx` + WS→2s-poll auto-degrade in `useLiveState.ts` | frontend-builder | 0.5h | T3G | AC-9 resilience (decision.md §6 risk) |
| T52 | Verdict reasoning breakdown UI (full arithmetic list on IncidentDetail) | frontend-builder | 0.5h | T50 | AC-6 (depth) |
| T53 | `npm run check:offline` script (greps built bundle for http(s):// origins) | integration-agent | 0.25h | T3G | AC-14 |
| T54 | Docker Compose wrapper (optional, cut-list item 2) | devops-deploy | 0.5h | T3G | none — polish only |
| **T4G** | **M4 gate**: all drill-downs reachable, degrade-to-poll demoed by killing WS, offline check passes | integration-agent (checks) | 0.25h | T50–T53 | AC-9, AC-14 |

---

### Phase 5 — DEMO DATA

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T60 | Finalize `server/scripts/seed.ts` + `server/src/sim/scenario.ts` — realistic center names (Bhopal-area), candidate names/roll numbers, exam duration, fixed answer sequence; confirm deterministic re-run (same seed ⇒ same event stream) | data-seeder | 0.75h | T2G (can start once centers exist) | AC-12 |
| T61 | Tune `VERDICT_FREEZE_THRESHOLD_S` / cost-avoided constants so the demo scenario reliably lands on "partial-extension" with a compelling avoided-cost number | data-seeder | 0.25h | T60, T3G | AC-6, A4 |

---

### Phase 6 — TESTS

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T70 | `npm test` full pass: `chain.test.ts`, `clock.test.ts`, `verdict.test.ts`, `determinism.test.ts` | qa-demo-path (runs), backend-builder (fixes) | 0.5h | T3G | AC-5, AC-6, AC-7, AC-8, AC-12 |
| T71 | Repo grep gates: no `Math.random()`, no `sqlite3` CLI invocation, no external origins in `web/dist` | qa-demo-path | 0.25h | T70 | AC-12, AC-14, architecture.md §2 bans |
| T72 | Full rehearsal run: fresh `npm run reset`, cold `npm run build && npm start`, wifi off, run the whole demo script end to end 3x for repeatability | qa-demo-path | 0.75h | T70, T60, T61 | AC-9, AC-11, AC-12 |

---

### Phase 7 — POLISH

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T80 | Visual polish pass on `/` (spacing, color for health states, red quarantine styling) — no new components | frontend-builder | 0.75h | T72 | Presentation (5%) |
| T81 | Copy pass: framing header wording, verdict rule sentence, honesty labels read cleanly aloud | ui-polish/copywriter (if available) else frontend-builder | 0.5h | T80 | A3, A6, A4 |
| T82 | Record `demo/fallback-run.mp4` (~90s successful run, ≤1MB per submission constraint) | demo-director | 0.5h | T72 | decision.md §4 M4 merge (last-resort fallback) |

---

### Phase 8 — DEPLOY

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T90 | Confirm `npm run build && npm start` on a clean checkout serves `http://127.0.0.1:8080` with wifi off | devops-deploy | 0.25h | T72 | architecture.md §9 deploy definition |
| T91 | Attempt `cloudflared tunnel --url http://localhost:8080` (no-account path) for a shareable URL if the real event's DEPLOY exit condition demands one; if the binary is unobtainable, record **blocked** with the exact missing dependency — do not fake a URL | devops-deploy | 0.5h | T90 | project DEPLOY exit condition (localhost fails it) |

---

### Phase 9 — PITCH

| id | title | owner | est | depends_on | acceptance |
|---|---|---|---|---|---|
| T100 | Demo script: exact click sequence, who presses what (judge picks the center), timing marks (<60s core loop + tamper beat) | demo-director | 0.5h | T72 | decision.md §3 demo script hooks |
| T101 | Pitch narrative: problem → golden path → tamper trust beat → scalability written-answer → cost-avoided number | pitch-writer | 0.5h | T100 | Governance Impact (15%), Innovation (20%) |
| T102 | judge-simulator dry run against decision.md rubric weights; feed gaps back to debugger/qa-demo-path if any AC regresses | qa-demo-path | 0.5h | T101 | full AC-1..AC-14 |

---

## 2. Kill gates

- **T-6h (cut should-haves):** Stop all Phase 4 (M4 Depth) work not yet started. Apply decision.md
  §8 cut list top-down starting at item 1 (`/incidents` list + `/center/:id` detail routes) through
  item 4 (`/session/:id`). Ship M3 as the ceiling if M4 isn't done. Never touch items below "Docker
  Compose" unless genuinely idle — this is a floor-protecting cut, not a scope hunt.
- **T-3h (demo freeze except bugs):** No new files, no new routes, no new components. Only
  debugger, test-runner, git-pusher, devops-deploy, demo-director, pitch-writer, readme-submit,
  scribe, pm-timebox may run (per CLAUDE.md demo_freeze rule). Any remaining Phase 4/5/6 tasks not
  done are cut, not rushed. Set `demo_freeze: true` in STATE.md.
- **T-1h (submit kit):** Only readme-submit + git-pusher (SUBMIT phase, second push) run. Freeze the
  repo. Confirm `demo/fallback-run.mp4` is committed and ≤1MB. Confirm STATE.md `repo_url` is a real
  pushed remote before calling this done — a markdown-only or localhost-only state is failure per
  CLAUDE.md exit conditions.

These are stated as **fallback guidance for the real Oct 9 event's 3-hour Round-1 window** — for
*this* pre-event session there is no literal clock, but the same gates should be treated as the
milestone checkpoints (M1/M2/M3 gates above) that must each independently produce a working demo
before advancing.

---

## 3. Golden-path guarantee (first 3 BUILD tasks)

Per instruction, the first 3 BUILD tasks (T10, T11, T12 in sequence, immediately followed by T13–T16
and their frontend pairs T20–T25) do not produce infrastructure vanity — by T1G there is a clickable
loop: press Kill Switch → center panel visibly freezes with a status banner → a real checkpoint with
a real SHA-256 hash appears in the ledger → press Reconnect → clock visibly restores → a verdict
renders with real numbers. That is a demoable product after the very first phase, not after the
whole backlog.

---

## 4. Now / Next / Later / Never

**NOW** (do not start anything else until this is true):
- T00–T05 scaffold, ending in a proven `better-sqlite3` smoke check and a committed `shared/types.ts`.
- T10 `chain.ts` + `chain.test.ts` — architecture.md is explicit this must be the first server code
  written, because AC-7/AC-8 fail silently and late otherwise.
- T1G — the full M1 golden path clickable end to end. This is the single most important checkpoint
  in the whole plan: if only one milestone ships, this is the one that must.

**NEXT** (once T1G is proven):
- M2 Fleet (T30–T2G) — multi-center grid + real incident detection + classification.
- M3 Trust (T40–T3G) — the audit verifier and the in-app tamper beat. Decision.md calls this "the
  single highest-leverage 30 seconds in the whole demo"; do not let it slip past T-6h.
- Demo data tuning (T60–T61) can run concurrently with M2/M3 once centers exist — data-seeder only
  touches `seed.ts`/`scenario.ts`, so it never blocks backend-builder or frontend-builder.

**LATER** (M4 depth — first to cut under time pressure, per decision.md §8):
- Drill-down routes `/center/:id`, `/session/:id`, `/incidents`, `/incidents/:id` (T50).
- WS→poll degrade UI polish (T51) — the underlying resilience should exist earlier if cheap, but the
  `ConnectionPill` and visible degrade demo is a nice-to-have.
- Docker Compose (T54) — zero demo value, repo-peeking-judge value only.
- Verdict reasoning breakdown UI beyond the label + three numbers (T52).
- Per-center risk trend sparklines — never in scope per decision.md §8 item 3 (keep scalar only).

**NEVER** (explicitly out of scope — decision.md §12/§2, architecture.md §2 hard bans):
- Real proctoring/webcam/face detection, real question banks or scoring, candidate auth/login,
  mobile apps, multi-tenant admin/roles, real SMS/email delivery, cloud deployment beyond an
  optional no-account tunnel, real exam vendor integration.
- Blockchain/DLT/Merkle library, hosted DB/Postgres/ORM, `sqlite3` CLI dependency, any external
  network call at runtime, auth/login of any kind, LLM/ML/vector DB, Tailwind/MUI/charting library,
  socket.io/xstate/Temporal/Redis/message queue, any test framework beyond `node:test`, load-test
  theater. A PR introducing any of these is rejected on sight per architecture.md §2.
