# Decision Log — MPOnline Idea & Innovation Hackathon 2026

### 2026-09-19 — D1: Retargeted the factory from IBM Bob 2.0 to MPOnline Hackathon 2026
- Decision: Archive the previous (blocked, pre-event) IBM Bob 2.0 run to
  `.hackathon/archive-ibm-bob2/` and restart the pipeline at INTAKE against
  https://innovate.mponline.gov.in/.
- Why: User redirected. The prior run was blocked on a sponsor tool that is inaccessible until its own
  kickoff; the new target has fully published rules, so it is actionable now.
- Rejected: running both pipelines in parallel — two targets, one artifact set, guaranteed state corruption.

### 2026-09-19 — D2: Intake sourced from the SPA JS bundle, not the rendered page
- Decision: Treat facts extracted from `/assets/index-BElPBd_m.js` as CONFIRMED.
- Why: The site is a client-rendered React app; a plain HTTP fetch returns only `<title>`. The bundle
  carries the literal copy for themes, guidelines, rubric tables, agenda, FAQ and all six challenge pages,
  so it is the primary source, not a secondary one.
- Follow-up: re-verify the deadline and fee against the live registration flow before submission.

### 2026-09-19 — D3: Compete on the Technical track
- Decision: Target the Technical rubric (Innovation 20 / Prototype 20 / Problem 15 / Feasibility 15 /
  Impact 15 / Scalability 10 / Presentation 5) and the Technical prize pool (1st ₹1,00,000).
- Why: Prototype + Innovation is 40% of the technical score and a working system is this factory's
  strength. Presentation is only 5%, so slide-polish arbitrage does not exist here.
- Consequence: submission items 7 (Technology Architecture) and 9 (Code Repository URL) become mandatory.

### 2026-09-19 — D4: Chose PS06 — Resilient & Trustworthy Online Assessment Ecosystem
- Decision: Build a live exam-integrity control tower implementing one vertical slice of the organizers'
  own Prevention → Detection → Response → Recovery → Trust lifecycle. Details and scope fence in problem.md.
- Why: Highest demo-wow (a judge can break an exam live and watch it be saved), highest originality
  headroom (least crowded of the six), and it targets MPOnline's actual operational cost — avoiding exam
  re-conduct — which buys the 15% governance-impact criterion honestly.
- Rejected: PS01 and PS05 (both collapse into the default resume-bot / grievance-bot that many teams will
  submit; originality is 20%); PS02 (an ERP is unbuildable in the real build window); PS03 and PS04 held
  as fallbacks #2 and #3.

### 2026-09-19 — D5: Pipeline HELD before BUILD, status=blocked, pending an organizer ruling
- Decision: Do not write application code. Stop after PROBLEM and hold.
- Why: Two hard reasons.
  (a) **Rules conflict.** The FAQ states the project, code, design, idea and content "must be created
      during the hackathon duration" and that previously built projects are ineligible — while the agenda
      references mentors reviewing "premade presentations/solutions". Building the repo now is a
      disqualification risk that no amount of build speed compensates for.
  (b) **The event is 20 days away** (09–10 Oct 2026) and is strictly in-person in Bhopal, with a
      registered team of 2–4 humans aged 16–25. There is no submission surface open to this session today.
- Rejected: building the prototype now "just in case" — it converts a 20%-weighted Prototype score into a
  disqualification coin-flip, and violates the conductor rule against proceeding past a known blocker.
- Follow-up / unblock conditions, in order:
  1. Human emails hackathon@mponline.gov.in asking, verbatim: may teams bring pre-written source code, or
     must the repository be started at 10:30 on 09 October? Also ask for the registration close date, the
     submission-lock deadline with timezone, and the registration fee.
  2. Human confirms a registered 2–4 member team.
  3. On answer: if pre-build is allowed → resume at RESEARCH → SPEC immediately, ~20 days is a luxury
     budget. If not allowed → the pre-event work is limited to research, problem framing, architecture on
     paper, and the six non-code narrative documents; BUILD starts 09 Oct 10:30 and must hit a working
     detect→recover loop by 13:30.

### 2026-09-19 — Proceed to BUILD despite unresolved human/process blockers
- Decision: User explicitly authorized proceeding through SPEC → BUILD → DEPLOY now, in full autonomous mode, without waiting for MPOnline's answer on the pre-build eligibility question or for team registration. Pipeline status changed from blocked to in_progress.
- Why: These two blockers require actions this session cannot take (emailing organizers, registering a human team) and the event is 20 days out. Building a working reference prototype now is reversible risk (it can be rebuilt live on 09 Oct if organizers require it) and is explicitly what the user asked for.
- Rejected alternatives: Continuing to hold the pipeline at status=blocked indefinitely — rejected per direct user instruction to stop asking permission and ship a working product.
- Follow-up: Before the real event, the user must still email hackathon@mponline.gov.in to confirm pre-built code is allowed, and must register a 2-4 person team. These remain open items tracked in STATE.md blockers, informational only.

