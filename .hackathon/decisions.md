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
