# Solution Synopsis — Sentinel

**Track:** Technical · **Problem Statement:** PS06 — Resilient & Trustworthy Online Assessment Ecosystem
**Team/Project:** Sentinel — Exam Integrity Control Tower

## The problem in one sentence

When an exam center drops offline mid-exam, nobody can prove what happened to the candidates
inside it — so the safe, expensive default is to re-conduct the exam for everyone.

## What we built

Sentinel is a live exam-integrity control tower covering all five stages MPOnline's own problem
statement names — Prevention, Detection, Response, Recovery, Trust — as one working vertical
slice, not a slide deck:

- **Detects automatically.** The system itself (not an operator) notices when an exam center stops
  sending heartbeats, opens and classifies an incident, and freezes only the affected candidate
  sessions.
- **Protects candidates honestly.** Each frozen candidate sees a plain message — "Center disrupted.
  Your progress is saved. Timer paused." — and resumes with their lost time restored on reconnect.
- **Makes every answer tamper-evident.** Every saved answer, freeze, and resume is appended to a
  SHA-256-linked ledger, sharded per exam center. `/audit` recomputes the whole chain in one click:
  PASS, or FAIL naming the exact broken row.
- **Replaces guesswork with a transparent verdict.** When an incident closes, Sentinel computes
  Re-Conduct / Partial Time Extension / No Action from real inputs, and shows the rule, the
  arithmetic, and an illustrative cost-avoided figure — no black box, no hidden model.

## Why it matters

The gap MPOnline faces is not a shortage of alarms — it's a shortage of evidence a coordinator can
defend to a candidate, a court, or an RTI request. Sentinel turns "the router went down" into "these
3 candidates lost exactly 47 seconds each, here is the cryptographic proof, here is the fair remedy" —
replacing a blanket re-conduct with a per-candidate remedy that is provably fair and far cheaper to
administer.

## What's real today

Built as a working prototype: one Node.js/TypeScript process (Fastify + WebSocket + SQLite), a React
dashboard, and a deterministic seeded simulator standing in for real exam-center telemetry (clearly
labeled on screen as simulated). Verified live — via HTTP, WebSocket, and a real Chromium browser
pass — running the full kill → detect → freeze → reconnect → resume → verdict → audit-verify →
tamper → FAIL loop end to end, offline, on one laptop.

Full technical detail: `docs/architecture.md`. Full pitch and rubric mapping: `.hackathon/pitch.md`.
Demo video: `demo/sentinel-golden-path.webm`.
