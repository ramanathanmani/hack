# Implementation & Feasibility Plan — Sentinel

## What already exists (built and verified, not a plan)

The core product is complete and running: one Node.js 22 + TypeScript process (Fastify + WebSocket +
SQLite), a React dashboard, and a deterministic seeded simulator standing in for real exam-center
telemetry. Full build history and every acceptance criterion: `.hackathon/plan.md` (task-by-task
backlog, 4 milestone gates) and `.hackathon/qa.md` (verification log, including a real browser pass).
This document covers what is genuinely *not yet done* and the realistic order to do it in.

## Feasibility of what remains

Everything below is scoped to be buildable with the existing architecture — no new stack, no new
external dependency, no rewrite. The system was deliberately built "boring": one process, SQLite,
hand-rolled hash chain, no ORM — which is precisely what keeps every item below small and low-risk.

## Realistic one-week plan, in order

1. **Days 1–2 — Replace the simulator on one real seam.** Write the real exam-center agent: a small
   (~100 line) Node service that POSTs the same `telemetry_event` shape (heartbeats, answer-save
   events) the server already accepts, running on a single real exam-hall PC. This is the single
   highest-value step: it proves the ingestion seam documented in `docs/architecture.md` is real,
   not aspirational. No server-side changes required — the API contract already exists.
2. **Day 3 — An integration test for the loop the demo actually is.** Currently all 16 unit tests
   exercise pure functions (hash chain, clock, verdict) in isolation; nothing boots the full app and
   drives kill → freeze → resume → verdict in-process. One `node:test` file with `SIM_TICK_MS=50`
   closes this gap, along with a `determinism.test.ts` asserting a reseed produces identical output.
3. **Day 4 — Per-incident frozen-time accounting.** Today `frozen_ms_total` accumulates across every
   freeze a session has ever had; a second incident on the same center would double-count. Fix:
   snapshot the value at freeze and diff on resume, so each incident's verdict reflects only its own
   outage.
4. **Day 5 — Make the verdict policy a signed-off config, not a code default.** The freeze/re-conduct
   thresholds and the per-candidate cost constant already live in environment variables; the next
   step is lifting them into a versioned policy document an actual exam controller reviews and signs,
   with the applied policy version recorded on every computed verdict (the reasoning payload already
   has a `policy_version` field reserved for this).
5. **Day 6 — Deploy to a real, shareable URL.** The prototype currently runs locally only; a public
   preview is blocked solely by this build environment's outbound network restriction (documented
   with exact error output in `.hackathon/deploy.md` §4–5) — not by anything in the product. On an
   unrestricted network this is a roughly 6-command fix (`cloudflared tunnel --url ...`, already
   scripted). A Docker Compose wrapper would also be added here for easier handoff.
6. **Day 7 — Validate with one real exam control room.** Sit with an actual MPOnline exam-day
   coordinator and find out which fields on the verdict card they would actually be willing to put
   their name against, and whether the assumed thresholds match real operational policy. Nothing in
   this prototype has been validated against a real stakeholder yet — this is the most important open
   item, more than any remaining code.

## Risks and honest caveats carried into this plan

- The ₹850/candidate re-conduct cost used in the demo is an invented, illustrative placeholder (see
  the Impact & Benefits document) and must be replaced with a real MPOnline figure before any cost
  claim is used operationally.
- The scalability claim (per-center hash-chain sharding scales from 8 to hundreds of centers) is an
  architectural property, not a benchmarked one — Day 5's deploy step should be followed by an actual
  load test, not assumed to be covered by "the architecture allows it."
- No AI/ML component exists; if the "AI analytics on systemic risk" sub-ask in PS06 is a hard
  requirement rather than one option among several, a risk-scoring layer built from historical
  telemetry (additive, not replacing the deterministic verdict engine) would be the natural next
  feature — deliberately not attempted in this prototype so the core evidence-chain claim stayed
  simple enough to verify by hand.
