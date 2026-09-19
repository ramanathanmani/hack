# DECISION — spec-judge ruling

Phase: DECISION (complete) · Judge: spec-judge · Date: 2026-09-19
Rubric in force: **Technical track** — Innovation 20 / Prototype-MVP 20 / Problem Understanding 15 /
Technical Feasibility 15 / Governance Impact 15 / Scalability 10 / Presentation 5.

## FREEZE RULE
> **Builders implement this spec's acceptance criteria only.**
> Section 7 below is the authoritative acceptance list. Anything not in it is out of scope until a
> later phase explicitly reopens it. No new features may be introduced by architect, planner,
> builders, or polish agents. Scope growth is the documented failure mode for PS06 (twelve sub-asks).

---

## 1. Standing assumption that drives this ruling

The build clock for *this* session is not the literal ~3h Round-1 window. We are producing a **full
working reference prototype in one extended session**, which will later be re-created/adapted at the
venue. That inverts the weighting the spec-author used: Spec B was explicitly sized "to fit inside
the 3-hour Round-1 budget with margin," and it says so in its own §10 ("this spec is sized to fit
inside the 3-hour Round-1 budget, not to be cut further"). With that constraint relaxed, Spec B's
central justification evaporates while its costs — a thin demo, no tamper payoff, no fleet view —
remain. Spec A's costs were all clock costs.

This does **not** relax the golden-path rule. Spec A wins with a mandatory build order and a cut
list (§8) so that at every hour of the build there is a runnable end-to-end loop, never a
half-wired platform.

---

## 2. Scorecard (1–10)

| Criterion | Spec A "Sentinel" | Spec B "Checkpoint" |
|---|---|---|
| Rubric coverage | **9** — hits Prevention (risk grid), Detection+classification, Response, Recovery, Trust (verifier). Covers 7 of the PS's 12 sub-asks credibly. Scalability story has something to point at (multi-center, per-center chain). | 5 — hits Detection→Recovery only; Prevention reduced to a static list, incident classification explicitly dropped, no audit UI. Leaves Innovation-20 and Governance-15 under-served. |
| Demo wow in ≤3 min | **9** — judge kills a center of their choosing, then breaks the database on stage and watches the verifier catch it. Two distinct "oh" moments. | 6 — one button, one freeze, one restore, one card. Clean but it is a single beat; the trust beat is a CLI PASS line, which reads as an assertion, not a proof. |
| Buildable in remaining hours | **8** (was ~4 under a 3h clock) — six routes, six tables, one WS channel. All mechanically ordinary CRUD + timers + sha256. | **10** — trivially buildable; genuinely would survive 3 hours. |
| Technical risk | 7 — risk concentrates in the tamper demo (requires `sqlite3` CLI, which research.md flags as **not installed**) and in multi-center timer bookkeeping. Both mitigated in §6. | **9** — almost no risk surface. |
| Uniqueness | **9** — fleet-level control tower + computed re-conduct verdict + live tamper-catch is a shape no PS01/PS05 chatbot team can reach. Differentiation is 20% of score. | 6 — "a thing freezes and unfreezes" is a mechanism demo, not a product; easier for another team to converge on by accident. |
| Fallback if API dies | **9** — no external APIs at all (both specs); A additionally specs an automatic WS→2s-polling degrade path, which is a real, coded fallback. | 7 — same zero-external-dependency posture, but its stated fallback is a pre-recorded .mp4, which is a *presentation* fallback, not a system one. Keep the .mp4 (see §5). |
| Judge-clarity | 8 — needs ~20s of setup ("this is a live exam across 8 centers"), then it explains itself. Slight risk of route-hopping confusing a stranger; mitigated by amendment A3. | **9** — one screen, zero navigation, impossible to misread. |
| **Weighted verdict** | **WINNER** | Runner-up |

---

## 3. Ruling

### WINNER: **Spec A — "Sentinel"** (`/home/user/hack/.hackathon/specs/spec-a.md`)
### RUNNER-UP: **Spec B — "Checkpoint"** (`/home/user/hack/.hackathon/specs/spec-b.md`)

Reasoning, tied to the weights:

1. **Prototype/MVP (20) + Innovation (20) = 40% is where the spread is.** Spec B is a correct but
   modest mechanism demo. Spec A is a product a control room would actually use. Under a 3h clock
   the safe choice is right; with real build time, shipping B would be leaving 40% of the rubric on
   the table on purpose.
2. **Governance Impact (15) needs the verdict engine and the audit trail.** MPOnline's stated goal
   is *avoid unnecessary re-conduct*. That claim is only credible if the system can say "re-conduct
   these 3 candidates, not the other 400" and prove it. Spec A's `/incidents/:id` verdict-with-
   reasoning plus `/audit` verifier is the evidence chain for that sentence; Spec B's single verdict
   card is the claim without the evidence.
