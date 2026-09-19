# Problem Statement & Proposed Solution — Sentinel

## Selected problem statement (verbatim framing)

**PS06 — Resilient & Trustworthy Online Assessment Ecosystem.** MPOnline's own framing asks for a
system spanning five stages: **Prevention → Detection → Response → Recovery → Trust**, with the
explicit business goal of avoiding unnecessary exam re-conduct.

## The problem, in detail

MPOnline runs statewide recruitment and entrance exams across hundreds of centers. On exam day, the
realistic failure mode is not cheating — it's infrastructure: a router reboots, a UPS dies, a leased
line drops for a few minutes.

What happens today, step by step:

1. A center loses connectivity. Candidate clocks keep running regardless.
2. Candidates don't know whether their answers were saved. Neither does the control room.
3. After the fact, the only evidence is a phone log, a coordinator's email, and a spreadsheet.
4. Because nobody can prove which candidates lost how much time, the only defensible decision is
   the expensive one: **re-conduct the exam for everyone** — new halls, new invigilators, repeated
   question-paper security logistics, candidate travel, and a delayed result calendar that pushes
   back admissions or recruitment timelines.

The underlying gap is not a shortage of monitoring or alarms. It is a shortage of **evidence** a
coordinator can defend in front of a candidate, a court, or an RTI request.

## Proposed solution

Sentinel is a live exam-integrity control tower that implements all five named stages as one working
vertical slice:

- **Prevention / Detection** — Live health telemetry across every exam center and candidate session.
  The server's own tick loop, not a human or the demo's kill switch, notices a missed heartbeat and
  opens/classifies a real incident.
- **Response / Recovery** — Affected candidate sessions freeze at the server (the server is the only
  clock, so restored time is never disputed). Every candidate sees an honest, plain-language status
  message. On reconnect, sessions resume with the exact lost time restored.
- **Trust** — Every answer-save, freeze, and resume checkpoint is appended to a SHA-256-linked,
  per-center hash chain. `/audit` recomputes the entire chain in one click: PASS, or FAIL naming the
  exact broken row (center, sequence, expected hash, actual hash). When an incident closes, a
  policy-transparent verdict engine computes **Re-Conduct / Partial Time Extension / No Action**,
  rendering the rule, the inputs, and the arithmetic on screen — not a black-box score.

## Why this solution fits the problem, not just the theme

- It answers the stated business outcome directly: "avoid unnecessary re-conduct of examinations,"
  by replacing a blanket re-conduct with a per-candidate, provably fair remedy.
- It treats the *infrastructure* itself as the integrity risk — a distinct angle from proctoring or
  cheating-detection tools, which most teams building for an exam-integrity theme default to.
- It is demonstrable, not theoretical: a judge can break the system live (kill a center), watch it
  detect and recover on its own, then tamper with the stored evidence and watch the audit catch it.

## What is explicitly out of scope (and why)

- Candidate-facing exam-taking UI — not the problem being solved; only the integrity/control layer is.
- Real MPOnline API integration, SMS/email notification providers, and cloud hosting — no such
  APIs/accounts exist in this build environment; the ingestion seam is documented so a real center
  agent can plug in later (see `docs/architecture.md`).
- AI/ML-based risk scoring — deliberately not built; see the Innovation & Differentiation note for
  the reasoning and an honest acknowledgment of the theme's "AI analytics" ask.

Full technical design: `docs/architecture.md`. Full problem-framing detail: `.hackathon/problem.md`.
