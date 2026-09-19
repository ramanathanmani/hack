# Hackathon State

- hackathon_url: https://innovate.mponline.gov.in/
- event_name: MPOnline Idea & Innovation Hackathon 2026
- event_dates: 09–10 October 2026, in-person, SSRGSP Bhopal (starts 09:00 IST, hack begins 10:30)
- track: Technical
- phase: DECISION (complete)
- status: in_progress
- last_agent: spec-judge
- next_agent: architect
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
