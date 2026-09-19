# SUBMIT — Sentinel packaging kit

Phase: SUBMIT · Agent: readme-submit · Date: 2026-09-19
Reads: `intake.md` §5 (10-item submission kit), `pitch.md`, `demo.md`, `brand.md`, `copy.md`,
`architecture.md`, `deploy.md`, `qa.md`, `judge-scorecard.md`, `STATE.md`, `git.md`.

No new features. This file only maps what already exists in the repo to what MPOnline's portal
asks for, and drafts the Devpost-style text fields from content other agents already wrote.

---

## 1. Checklist — intake.md's 10 required items vs. what exists in this repo

| # | Required item | Status | What exists |
|---|---|---|---|
| 1 | Solution Synopsis / Executive Summary (file, mandatory) | **EXISTS** | `.hackathon/submission/01-solution-synopsis.md` — synthesized from `pitch.md` §1–3 and §8, not new claims. |
| 2 | Solution Presentation, PDF (file, mandatory) | **EXISTS** | `.hackathon/submission/02-solution-presentation.pdf` — an 8-slide deck (cover + 7 content slides) built with reportlab from `pitch.md`'s content, ~10 KB, well under the 1 MB cap. Verified as a structurally valid PDF (correct header, 8 page objects); not pixel-rendered/eyeballed in this pass — recommend a quick human open-and-look before upload. |
| 3 | Problem Statement & Proposed Solution (file, mandatory) | **EXISTS** | `.hackathon/submission/03-problem-statement-and-solution.md` — synthesized from `problem.md` and `pitch.md` §2–4. |
| 4 | Innovation & Differentiation Note (file, mandatory) | **EXISTS** | `.hackathon/submission/04-innovation-differentiation.md` — includes the honest "no AI" limitation from `pitch.md`/`judge-scorecard.md`, not softened. |
| 5 | Impact & Benefits Document (file, mandatory) | **EXISTS** | `.hackathon/submission/05-impact-benefits.md` — states plainly that the ₹850/candidate figure is an invented illustrative constant, per `judge-scorecard.md`'s finding; does not present ₹17,850 as a sourced number. |
| 6 | Implementation / Feasibility Plan (file, mandatory) | **EXISTS** | `.hackathon/submission/06-implementation-feasibility-plan.md` — synthesized from `plan.md` and `pitch.md` §7, with the same risk caveats carried forward. |
| 7 | Technology Architecture / Technical Approach (file, **required for Technical track**) | **EXISTS** | `.hackathon/architecture.md` (full design: data model, API, folder map, SQL schema, hash rule, risks, scalability answer) and its submission-facing copy at `docs/architecture.md`. Real content, ready to attach — confirm it is under the 1 MB cap before upload (it is markdown text; well under). |
| 8 | Prototype / Demo / Proof of Concept (file, mandatory) | **EXISTS** | `demo/sentinel-golden-path.webm` — a real Playwright screen recording of the actual running product (kill → freeze → reconnect → partial-extension verdict → `/audit` → verify PASS → tamper → verify FAIL), compressed to ~330 KB (VP8/WebM), under the 1 MB cap. Note: format is WebM, not MP4, because no libx264/MP4 encoder was available in the build sandbox (see `qa.md` "fallback demo video"); convert to MP4 if the portal strictly requires it. |
| 9 | Code Repository URL (URL field, **required for Technical track**) | **EXISTS** | `https://github.com/ramanathanmani/hack`, branch `main`. Confirmed pushed and `HEAD == origin/main` in `.hackathon/git.md`. |
| 10 | "Why Should This Solution Be Selected?" (free-text area, mandatory) | **DRAFTED BELOW** | No prior agent wrote this exact field. Draft text in §3 below, assembled from `pitch.md`'s existing claims — review before pasting into the portal, especially the caveats judge-scorecard.md raised (see §4). |

