# Hackathon State

- hackathon_url: https://innovate.mponline.gov.in/
- event_name: MPOnline Idea & Innovation Hackathon 2026
- event_dates: 09–10 October 2026, in-person, SSRGSP Bhopal (starts 09:00 IST, hack begins 10:30)
- track: Technical
- phase: PROBLEM (complete) — held before RESEARCH/SPEC
- status: blocked
- last_agent: hackathon-conductor (ran INTAKE + PROBLEM directly; see note)
- next_agent: research-scout (on unblock)
- chosen_problem: PS06 — Resilient & Trustworthy Online Assessment Ecosystem
- chosen_idea: Live exam-integrity control tower — one vertical slice of
  Prevention → Detection → Response → Recovery → Trust
- fallbacks: PS03 (AI-driven OSM), PS04 (Digital inclusion, rural HE)
- repo_url: TBD
- preview_url: TBD
- demo_freeze: false
- hours_total: ~3h to the Round 1 cut on Day 1 (10:30 → 13:30 IST, 09 Oct), then evening off-venue,
  then Day 2 finale presentations from 09:00
- hours_remaining: N/A — event is 20 days out

## blockers
1. **Rules conflict, must be resolved by a human.** FAQ: project/code/design/idea/content "must be
   created during the hackathon duration"; previously built projects are ineligible. Agenda: 10:30
   session reviews "premade presentations/solutions". Until MPOnline answers, BUILD must not start.
   Ask hackathon@mponline.gov.in / +91-7024589934 / +91-7880172879.
2. **No registered team.** Requires 2–4 humans aged 16–25, physically in Bhopal on 09–10 Oct, with a
   paid non-refundable registration. This session cannot satisfy that.
3. Registration close date, submission-lock deadline (+timezone) and fee are UNKNOWN.
4. Agent/Task dispatch is disabled in this session, so no specialist subagents could be spawned;
   the conductor executed INTAKE and PROBLEM itself. Re-enable subagents before RESEARCH → SPEC so
   spec-author can produce competing specs and spec-judge can rule.

## Artifacts
- /home/user/hack/.hackathon/intake.md — full rules, both rubrics with weights, agenda, 10-item
  submission kit, prizes, IP terms, confirmed-vs-unknown ledger
- /home/user/hack/.hackathon/problem.md — PS selection with scoring table, golden path, scope fence,
  kill criteria
- /home/user/hack/.hackathon/decisions.md — D1–D5
- /home/user/hack/.hackathon/archive-ibm-bob2/ — previous, unrelated run

## Notes
- Technical rubric shape: Innovation 20 / Prototype 20 / Problem understanding 15 / Technical
  feasibility 15 / Governance impact 15 / Scalability 10 / Presentation 5. Working code beats slides.
- Submission files are capped at **1 MB each**. Ten items. Submission is draft-then-lock; no edits after.
- MPOnline retains full ownership of anything submitted.
- Hard scheduling fact: Round 1 judging is 13:30 on Day 1, ~3 hours after the start gun. Plan the MVP
  against that cut, not against the Day 2 finale.
