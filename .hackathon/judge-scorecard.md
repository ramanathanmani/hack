# JUDGE SCORECARD — Sentinel

Phase: SHOW · Agent: judge-simulator · Date: 2026-09-19
Posture: skeptical Round-1 judge, ~3 minutes at the team station, MPOnline Technical-track rubric.
Read: intake.md §4, pitch.md, demo.md, qa.md (all passes incl. `## debugger - P1 fixes`), review.md.

**TOTAL: 76 / 100** — shortlist: **yes, probably**, but not a lock for the finale.

| Criterion | Weight | Score | One-line reason |
|---|---|---|---|
| Innovation & Originality | 20 | **15** | Genuinely differentiated framing; mechanism itself is conventional, and there is no AI in an AI-themed event |
| Prototype / MVP | 20 | **16** | Really runs, 14/14 ACs verified over HTTP — but the rendered UI was never verified in a browser, once |
| Problem Understanding | 15 | **13** | Best category. Real operational insight, MPOnline's own vocabulary, no stakeholder contact |
| Technical Feasibility | 15 | **12** | Boring-on-purpose stack is a plus; 100% of input data is a simulator, ingestion seam is documented not demonstrated |
| Impact on HE / Governance | 15 | **10** | Verdict card is a real governance artifact; the money number is self-invented and the scale claim is arithmetic on 24 fake sessions |
| Scalability & Sustainability | 10 | **6** | Architectural assertion only. No load evidence, single-node SQLite, no live deployment |
| Presentation & Demo | 5 | **4** | Tight 60s script, deterministic, offline-safe — but nine landmines and no URL/video |

---

## Per-criterion detail

### Innovation & Originality — 15/20
**Evidence for:** the pitch's positioning is the strongest thing in the packet — treating exam-day
*infrastructure* as the integrity risk rather than building yet another proctoring/cheating detector
is a real differentiator in PS06's field. "Break it on stage, then tamper with the evidence and watch
it get caught" is a memorable, falsifiable claim, and the transparent verdict (rule + inputs +
arithmetic, no black box) is the most original component.

**Missing / skeptical read:**
- None of the three ingredients is new. SHA-256 hash chains, heartbeat detection and threshold rules
  are decades-old. The novelty is the *composition* and the framing, which is a defensible but
  softer claim than the pitch makes.
- The "policy engine" is `VERDICT_FREEZE_THRESHOLD_S` compared against an average. That is an `if`
  statement. Pitch §3/§4 calls it a policy engine three times; a technical judge will ask to see it
  and find one comparison. Honest, but it deflates the word.
- **No AI, at an event whose tagline and four of six problem statements are AI-centric.** PS06's own
  sub-asks include "AI analytics on systemic risk" and "early prediction of technical/operational
  failure" — Sentinel does neither. The prepared answer ("a decision you can audit beats a decision
  you can't explain") is good and I would accept it, but a co-judge who is scoring against the PS
  bullet list will dock this.

### Prototype / MVP — 16/20
**Evidence for:** this is a running product, and qa.md proves it rather than asserts it. The
qa-demo-path pass rebuilt from clean, ran the literal documented commands, and exercised
kill → missed-heartbeat detection → freeze → checkpoint → reconnect → resume → verdict → verify →
tamper → FAIL → reset over real HTTP/WS with timings (8ms `/api/state`, 13ms verify, 2s detect).
Detection is genuinely driven by the tick loop, not short-circuited by the kill handler — that was
specifically checked twice. The four review.md P1s were fixed by the debugger pass.

**Missing evidence:**
- **The rendered UI has never been looked at by anything — human or headless — in this repo's whole
  history.** No playwright/puppeteer; every UI claim is code-reading. qa.md flags this at frontend M1,
  integration M1, qa-demo-path and review.md ("mandatory, not optional"), and the debugger pass closes
  P1-1 (the frozen-clock contradiction) "by code/typecheck/build only". The single most demo-critical
  fix in the repo is unverified in a browser. If the dry-run has not happened by the time I watch,
  this is a 16 that could be a 10 live.