**Update: items 1–6 have now been exported as standalone files under `.hackathon/submission/`**
(done after this checklist was first written — content was synthesized from existing
pitch.md/problem.md/plan.md prose, no new claims invented; the PDF is a plain reportlab slide
export, not designed by a human). **Bottom line: items 1–9 are all ready to submit as-is.**
**Item 10** is drafted below and just needs a human read-through before pasting into the portal
(it carries the same "illustrative cost figure" and "no AI" caveats the rest of this kit discloses,
per §4 below). Two remaining honest gaps outside this checklist's 10 items: no live preview URL
(sandbox network limit, see deploy.md) and no human eyeballing of the PDF's actual rendered layout
(only structurally validated — 8 valid page objects, correct header — not visually reviewed).

### STATE.md status

Per `.hackathon/STATE.md`, `phase: DEPLOY (blocked)`, `status: blocked` — the blocker is the
missing shareable preview URL (sandbox egress restriction on port 7844, not a product defect; see
`deploy.md` §4–5 for exact evidence and the human fix). That blocker is unrelated to and does not
block this SUBMIT packaging pass. Because six of the ten mandatory submission **files** (items
1–6) do not yet exist as discrete artifacts, **this SUBMIT pass cannot declare the submission kit
complete** — see recommendation below.

**Recommendation to conductor:** set `STATE.md` `status: blocked` with the missing item being the
six un-exported document files (items 1, 2, 3, 4, 5, 6 above) required by the MPOnline portal,
distinct from and in addition to the pre-existing DEPLOY blocker. The underlying content for all
six exists in this repo (`pitch.md`, `problem.md`, `plan.md`); what's missing is turning that
markdown content into the discrete files/PDF the portal's upload form requires.

---

## 2. Devpost-style fields

### Project name
**Sentinel**

### Tagline (one line)
Real-time exam integrity with transparent fairness verdicts.