3. **The tamper-and-catch beat is the single highest-leverage 30 seconds in the whole demo** and
   Spec B deletes it (CLI-only, §12). A CLI printing "PASS" asks the judge to trust us. Editing a
   row in front of them and watching the verifier point at the exact broken link *removes* trust
   from the equation. That is the Innovation-20 and Trust-stage payoff in one gesture.
4. **Scalability (10) is a written criterion but needs a live referent.** "8 centers now, shard the
   chain per center, SQLite→Postgres" lands when there are 8 centers on screen. From Spec B's
   one-center screen it is an unsupported assertion.
5. **Spec B remains the safety net, not the plan.** Its entire scope is a strict subset of Spec A's.
   Amendment A1 makes that formal: Spec B *is* Sentinel's milestone 1. We never choose between them
   again — we pass through B on the way to A.

---

## 4. What to merge in from the runner-up (mandatory, not optional)

Spec B's discipline is better than Spec A's. Import all four:

- **M1 — Single-screen primary view.** Spec B §4's insight is correct: navigation during a demo is
  risk. Sentinel keeps its six routes, but `/` (Control Tower) must be self-sufficient for the whole
  kill→freeze→checkpoint→restore→verdict arc: center grid, candidate panel, live ledger panel, and
  the verdict card all visible on `/` without navigation. `/center/:id`, `/session/:id`,
  `/incidents`, `/incidents/:id` become **drill-downs for the curious judge**, not demo steps. Only
  `/audit` is a required second stop.
- **M2 — Deterministic, repeatable, resettable simulator.** Spec B §9's "re-runnable without
  restarting the server" is a hard requirement now, promoted into acceptance criteria (§7 AC-12).
  Fixed seed, fixed candidate answers, identical every rehearsal.
- **M3 — Sub-60-second core loop.** Spec B AC-7. The kill→verdict arc must complete in under 60s so
  the full demo (including tamper) fits the 3-minute window.
- **M4 — The recorded-run .mp4 fallback.** Spec B §9. Keep a ~90s screen capture of a successful run
  in the repo, labeled "last resort only." Cheap insurance; costs one rehearsal take.
- **M5 — `GET /api/state` aggregate endpoint.** Spec B §6. Spec A's six granular GETs are fine for
  drill-downs, but a single hydrate-everything call makes the WS→polling fallback trivial and makes
  page reload mid-demo survivable. Add it alongside Spec A's endpoints.

---

## 5. Amendments to the winning spec

- **A1 — Milestone gating (binding on architect and planner).** Build in this order; each milestone
  ends with a runnable, demoable system:
  - **M1 "Checkpoint parity"** = Spec B's entire acceptance list, at Sentinel's data model. One
    center live, 3 candidates, kill/restore, ledger, verdict, CLI verify. *If everything after this
    fails, we still have the runner-up and it still wins Round 1.*
  - **M2 "Fleet"** = 8 centers, live risk scores, per-center kill, incident row + auto-classification
    + severity, incident timeline.
  - **M3 "Trust"** = `/audit` verifier UI, PASS state, then the tamper path and FAIL-with-broken-link.
  - **M4 "Depth"** = drill-down routes, verdict reasoning breakdown, WS→poll degrade, Docker Compose.
  Do not begin a milestone until the previous one passes its acceptance criteria.
- **A2 — Tamper mechanism must not depend on the `sqlite3` CLI.** research.md line 8 confirms no
  `sqlite3` CLI is installed. Spec A §3 step 8 assumes one. Replace with an in-app, clearly-labeled
  **"Simulator: Tamper with ledger row"** control on `/audit` that performs a direct row UPDATE via
  `better-sqlite3`, bypassing the append-only API. Same drama, zero environment dependency, and it is
  arguably *more* convincing because the judge can click it themselves. Optionally keep an
  `npm run tamper` script as a second path. **The tamper control must be visually quarantined** in a
  red "SIMULATOR CONTROLS — not part of the production system" panel so no judge thinks the product
  ships with a tamper button.
- **A3 — 20-second framing element on `/`.** A persistent header: "MP State Recruitment Exam 2026 —
  Session 2 of 3 — 8 centers — 412 candidates live." A stranger must understand what they are looking
  at without narration. This is cheap and directly serves Presentation (5) and Problem Understanding (15).
- **A4 — Verdict must be policy-transparent.** Spec A AC-6 says "non-hardcoded." Strengthen: the
  verdict card must render the rule it applied (threshold, inputs, arithmetic), e.g. "frozen 47s >
  30s threshold AND 0 checkpoints lost → PARTIAL EXTENSION (+47s), not RE-CONDUCT. Cost avoided:
  412 candidates × re-conduct." The **re-conduct-cost-avoided number is required** — it is the
  cheapest 15 points (Governance Impact) on the board and problem.md §Why-PS06 already flags it.