- 16/16 tests pass, but all 16 are pure functions (chain/clock/verdict). Nothing tests the loop the
  demo *is* (review.md test gap 1); `determinism.test.ts` was never written; nothing asserts the real
  tamper path returns the matching `brokenAt.rowId`.
- P1-3 was fixed by *briefing*, not code: "Reset Demo" still re-seeds the bare scenario. Press it
  once before a judge and the dashboard is blander than every rehearsal.

### Problem Understanding — 13/15
**Evidence for:** the strongest section. The failure mode is named correctly (router/UPS/leased line,
not cheating), the business outcome is quoted from MPOnline's own PS06 text, and the insight — "a
disruption is only expensive when it is unprovable" — is the kind of line that comes from thinking
about the operation rather than the brochure. Details that read as real: server owning the only clock,
per-center chain shard, candidate-facing honesty banner, incident *detected* rather than *declared*,
and choosing one vertical slice over twelve shallow sub-asks.

**Missing evidence:** no primary research anywhere in the packet. No exam controller, no center
coordinator, no MPOnline operations contact, no citation for how often re-conduct actually happens or
what it costs. Pitch §7 Day 7 is literally "sit with one real exam control room" — i.e. the validation
hasn't happened. Everything above is plausible inference, which is worth 13 and not 15.

### Technical Feasibility — 12/15
**Evidence for:** the architecture is the right kind of boring and the discipline is visible: one Node
process, Fastify + raw `ws` + better-sqlite3 + React, no ORM, no blockchain, no LLM, no cloud account,
no API key. `Math.random()` banned and grep-verified. `check:offline` gate proves zero external origins
in the bundle. The "better-sqlite3 is synchronous, which is why chain append ordering is correct
without locks" answer is a real engineering reason, not a slogan, and the blockchain rebuttal lands.

**Missing evidence:**
- Every byte of input is the simulator. The "documented ingestion seam" where a real center agent
  POSTs `telemetry_event` is a comment in an architecture doc — not one real client has ever posted to
  it. Pitch §7 Day 1–2 admits this is still to be written.
- No auth, no roles, no authorization at all, in a system whose entire value proposition is defensible
  evidence for a government exam body. "No auth for demo" is fine for a hackathon; the feasibility
  story needs a sentence on who is allowed to press Reconnect in production, and it doesn't have one.
- Tamper-evidence, not tamper-resistance: the ledger lives in the same SQLite file the server writes.
  An operator with disk access can rewrite the chain from row 1 and it verifies PASS. No anchoring, no
  external notarization, no append-only storage. This is the first question a security-minded judge
  asks and there is no prepared answer in pitch.md's Q&A table.
