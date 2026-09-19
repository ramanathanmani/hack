# CODE REVIEW — Sentinel (pre-HARDEN)

Phase: HARDEN · Agent: code-reviewer · Date: 2026-09-19
Reviewed against: `decision.md` §7 (AC-1..AC-14) + §4/§5 amendments, `specs/spec-a.md`,
`architecture.md`, `plan.md`, `qa.md`. Code read: all of `server/src/**`, `server/scripts/**`,
`web/src/**`, `shared/types.ts`.

## VERDICT: **ship-with-fixes**

The golden path is real, the architecture was followed, and qa-demo-path's AC table is accurate at
the HTTP level. Nothing here is a P0. But the four P1s below all live inside the 90 seconds a judge
actually watches, and three of them are the exact class of bug an HTTP-only QA pass cannot see
(rendered-UI behaviour). Total fix size for P1s: roughly 40 lines. Do them, then re-run one browser
dry-run, then GIT.

---

## Spec drift: clean

- **No extra features.** Every file traces to an AC or an amendment. No blockchain, no ORM, no auth,
  no CDN, no `sqlite3` CLI, no `Math.random()`, no charting lib — all of architecture.md §2's hard
  bans hold.
- **Under-built only where the cut list pre-authorised it:** `/center/:id`, `/session/:id`,
  `/incidents`, `/incidents/:id`, `IncidentTimeline`, risk sparklines, Docker Compose (cut-list items
  1–4 and 2). AC-10 is satisfied better without them: `/` carries the whole arc, `/audit` is the one
  navigation. This is a correct trade, not drift. design.md's step 6 still describes the deleted
  click-through — qa.md already flagged it; demo-director must not inherit it.
- **All 14 ACs are covered by shipped code.** Items 1 and 2 below are about how the ACs *read on
  stage*, not whether they exist.
- **One narration hazard:** A3's framing header ships as "Statewide Aptitude Exam — Live · 8 centers ·
  24 sessions", not "412 candidates". Cost-avoided is computed from the real 24 sessions
  (21 spared × ₹850 = ₹17,850). Keep the pitch numbers matching the screen — do not say "412
  candidates" over a UI that says 24.

---

## Actionable items, ordered by demo impact

### P1-1 — The frozen candidate clock keeps counting down while the banner says "Timer paused"
`web/src/components/CandidatePanel.tsx` — `SessionClock` starts a 1s decrement interval and only
re-syncs when `remainingMs`/`serverNow` change. While a center is frozen the server broadcasts **no**
`session.updated` events for those sessions, so in live-WS mode (the default demo path) the number
visibly ticks down for the entire freeze, directly under
`"Center disrupted. Your progress is saved. Timer paused. Do not refresh."` That contradiction is on
the screen the judge is staring at during the core beat. (In poll mode it is correct, because each
2s snapshot re-syncs — which is why curl-level QA missed it.)

Fix: pass the session state in and skip the interval when `state === "frozen"`.
Follow-on: once paused, the clock will *hold* and then continue rather than jump up, so AC-5's
"time restored" must be narrated off the existing `+Ns restored` chip and the `frozenMsTotal`
number. Tell demo-director that explicitly.

### P1-2 — A live kill→reconnect will almost certainly render "No Action Needed", not the money verdict
`server/src/config.ts:32` / `.env.example:23` — `VERDICT_FREEZE_THRESHOLD_S=30`. A presenter who
kills, narrates, and reconnects takes ~10–20s (qa.md measured 18s → `no-action`). The
Governance-Impact-15 beat that decision.md A4 was written for — **PARTIAL EXTENSION + re-conduct cost
avoided** — only fires above 30s. The demo would land on a card that says nothing happened.

Fix (pick one, prefer the first): set `VERDICT_FREEZE_THRESHOLD_S=10` in `.env.example` and the
`config.ts` default, so a natural 15s outage reliably produces PARTIAL EXTENSION. Or script a hard
"hold for 35 seconds" in the demo — still inside AC-11's 60s, but it is 35s of dead air and one
nervous presenter away from a flat verdict.

### P1-3 — "Reset Demo" leaves a *blander* state than the one the demo was designed on
`server/src/sim/simulator.ts:85` `reset()` re-seeds `repo.seedScenario()` (bare: healthy centers,
genesis checkpoints only, exam clock restarting at 60:00). It does **not** reproduce
`server/scripts/seed.ts`'s intentional demo fixture — the 22-minutes-in exam clock, the 70
answer-save checkpoints, and the pre-resolved Indore-Rajwada incident with its `partial-extension`
verdict. So if anyone presses Reset Demo at the end of a rehearsal, the real run starts on an empty,
verdict-free dashboard.

Fix (cheapest first): brief the team that the reset between runs is `npm run seed` + reload, not the
button; or relabel the button "Reset (bare scenario)"; or hide it from `SimulatorControls` for the
demo build. Making `reset()` replay the backstory is nicer but is real work at freeze time.

