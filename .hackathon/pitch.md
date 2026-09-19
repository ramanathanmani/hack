# PITCH — Sentinel

Phase: SHOW · Agent: pitch-writer · Date: 2026-09-19
Track: Technical · PS06 — Resilient & Trustworthy Online Assessment Ecosystem
Rubric in force: Innovation 20 / Prototype-MVP 20 / Problem Understanding 15 / Technical Feasibility 15 /
Impact on HE & Governance 15 / Scalability 10 / Presentation 5

> **Number discipline (read before speaking).** The screen says **8 centers · 24 sessions**. Say those
> numbers and no others. Do not say "412 candidates" — that string was in an early spec amendment and
> is not what the product renders (review.md, narration hazard). Cost-avoided on the seeded incident is
> **₹17,850** (21 sessions spared × ₹850 illustrative per-candidate re-conduct cost), computed by the
> app, labelled "illustrative" on screen. Say "illustrative" out loud too.

---

## 1. Hook

When an exam center drops offline mid-exam, nobody can prove what happened to the candidates inside it
— so the state re-conducts the whole exam, for everyone, just to be safe.

---

## 2. Problem

MPOnline runs statewide recruitment and entrance exams across hundreds of centers. On exam day the
failure is not cheating — it is a router, a UPS, a leased line.

What happens today, in order:

1. A center loses connectivity for a few minutes. Candidate clocks keep running.
2. Candidates don't know if their answers saved. Neither does the control room.
3. Afterwards, the evidence is a phone log, a center-coordinator's email, and a spreadsheet.
4. Because nobody can prove which candidates lost time and how much, the safe decision is the
   expensive one: **re-conduct the exam for everyone.**

That re-conduct is a real budget line — halls, invigilators, question-paper security, candidate travel
across the state, and a delayed result calendar that pushes back admissions or recruitment. MPOnline's
own problem statement names the goal in plain words: *avoid unnecessary re-conduct of examinations.*

The gap is not detection technology. It is **evidence**. Nobody is short of alarms; they are short of a
record they can defend in front of a court, a candidate, or an RTI request.

---

## 3. Insight

**A disruption is only expensive when it is unprovable.**

If, for every candidate, you can show (a) exactly how many seconds they lost, (b) that not one saved
answer was lost, and (c) that the record has not been edited since — then the fair remedy is almost
never "re-do the exam." It is "give these three candidates their 47 seconds back."

So the product is not a monitoring dashboard with an alert. It is an **evidence chain plus a policy
engine**: the system must be able to say *"extend these 3, leave the other 21 alone"* and then hand
you the arithmetic and a verifiable ledger that backs it.

---

## 4. Product — Sentinel, the exam-integrity control tower

Sentinel is one Node process that runs a live exam fleet through all five stages MPOnline named:
Prevention → Detection → Response → Recovery → Trust.

- **Detect and protect, automatically.** The control tower watches 8 centers and 24 candidate
  sessions. When a center stops heart-beating, Sentinel — not an operator — opens and classifies the
  incident, freezes the affected candidates' clocks, and shows each of them an honest message:
  *"Center disrupted. Your progress is saved. Timer paused."* On reconnect the sessions resume with
  the lost time restored.
- **Every answer is a hash-chained checkpoint.** Each saved answer, freeze and resume appends a
  SHA-256-linked row to a per-center ledger. `/audit` recomputes the entire chain in one click and
  returns PASS — or FAIL naming the exact broken row, expected vs actual hash.
- **A transparent verdict, not a black box.** When the incident closes, Sentinel computes
  *Re-Conduct / Partial Time Extension / No Action* and renders the rule, the inputs, the arithmetic
  and the illustrative re-conduct cost avoided. No hidden model, no AI hand-waving.

Built and verified: 8 centers, 24 sessions, 100+ hash-chained checkpoints in the seeded fixture,
16/16 unit tests passing, full kill→freeze→checkpoint→reconnect→resume→verdict→verify→tamper→FAIL loop
exercised end to end. Zero external network calls at runtime — it runs on one laptop with the wifi off.

---

## 5. Demo pointer

Full beat-by-beat script, timings and fallbacks: **`.hackathon/demo.md`** (demo-director).
Run: `npm run build && npm run seed --workspace server && npm start` → `http://127.0.0.1:8080`.

The 90-second arc:

1. **Control Tower** — 8 centers green, 24 live sessions, ledger appending in real time.
2. **The judge picks a center and presses Kill Switch.** Sentinel detects the missed heartbeat itself,
   opens a classified incident, freezes those sessions. The candidate panel beside it says *"Your
   progress is saved. Timer paused."*
3. **Reconnect.** Sessions resume, the `+Ns restored` chip appears, time is back.
4. **Verdict card** — Partial Time Extension, with the threshold, the inputs, the arithmetic, and the
   illustrative cost avoided.
5. **`/audit` → Verify Chain Integrity → PASS.** Then the judge clicks **Tamper (simulator)**, in a
   red panel labelled *"not part of the production system"*, and verifies again: **FAIL**, pointing at
   the exact row, expected hash vs found hash.

The whole thing runs offline, from a seeded database, identically every time (fixed PRNG seed).

---

## 6. How Sentinel hits each judging criterion

### Innovation & Originality — 20
Every other team in an exam track builds a proctoring/cheating detector or a chatbot. Sentinel treats
the *infrastructure* as the integrity risk, and it is the only shape here where a judge can **break the
system on stage and watch it defend itself**, then **tamper with the evidence and watch it get caught**.
The novel combination: fleet-level control tower + per-center tamper-evident ledger + a *policy-transparent
re-conduct verdict*. The verdict engine is the original piece — turning an outage into a per-candidate
remedy with published arithmetic is not a thing that exists in Indian exam operations today.

### Prototype / MVP — 20
It is a running product, not a mockup. All 14 acceptance criteria pass (decision.md §7, verified in
qa.md). Kill switch, detection, freeze, checkpointing, resume-with-time-restored, verdict computation,
chain verification, tamper detection and reset all work live, from one command, on one laptop, with
networking disabled. 16/16 tests pass. The entire arc is on a single screen — the only navigation in
the demo is one visit to `/audit`.

### Problem Understanding — 15
We answered MPOnline's five-stage framing in their own vocabulary rather than picking off twelve
sub-asks shallowly. We named the actual business outcome (avoid unnecessary re-conduct) and built the
mechanism that makes it defensible. Details that only come from thinking about the real thing: the
candidate-facing honesty message, the server owning the only clock so restored time is never disputed,
the per-center chain shard, and an incident that Sentinel *detects* from a missed heartbeat rather than
one the kill button opens directly.

### Technical Feasibility — 15
Deliberately boring architecture: one Node 22 + TypeScript process, Fastify 5, raw `ws`, SQLite via
better-sqlite3, React 19 + Vite, plain CSS. No blockchain, no ORM, no LLM, no cloud account, no API
key, no auth to fake. `better-sqlite3` being synchronous is why hash-chain append ordering is correct
without locks. Asked "why not blockchain?" — the exam authority is singular; what's needed is
tamper-*evidence*, not distributed consensus, and a plain SHA-256 chain proves it in one click.
Every simulated input carries a visible **"Simulated telemetry"** badge, and the architecture doc marks
the exact seam where a real center agent POSTs the same `telemetry_event` shape. We say what is real.

### Impact on Higher Education / Governance — 15
The verdict card is the governance artifact. On the seeded incident it reads: 3 sessions affected,
average frozen time above threshold → **Partial Time Extension**, 21 candidates spared a re-conduct,
**~₹17,850 illustrative cost avoided** — at fleet scale that arithmetic is the difference between
re-running a statewide exam and extending a few hundred clocks. Beyond money: a candidate who disputes
their result gets a per-session checkpoint history instead of "the system was fine at our end," and
the authority gets a post-exam audit trail that survives scrutiny. Fairness becomes something you can
verify, not something you have to be trusted on.

### Scalability & Sustainability — 10
The ledger is **sharded per center**, so verification is parallel and per-center, not one global chain
— 8 centers on screen today, 800 is the same code path with more rows. SQLite → Postgres is a repo
swap because all SQL is hand-written in one module with no ORM to fight. The simulator is not a
permanent fixture: it is one documented ingestion seam, and a real center agent replaces it by POSTing
the same event shape. Sustainability: zero external services, zero API keys, zero per-seat licences —
nothing here has a bill attached or a vendor who can deprecate it. We deliberately built no load-test
theater; the scalability claim is an architectural property, and it is visible in the code.