### 2026-09-19 14:00 — D6: Spec A "Sentinel" wins DECISION phase with 4 binding amendments
- Decision: Spec A "Sentinel" defeats Spec B "Checkpoint" (9/10 vs 6/10 on weighted rubric). Architect and builders implement Spec A only, with amendments A1 (milestone gating), A2 (in-app tamper control), A3 (framing header), A4 (policy-transparent verdict), A5–A7 (scalability hooks, honesty labels, zero external calls), and merged discipline from runner-up (single-screen primary view, deterministic simulator, <60s core loop, recorded fallback, aggregate state endpoint).
- Why: Full-session build window (vs 3h Round-1) inverts the spec-author's weights: Spec A's 40% Prototype+Innovation coverage + policy-transparent governance verdict aligns with MPOnline's true operational cost (avoiding re-conduct). Spec B's safety net becomes milestone M1; no re-decision if build stalls there. Tamper-and-catch demo is the single highest-leverage 30s (removes trust from equation).
- Rejected alternatives: Spec B "Checkpoint" (correct but modest, leaves rubric points on table; its discipline merged in as M1–M5). Equal weighting (spec-author used 3h clock; standing assumption reverses that).
- Follow-up: Architect defines 4 milestones (A1) and ensures each milestone is demoable + runneable. Builders implement AC-1 through AC-14 (freeze surface in decision.md §7). Freeze rule enforced: no new features past §8 cut list. Next agent: architect.

### 2026-09-19 — D7: Close INTAKE → FREEZE pipeline; all 10 submission-kit items complete; one disclosed limitation retained
- Decision: SUBMIT phase is complete. All 10 required submission items per intake.md §5 now exist: items 1–6 exported as discrete markdown files + PDF; items 7–9 (architecture doc, demo video, repo URL) already complete; item 10 drafted and reviewed. Full pipeline executed INTAKE → PROBLEM → RESEARCH → SPEC → DECISION → ARCHITECTURE → PLAN → DESIGN → BUILD → INTEGRATE → TEST → HARDEN → GIT → DEPLOY → SHOW → SUBMIT. FREEZE is next; no further code or content changes. This is a pre-event reference prototype; real competition is 09–10 October 2026 in Bhopal.
- Why: Feature-complete per spec-a.md and D6 amendment list. All major gates (BUILD, INTEGRATE, TEST, HARDEN, GIT, SUBMIT phases) passed with no P0 defects. One disclosed limitation remains: DEPLOY has no shareable preview URL due to sandbox egress restriction (outbound TCP/UDP port 7844 to Cloudflare blocked), documented in deploy.md §4–5 with exact 6-command fix for unrestricted networks. This is environmental, not product defect; local run (npm run build && npm start → http://127.0.0.1:8080) fully verified and re-verified in this session.
- Rejected alternatives: Continue iterating after SUBMIT — rejected per conductor rule D5 follow-up and full pipeline architecture calling for FREEZE after SUBMIT.
- Follow-up: pm-timebox and scribe to execute FREEZE phase. Before real event (20 days), user must email hackathon@mponline.gov.in confirming pre-built code is allowed and register a 2–4 person team (open blockers per STATE.md §blockers, not blocking this closure).

### 2026-09-20 — D8: DEPLOY unblocked — live on Vercel via MCP Sandbox, real bug found and fixed
- Decision: User asked to deploy via the Vercel MCP instead of Cloudflare. Deployed Sentinel to a Vercel Sandbox (not a serverless Function, since the app is a stateful single process with WebSocket + SQLite persistence) at https://sb-7l06rm86jh7b.vercel.run. Full golden path re-verified live against this exact public URL (kill/detect/freeze/reconnect/verdict, tamper/verify/reset), and the UI verified in a real headless-Chromium pass.
- Why: This surfaced a real bug the local sandbox never exposed: better-sqlite3's compiled native addon crashed at boot on the Vercel Sandbox's Node v24.21.0 build with a native cleanup-hook assertion failure -- a genuine ABI mismatch, exactly the risk architecture.md's connection.ts comment had pre-flagged with node:sqlite named as the fallback. Implemented that fallback for real: connection.ts now wraps node:sqlite's DatabaseSync behind the same prepare()/pragma()/transaction()/close() shape, so repo.ts and migrate.ts needed only a one-line type-import change each. Verified locally (typecheck, build, 16/16 tests, live kill->verify run) before redeploying, then reverified against the live public URL.
- Rejected alternatives: Retrying better-sqlite3 with a rebuild/different prebuild target -- rejected because the failure was a genuine ABI-level runtime crash (native cleanup hook assertion), not a missing-binary problem; node:sqlite removes the native-compilation dependency entirely, which is strictly more portable for a project already designed around "no external dependencies, self-contained."
- Follow-up / honest caveats recorded in deploy.md §0 and STATE.md: this is a Hobby-plan Vercel Sandbox, capped at 45-minute sessions (persistent with 7-day snapshot resume, not always-on like a Function deploy); GitHub repo could not be linked directly to the Vercel project (needs GitHub App scope authorized in the dashboard first) so the Sandbox was created via a plain git clone instead; `git pull` failed silently against the shallow clone and needed `git fetch && git reset --hard FETCH_HEAD`. For a durable always-on URL, either upgrade to Vercel Pro (24h sessions) or containerize the same single process behind a conventional host -- no code changes needed either way.