### P1-4 — Tamper makes the broken row appear twice in the chain table
`server/src/routes/audit.ts:36` broadcasts `{type:"checkpoint.appended", payload: tampered}` for a row
that already exists. `web/src/lib/useLiveState.ts:57` prepends it unconditionally, so the same
`cp.id` is in `recentCheckpoints` twice → duplicate React keys and the tampered checkpoint renders
twice in `/audit`'s table and in `LedgerPanel`, both flagged "Broken". This is inside decision.md's
"single highest-leverage 30 seconds".

Fix: drop the broadcast entirely (the FAIL banner and table highlight come from the verify response,
not from this event), or upsert by `id` instead of prepending.

---

### P2-5 — `/audit` says "Full Chain" and "N rows checked" over a 50-row client window
`server/src/repo.ts:512` caps `recentCheckpoints` at 50 fleet-wide; `web/src/routes/Audit.tsx:26,36`
uses that client-side length as the PASS banner's `rowsChecked`. On the seeded DB the server verifies
100+ rows and the banner will claim 50. Two secondary effects: the table titled "Full Chain" is not
one, and after a page reload (or in poll mode) mid-freeze the killed center's freeze checkpoints can
already have aged out of the 50-row window, leaving `/`'s ledger panel for that center empty.

Fix: raise the limit to ~400 in `getApiState`, and either rename the panel "Recent chain (newest N)"
or return/report the server-side verified row count.

### P2-6 — Verdict uses cumulative frozen time, not this incident's
`server/src/sim/simulator.ts:180` — `frozenDurationsMs = resumed.map(s => s.frozenMsTotal)`, which
accumulates across every freeze that session has ever had. A second kill→reconnect on the same center
without a reset double-counts, and any live incident on C4 inherits the seeded 47s backstory. Numbers
on the verdict card will not match the outage the judge just watched.

Fix if touching it: snapshot `frozenMsTotal` at freeze and diff on resume. Otherwise: never demo twice
on the same center, and never pick C4.

### P2-7 — `ENABLE_SIM_CONTROLS=false` 403s the entire app, not just `/api/sim/*`
`server/src/routes/sim.ts:14` registers `app.addHook("preHandler", ...)` on the **root** Fastify
instance, so with the flag off every request — including `GET /` and `/api/state` — is rejected. The
async hook also calls `reply.send()` without `return reply`, which Fastify treats as a continuation.
Harmless at the default `true`, fatal if anyone flips the flag to demonstrate architecture.md §7's
"in production this prefix is not mounted" answer.

Fix: move the check inside the three handlers (as `routes/audit.ts` already does), or register the sim
routes inside an encapsulated plugin scope.

### P2-8 — Risk score is static, so the fleet grid looks frozen before the kill
`riskScore` is only ever written by `updateCenterStatus` (0 seeded / 90 down / 10 recovered). Nothing
recomputes it per tick, so all 8 cards read "Risk score: 0" on landing even though latency samples are
being stored every second. AC-1's "live-updating health/risk" is satisfied by health, not risk, and
the first 20 seconds of the demo have no motion except the ledger appending.

Fix if idle: derive a small risk number from the last N `latency` rows already in `telemetry_events`
and broadcast `center.updated`. Zero new tables, zero new routes. Otherwise leave it — the ledger
panel carries the liveness.

### P3-9 — Dead code, delete only if you are already in the file
`Repo.updateCenterRisk` (never called), `CenterStatus "degraded"` and `SessionState "submitted"`
(never produced), checkpoint kind `"submit"` (never appended), and `routes/centers.ts` /
`sessions.ts` / `incidents.ts` / `verdicts.ts` (no UI consumer — though they are spec-a §6 surface and
worth keeping if the pitch points a judge at the API). Zero demo impact either way.

---

## Test gaps on the demo path

1. **Nothing tests the loop the demo *is*.** All 16 passing tests are pure functions
   (chain/clock/verdict). There is no test that boots `buildApp()` with `SIM_TICK_MS=50` and drives
   kill → detect → freeze → reconnect → resume → verdict in-process. That integration is currently
   guarded only by humans running curl. One ~60-line `node:test` file would cover it and would have
   caught P2-6.
2. **`determinism.test.ts` was never written** (architecture.md §3, plan.md T70). AC-12 is asserted
   only by "re-ran the seed and it looked the same".
3. **No test exercises the real tamper path.** `chain.test.ts` corrupts rows synthetically; nothing
   asserts `POST /api/sim/tamper` → `verifyLedger()` returns the *matching* `brokenAt.rowId`.
4. **No browser-level verification at all** (known and disclosed since frontend M1). P1-1, P1-4 and
   P2-8 are precisely what an HTTP-only pass cannot see. **One human dry-run in a real browser before
   presenting is mandatory, not optional** — watch specifically: the frozen clock, the tamper→FAIL row
   highlight, the POLLING pill on a killed WS.

---

## Recommended order

P1-1 → P1-2 → P1-4 → P1-3 (brief, don't code) → browser dry-run → P2-5/P2-7 if time → GIT.