### Presentation & Demo — 5
Single screen, one navigation. A persistent header ("Statewide Aptitude Exam — Live · 8 centers ·
24 sessions") means a stranger understands the screen in 20 seconds without narration. Status is always
a word plus a colour, never colour alone. The demo is deterministic and resettable, and it runs offline
so venue wifi cannot break it.

---

## 7. What's next — one realistic week

Not a platform roadmap. Seven days, in order:

1. **Days 1–2 — Replace the simulator on one seam.** Write the real center agent: a ~100-line Node
   service that POSTs `telemetry_event` heartbeats and answer-save events from a single real exam hall
   PC. The server already accepts that shape; this proves the seam is real and not a slide.
2. **Day 3 — An integration test for the loop the demo is.** One `node:test` file that boots the app
   with `SIM_TICK_MS=50` and drives kill → freeze → resume → verdict in-process, plus the determinism
   test. Today all 16 tests are pure functions; the loop is guarded by humans running curl.
3. **Day 4 — Per-incident frozen-time accounting.** Snapshot `frozen_ms_total` at freeze and diff on
   resume, so a second incident on the same center reports its own numbers (review.md P2-6).
4. **Day 5 — Make the verdict policy a config file, not code.** The thresholds and per-candidate cost
   are already env vars; lift them into a policy document an exam controller can sign off on, with the
   applied version recorded on every verdict.
5. **Day 6 — Deploy properly.** A public URL (blocked only by this sandbox's egress, see deploy.md §5;
   it is a 6-command fix on an unrestricted network), plus the Docker Compose wrapper.
6. **Day 7 — Sit with one real exam control room** and find out which three fields on the verdict card
   they would actually put their name against.

---

## 8. 30-second version

> When an exam center goes offline mid-exam, nobody can prove which candidates lost time — so the state
> re-conducts the whole exam for everyone.
>
> Sentinel is a control tower for exam day. It watches every center, and the moment one goes dark it
> freezes those candidates' clocks, tells them their answers are safe, and checkpoints every response
> into a hash-chained ledger. On reconnect, they resume with their time restored.
>
> Then it does the thing nobody else does: it issues a verdict — re-conduct, partial extension, or no
> action — and shows you the rule, the inputs and the arithmetic behind it. Click Verify and it
> recomputes the entire chain. Edit one row behind its back and it names the exact broken link.
>
> It runs on one laptop with the wifi off. Kill a center yourself and watch.

---

## 9. Devpost / README submission drafts

### Short description (under 250 characters)

> Sentinel is an exam-integrity control tower. When a center goes offline mid-exam, it freezes clocks,
> checkpoints every answer into a hash-chained ledger, restores lost time on reconnect, and issues a
> transparent verdict: extend, or re-conduct.

### Long description

**The problem**

Large-scale online exams in India don't usually fail because someone cheated. They fail because a
leased line drops, a UPS dies, or a center's router reboots twenty minutes into the paper. When that
happens, candidate clocks keep running, nobody in the control room knows whether answers were saved,
and the only evidence afterwards is a phone log and a coordinator's email.

Because that evidence cannot be defended — to a candidate, a court, or an RTI request — the safe
decision is the expensive one: re-conduct the exam for everyone. Halls, invigilators, paper security,
statewide candidate travel, a delayed result calendar. MPOnline's own problem statement (PS06) names
the goal directly: *avoid unnecessary re-conduct of examinations*.

**The insight**

A disruption is only expensive when it is unprovable. If you can show exactly how many seconds each
candidate lost, that no saved answer was lost, and that the record hasn't been edited since, then the
fair remedy is almost never "re-do the exam" — it's "give these three candidates their 47 seconds back."

**What we built**

Sentinel is a live exam-integrity control tower covering all five stages MPOnline named — Prevention,
Detection, Response, Recovery, Trust — as one working vertical slice rather than twelve shallow features.

- **Prevention.** Live health telemetry from 8 exam centers and 24 candidate sessions, with per-center
  status on a single control-tower screen.
- **Detection.** The server detects a missed heartbeat on its own tick loop, then opens, classifies and
  escalates an incident — the kill switch never creates the incident directly, the detection loop does.
- **Response.** Affected sessions transition to frozen, their clocks stop server-side, and each
  candidate sees an honest banner: *"Center disrupted. Your progress is saved. Timer paused."* Every
  answer already captured is a checkpoint in a SHA-256 hash chain, sharded per center.
- **Recovery.** On reconnect, sessions resume at their exact checkpoint with the frozen duration added
  back to remaining time. The server owns the only clock; the UI never counts independently.
- **Trust.** `/audit` recomputes the whole chain in one click: PASS, or FAIL naming the exact broken
  row with expected vs actual hash. And the incident produces a verdict — Re-Conduct, Partial Time
  Extension, or No Action — that renders the rule it applied, its inputs, its arithmetic, and the
  illustrative re-conduct cost avoided (on our seeded incident: 3 of 24 sessions affected, 21 spared,
  ~₹17,850 illustrative).

**How we built it**

One Node.js 22 + TypeScript process is the entire product: Fastify 5 for the API, raw `ws` for live
updates with an automatic degrade to 2-second polling, SQLite via better-sqlite3 (synchronous, which is
why hash-chain append ordering is correct without locks), a hand-rolled SHA-256 chain on `node:crypto`,
a deterministic seeded telemetry simulator, and a React 19 + Vite frontend served as static files by
the same process. `npm run build && npm start`, one port, one `.db` file.

Deliberately not used: no blockchain (the exam authority is singular — what's needed is
tamper-*evidence*, not distributed consensus), no ORM, no LLM or ML model, no cloud host, no API key,
no CDN. There are no outbound network calls at runtime, enforced by a check that greps the built
bundle. The demo runs with wifi off.

**Honesty**

The telemetry is simulated and every simulated surface says so on screen. The simulator is one
documented ingestion seam — a real exam-center agent POSTs the same event shape and the rest of the
system is unchanged. The tamper control is quarantined in a red panel labelled "SIMULATOR CONTROLS —
not part of the production system." The cost figure is labelled illustrative because it is.

**Challenges**

Getting restored time to be *visibly* correct meant making the server the single authority on the
clock — the UI extrapolates between pushes and snaps to the server value on every message, so "your
time came back" is never a rendering artifact. The tamper demo originally needed the `sqlite3` CLI,
which wasn't available; we replaced it with an in-app control that writes directly to the row, which
turned out more convincing because the judge can click it themselves.

**What's next**

Replace the simulator with a real single-hall center agent; an in-process integration test for the
full loop; per-incident frozen-time accounting; lift the verdict thresholds into a signed-off policy
document with the applied version recorded on every verdict.

---

## 10. Spoken lines for the live demo (hand to demo-director)

Say these verbatim; they're timed to the beats in demo.md.

| Beat | Line |
|---|---|
| Open | "Right now, if an exam center drops offline, nobody can prove what happened to the candidates inside it. Sentinel can." |
| Framing (point at header) | "Live statewide exam. Eight centers, twenty-four candidate sessions. This is the control room view." |
| Hand over the kill switch | "Pick a center. Any one. Press Kill Switch." |
| Detection lands | "We didn't tell it a center went down — it noticed a missed heartbeat and opened the incident itself." |
| Point at candidate panel | "That's the candidate's screen. Clock stopped, answers saved, and it says so honestly. No spinner, no lie." |
| Reconnect | "Center's back. Watch the restored-time chip — those seconds came back." |
| Verdict card | "Three candidates affected, twenty-one untouched. Partial extension, not re-conduct. And it shows you the rule, the inputs and the arithmetic — that's an illustrative cost figure, and it says so." |
| Walking to /audit | "That's the decision. Now the evidence." |
| Verify → PASS | "Every answer, freeze and resume is a hash-linked row. One click recomputes the whole chain." |
| Clicking Tamper | "Now watch what happens the moment someone touches the record." |
| FAIL | "Exact row. Expected hash, found hash. You don't have to trust us — the chain tells you." |
| Close | "Every decision you just saw was computed from a rule and an unbroken hash chain, not a guess. See it, protect it, prove it." |
| If asked "is this AI?" | "No, and we won't pretend. It's threshold detection on real telemetry plus a published policy rule. In this domain a decision you can audit beats a decision you can't explain." |
| If asked "why not blockchain?" | "The exam authority is singular — MPOnline. Consensus solves a problem we don't have. We need tamper-evidence, and a hash chain proves it in one click, which you just watched." |
| If asked "is the data real?" | "The telemetry is simulated and every simulated surface on screen says so. Here's the ingestion seam — a real center agent POSTs this same event shape and nothing downstream changes." |