*(Alternate/longer, from brand.md: "The control tower that keeps exams fair, transparent, and
trustworthy." Brand's 3-word mark: **"See. Protect. Prove."**)*

### Short description (Devpost "elevator pitch", from pitch.md §9, under 250 characters)
> Sentinel is an exam-integrity control tower. When a center goes offline mid-exam, it freezes
> clocks, checkpoints every answer into a hash-chained ledger, restores lost time on reconnect, and
> issues a transparent verdict: extend, or re-conduct.

### Built With (tags)
`typescript` `nodejs` `fastify` `websocket` `sqlite` `better-sqlite3` `react` `vite` `sha-256`
`hash-chain` `npm-workspaces`

*(Deliberately not tagged: `ai`, `machine-learning`, `blockchain` — none of these are used; see
`architecture.md` §2 hard bans. Tagging them would be false advertising judge-scorecard.md already
warns against.)*

### Links
- **Code Repository:** https://github.com/ramanathanmani/hack (branch `main`)
- **Live/Preview URL:** none. Local-only, fully verified: `npm run build && npm start` →
  `http://127.0.0.1:8080` (see README "Quick start"). Deploy blocker documented in `deploy.md`;
  `STATE.md preview_url` is explicitly marked `BLOCKED:`, not fabricated.
- **Demo video (submission file):** `demo/sentinel-golden-path.webm`
- **Full pitch / long description source:** `.hackathon/pitch.md` §9 (long-form Devpost-style
  description, already written — problem / insight / what we built / how we built it / honesty /
  challenges / what's next, ready to paste into Devpost's "Story" field verbatim)

### Long description
Use `.hackathon/pitch.md` §9 verbatim — it is already written in Devpost "Story" format (The
problem / The insight / What we built / How we built it / Honesty / Challenges / What's next). Not
duplicated here to avoid two owners of the same prose; edit `pitch.md`, not a copy, if it changes.

---

## 3. Draft: "Why Should This Solution Be Selected?" (submission item 10)

> Because it is the only submission in this track where the product's central claim is something a
> judge can personally break and watch defend itself. Kill any exam center on stage — Sentinel
> detects the outage itself from a missed heartbeat, freezes the affected candidates' clocks
> honestly ("your progress is saved, timer paused"), and checkpoints every answer into a
> SHA-256 hash chain. Reconnect it, and the lost time comes back — verifiably, because the server
> is the only clock in the system, never the browser. Then Sentinel does the thing no proctoring
> dashboard does: it renders a verdict — Re-Conduct, Partial Time Extension, or No Action — with
> the exact rule, inputs and arithmetic that produced it, and a "click Verify, then tamper with a
> record, then watch it get caught" trust demonstration on `/audit`.
>
> MPOnline's own problem statement names the goal in one line: avoid unnecessary re-conduct of
> exams. Sentinel's insight is that a disruption is only expensive when it is unprovable — so
> instead of building another cheating detector, we built the evidence chain that lets an exam
> authority answer "which candidates actually lost time, and by how much" with a number it can
> defend to a candidate, a court, or an RTI request. It runs as one boring, auditable Node process —
> no blockchain, no ORM, no LLM, no cloud account, no API key — on one laptop with the wifi off, and
> every simulated surface says so on screen. It is not a slide; `npm run build && npm start` and a
> kill switch prove it.

**Caveats to keep in mind before using this text as-is** (from `judge-scorecard.md`, so the claim
survives a skeptical judge rather than being caught overselling):
- Do not claim "identically every time" — the verdict depends on how long the presenter holds the
  freeze, and `Reset Demo`'s exact current behavior should be re-checked against `review.md` P1-3 /
  the debugger fix before repeating that claim live.
- The ₹17,850 cost-avoided figure is arithmetic on an invented ₹850/candidate constant, not a
  sourced MPOnline number — say "illustrative" every time it comes up, on screen and out loud.
- There is no AI/ML in this product, at an AI-themed event — the honest answer ("a decision you can
  audit beats a decision you can't explain") is prepared in `pitch.md` §10 if asked.
- "800 centers is the same code path" is an architectural claim, not a benchmarked one.

---

## 4. What is still missing (do not paper over)

1. **Submission items 1–6 (six mandatory files)** have real underlying content in this repo but
   have never been exported into the discrete document/PDF artifacts MPOnline's portal form
   requires. This is the single biggest outstanding gap for actually completing submission.
2. **No live/shareable preview URL.** `deploy.md` documents this as a sandbox egress restriction
   (outbound TCP/UDP port 7844 to Cloudflare's edge blocked), not a product defect, with an exact
   6-command fix for a human on an unrestricted network. `STATE.md` correctly marks this `BLOCKED`
   rather than fabricating a URL.
3. **The prototype/demo file is WebM, not MP4.** `demo/sentinel-golden-path.webm` plays natively in
   modern browsers but may need re-encoding to MP4 if the MPOnline portal enforces that format —
   no MP4 encoder was available in this build sandbox (`qa.md` "fallback demo video").
4. **No human dry-run has happened since the one automated browser-dry-run pass** recorded in
   `qa.md`/`.hackathon/screenshots/`. That pass closed the "never rendered in a browser" risk once,
   but a live human rehearsal before the real event is still recommended (`judge-scorecard.md`
   top-3 changes, item 1).
5. **No primary research / MPOnline stakeholder contact exists.** `judge-scorecard.md` and
   `pitch.md` §7 both note this: the impact numbers (₹850/candidate, "at fleet scale...") are
   plausible inference, not validated data. Any executive summary or impact document written from
   item 5 above must carry this same "illustrative" disclosure, not present it as sourced.
6. **Registration/eligibility items outside this repo's control** (per `STATE.md` blockers): no
   registered 2–4 person human team aged 16–25, registration fee/deadline unknown, and the
   FAQ-vs-agenda "pre-built project" rules conflict (`intake.md` §9) is unresolved with organizers.
   These block *competing*, not this packaging pass, but they belong in this list because SUBMIT
   cannot make them go away.

---

## 5. File-size check (intake.md's 1 MB-per-file cap)

| File | Approx. size | Under 1 MB? |
|---|---|---|
| `demo/sentinel-golden-path.webm` | ~330 KB (per `qa.md` "fallback demo video") | Yes |
| `.hackathon/architecture.md` / `docs/architecture.md` | plain markdown text, well under 1 MB | Yes |
| Items 1–6 (not yet produced) | N/A — cannot be checked until they are exported as files | N/A |

No large binary assets, screenshots bundles, or video other than the one above are tracked in git
(`.gitignore` excludes `*.mp4`/DB files; `.hackathon/screenshots/` PNGs are dev-time QA artifacts,
not submission items, and should be checked individually if ever attached).