- **A5 — Scalability written-answer hooks, built as code comments/architecture doc, not features.**
  Per research.md §3: chain sharded per center, SQLite→Postgres, simulator→real agent ingestion
  point. Explicitly do **not** build load-test theater.
- **A6 — Honesty labeling is a requirement, not polish.** Every simulated input surface carries a
  visible "simulated telemetry source — real agent plugs in here" label. research.md §3 is right that
  this *earns* Technical Feasibility (15) rather than costing anything.
- **A7 — Zero external network calls after `npm install`, enforced.** Both specs agree; making it
  explicit so no builder reaches for a CDN font, a map tile, or an icon service. Bundle everything.

---

## 6. Risk register for the architect

| Risk | Severity | Mitigation |
|---|---|---|
| `sqlite3` CLI absent, tamper demo breaks | High | Amendment A2 — in-app tamper control |
| Multi-center frozen-time bookkeeping bugs (clock restore off by seconds) | Medium | Single authoritative server-side clock; UI renders server-computed remaining time, never counts down independently. AC-5 requires visual confirmation. |
| WS reconnect flakiness mid-demo | Medium | Spec A §9 auto-degrade to 2s polling of `GET /api/state` (M5) |
| Scope creep past milestone M4 | Medium | Freeze rule + §8 cut list |
| Six routes confuse a stranger judge | Low | M1 — `/` is self-sufficient; drill-downs are optional |
| Judge asks "why not blockchain?" | Low | research.md §2 has the answer; it must appear in the architecture doc verbatim |

---

## 7. Authoritative acceptance criteria (the freeze surface)

Spec A §8 items 1–9, as amended. Restated for builders:

- **AC-1** Dashboard shows ≥6 centers with live-updating health/risk within 2s of simulator ticks.
- **AC-2** Kill Switch on any center turns it red and creates an Incident row (with auto-classification
  and severity) within 2s.
- **AC-3** All active sessions at that center transition to `frozen` and display the candidate status
  banner within 2s.
- **AC-4** ≥1 checkpoint exists per session prior to freeze and is visible with its hash in the UI.
- **AC-5** Reconnect transitions frozen sessions to `resumed` and restores remaining exam time
  (on-screen remaining time increases by the frozen duration at the moment of resume).
- **AC-6** Verdict is computed from real frozen-duration/affected-count data and renders its rule,
  inputs and arithmetic — including the re-conduct-cost-avoided figure (A4).
- **AC-7** `/audit` "Verify Chain Integrity" returns PASS on an untampered chain.
- **AC-8** After the in-app tamper control (A2) is used, "Verify Chain Integrity" returns FAIL and
  identifies the exact broken row with expected vs actual hash.
- **AC-9** Full kill→detect→freeze→checkpoint→reconnect→resume→verdict loop completes live, on one
  laptop, with networking disabled.
- **AC-10** (from M1) `/` alone supports the entire arc with no navigation except the `/audit` visit.
- **AC-11** (from M3) The core loop completes in under 60 seconds.
- **AC-12** (from M2) Simulator is deterministic-seeded and the whole scenario is resettable without
  restarting the server.
- **AC-13** (from A6) Every simulated input surface is visibly labeled as simulated.
- **AC-14** (from A7) No outbound network request occurs at runtime.

---

## 8. Cut list — in order, if behind schedule

Cut from the bottom. Each cut leaves a coherent demo.

1. `/incidents` list route and `/center/:id` detail route (keep `/incidents/:id` reachable from `/`).
2. Docker Compose wrapper (nice for repo-peeking judges; zero demo value).
3. Per-center risk **trend** sparklines — keep the scalar risk score.
4. `/session/:id` inspector route — the ledger panel on `/` already shows the chain.
5. Incident **classification taxonomy** — collapse to a single "Connectivity Loss / High" type.
6. Reduce centers from 8 to 6 (AC-1 floor). Do not go below 6.
7. Verdict **reasoning breakdown UI** — keep the decision label plus the three input numbers.
8. `/audit` verifier **UI** — fall back to `npm run verify-chain` + `npm run tamper` in a terminal.
   *(This is the last acceptable cut; it costs the best 30 seconds of the demo.)*

**Never cut** (these are the product): the kill switch, freeze, the hash-chained ledger, resume with
time restored, the computed verdict, and offline operation.

---

## 9. Disposition of the runner-up

Spec B is not discarded — it is absorbed as milestone M1 (A1) and as the source of merges M1–M5.
If the build stalls at milestone M1, ship Spec B's acceptance list and present it as Sentinel's core
loop. No re-decision is required in that case; this ruling pre-authorizes it.

---

## 10. Standing non-blocker note

decisions.md D6 already resolves this: the MPOnline "pre-written code" rules conflict and the
unregistered team are human/process blockers against *submitting at the October event*, not against
building a reference prototype now. This ruling does not change that status and does not authorize
anything beyond building the reference prototype.

**Next: ARCHITECTURE. next_agent = architect.**