- Known-unfixed correctness bug on the demo path: P2-6 — the verdict uses cumulative `frozenMsTotal`,
  so a second incident on the same center double-counts. Mitigated by a demo rule ("never demo twice
  on the same center, never pick C4"), not by code.

### Impact on Higher Education / Governance — 10/15
**Evidence for:** the verdict card is a genuine governance artifact — a rendered rule, its inputs, its
arithmetic and a policy version, which is exactly the thing an RTI or a writ petition would demand.
The candidate-dispute story (per-session checkpoint history vs "the system was fine at our end") is
concrete. Labelling the cost figure "illustrative" on screen *and* out loud is the right call and I
credit it.

**Missing evidence:**
- ₹850 per candidate is an invented constant. There is no MPOnline cost basis, no procurement figure,
  no published re-conduct cost. The headline ₹17,850 is therefore 21 × an assumption.
- The scale extrapolation ("at fleet scale that arithmetic is the difference between re-running a
  statewide exam and extending a few hundred clocks") is asserted, never modelled. 24 simulated
  sessions is not evidence about a 200,000-candidate exam.
- No adoption path. Who at MPOnline owns this, what it replaces, what the integration with the
  existing exam delivery vendor looks like, what a pilot costs — none of it is written down. The
  seven-day plan is engineering tasks, not a deployment path into a state agency.
- Nothing on fairness edge cases that a governance reviewer cares about: a candidate whose center
  never recovers, a partial-extension that runs past the hall's booking, disputes about the threshold
  itself.

### Scalability & Sustainability — 6/10
**Evidence for:** per-center chain sharding is a real and correct architectural choice for parallel
verification. Hand-written SQL in one module genuinely does make SQLite → Postgres a contained change.
Zero external services / zero API keys / zero licences is a legitimate sustainability argument for a
state agency, and the team says plainly that they built no load-test theater, which I respect.

**Missing evidence:**
- Zero numbers. No benchmark, no row-count test, no concurrent-center test. "800 centers is the same
  code path with more rows" is exactly the claim that needs one measurement and doesn't have one —
  and a 10-minute seed-and-verify at 800 centers / 2400 sessions would have produced it.
- Single Node process + single SQLite file is a single point of failure for a product whose pitch is
  resilience. Nothing in the packet addresses HA, replication, or what happens when *Sentinel* is the
  thing that goes down on exam day. That irony will be raised.
- P2-5 is unfixed and bears directly on the scale claim: `recentCheckpoints` is capped at 50 rows
  fleet-wide, the `/audit` table is titled "Full Chain" when it isn't, and the PASS banner reports a
  client-side row count (will say 50 over a 100+ row chain). At 800 centers that panel is useless.
- **No deployment.** deploy.md is blocked on sandbox egress; there is no preview URL. The pitch's
  "6-command fix on an unrestricted network" is an untested estimate.

### Presentation & Demo — 4/5
**Evidence for:** demo.md is the most professional artifact in the set — a ~55–60s script inside a 90s
budget, verbatim lines, explicit narrator/driver split, a 180s extension, three-tier fallback ending in
curl against the same backend, and reset-between-judges steps. Number discipline is enforced in both
pitch.md and demo.md (the stale "412 candidates" is explicitly banned). Runs offline, so venue wifi
cannot kill it.

**Missing evidence / risk:**
- Nine landmines, several of which are "don't click this / don't wait too long / don't pick C4 / don't
  refresh". That is a demo carried by presenter discipline, and Round 1 is judged at a team station
  with interruptions.
- No shareable URL and **no recorded video fallback** (demo.md §5.4 says it was never produced). If the
  laptop dies there is nothing. For a 5% criterion this is cheap insurance that wasn't bought.
- Submission item 8 is "Prototype / Demo / Proof of Concept" as a *file*, ≤1 MB. A screen-recorded GIF
  or a compressed PDF of stills does not exist yet.

---

## Where pitch.md / demo.md oversell what qa.md and review.md actually verified

1. **"All 14 acceptance criteria pass … verified in qa.md"** (pitch §6, Prototype). True *at the HTTP
   level*. AC-3, AC-4, AC-10, AC-13 and the whole UI layer were verified by **code reading**, because
   no browser tooling exists in this environment. The pitch does not say this anywhere; qa.md says it
   four separate times. Do not let "verified" imply "seen".
2. **"16/16 unit tests passing"** used as prototype-completeness evidence. All 16 cover pure functions.
   review.md: "Nothing tests the loop the demo *is*." The strongest-sounding number in the pitch is the
   one least connected to the demo.
3. **"runs … identically every time (fixed PRNG seed)"** (pitch §5). Contradicted twice: the verdict
   depends on how long the presenter holds the freeze (demo.md landmine 3 — under 10s gives "No Action
   Needed"), and P1-3 means **Reset Demo does not restore the demo fixture** — it re-seeds the bare
   scenario without the 70 answer-saves or the backstory verdict. The real reset is `npm run seed` +
   reload. "Deterministic" is doing more work in the pitch than the build supports.
4. **"the ledger is sharded per center … 800 is the same code path"** (pitch §6, Scalability) is stated
   as a verified property. It is an unmeasured design claim, and P2-5's 50-row client cap is live
   counter-evidence that the current UI does not scale past a toy fleet.
5. **"Every simulated input carries a visible 'Simulated telemetry' badge"** (pitch §6) — code-verified
   only (AC-13), never seen rendered. Same class of risk as the frozen-clock bug that *was* real and
   that only a code-reviewer caught.
6. **"a 6-command fix on an unrestricted network"** (pitch §7 Day 6) — an estimate presented as a known
   quantity. Deployment has never succeeded in any environment.
7. **Header count drift.** pitch.md hard-codes "8 centers · 24 sessions" while demo.md §0 warns the
   incidents figure varies and tells the presenter to read the header before speaking. The two docs are
   reconciled, but only just — the pitch's confident numbers are the failure mode demo.md is defending
   against.
8. **"the only shape here where a judge can break the system on stage"** (pitch §6, Innovation) —
   unknowable competitive claim. Say "you can break it yourself" and let the judge draw the comparison.

---

## Would I shortlist it?

**Yes, with reservation.** Against the Round-1 field it clears the bar that matters: 40% of the rubric
is Innovation + working Prototype, and this is one of the few submissions where the thing on the laptop
does what the deck says. The kill→freeze→restore→verdict→tamper→FAIL loop is a complete, falsifiable,
60-second story, and the team's honesty discipline (labelled simulation, "illustrative" said out loud,
a candid seven-day plan) buys real credibility with a jury that has been lied to four times before
lunch.

**What keeps it off a 90:** the evidence chain behind the *claims* is thinner than the evidence chain
inside the product. No browser has ever rendered this UI. No real telemetry has ever entered it. No
number in the impact section traces to MPOnline. No deployment exists. On a rubric where Impact (15) +
Scalability (10) = 25 points are both scored on evidence the team chose not to gather, 76 is the
ceiling — and the delta to ~85 is mostly measurement, not building.

---

## Top 3 changes, in remaining time (all small, all cuts/fixes — no new features)

1. **Do the human browser dry-run. Now, once, before anything else.** ~10 minutes. It is the only
   unmitigated catastrophic risk in the packet: P1-1's frozen-clock fix, the tamper→FAIL row highlight,
   the POLLING pill and the "Simulated telemetry" badge are all code-verified only, and review.md calls
   this mandatory. Watch specifically: clock holds while frozen, `+Ns restored` chip appears, tampered
   row highlights once (not twice), badge visible. If it passes, delete the hedge from pitch §6; if it
   fails, you found it in rehearsal instead of in front of a judge.
2. **Capture a 60-second screen recording of the golden path and attach it as submission item 8.**
   ~10 minutes, and it does triple duty: it satisfies the mandatory "Prototype / Demo / Proof of
   Concept" file (≤1 MB), it becomes the missing laptop-dies fallback (demo.md §5.4 has none), and it
   is the browser-verification artifact from change 1. Highest value per minute in the whole list.
3. **Trim three oversold sentences so nothing in the pitch outruns qa.md.** ~5 minutes of edits:
   (a) qualify "all 14 ACs pass" with "backend verified live over HTTP; UI verified in a browser
   dry-run" (only after change 1); (b) drop "identically every time" or append "reset via `npm run
   seed`, not the Reset Demo button"; (c) downgrade "800 is the same code path" to "the sharding makes
   that a rows problem, not a rewrite — we haven't measured it." A skeptical judge who catches one
   overclaim discounts everything else you said; pre-conceding the three weakest claims costs almost
   nothing and converts the honesty posture from a slogan into a demonstrated habit.

*(Explicitly NOT recommended in the time remaining: adding AI/ML to answer the AI framing, fixing P2-5
or P2-6 in code, or attempting deployment. Each is a real improvement and each is a worse bet than the
three above.)*
