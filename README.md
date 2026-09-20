# Sentinel — Exam Integrity Control Tower

**One-liner:** Real-time exam integrity with transparent fairness verdicts — the control tower that
freezes candidate clocks the moment a center goes dark, checkpoints every answer into a
tamper-evident hash chain, and issues a verdict (re-conduct / partial extension / no action) with
its rule, inputs and arithmetic shown on screen.

**Live preview:** **https://sb-7l06rm86jh7b.vercel.run** — deployed as a Vercel Sandbox (this app is
a stateful single process with WebSocket + SQLite, not a serverless-function fit). Note: on the
Hobby plan, Sandbox sessions cap at 45 minutes; if the link is asleep, run it yourself with the
Quick start below, or watch `demo/sentinel-golden-path.webm` (real screen capture, <1 MB). Full
deploy detail: `.hackathon/deploy.md` §0.

Reference prototype for **MPOnline Idea & Innovation Hackathon 2026**, Technical track, **PS06 —
Resilient & Trustworthy Online Assessment Ecosystem**.

## Problem + what we built

Large-scale online exams don't usually fail because someone cheated — they fail because a leased
line drops, a UPS dies, or a center's router reboots mid-exam. Candidate clocks keep running,
nobody in the control room knows whether answers were saved, and the only evidence afterwards is a
phone log and a coordinator's email. Because that evidence can't be defended to a candidate, a
court, or an RTI request, the safe (and expensive) decision is to re-conduct the exam for everyone.

**Sentinel** is a live exam-integrity control tower covering all five stages MPOnline's own problem
statement names — Prevention, Detection, Response, Recovery, Trust — as one working vertical slice:

- **Prevention/Detection.** Live health telemetry across 8 exam centers and 24 candidate sessions;
  the server detects a missed heartbeat on its own tick loop and opens/classifies a real incident —
  never short-circuited by the demo's kill switch.
- **Response/Recovery.** Affected sessions freeze server-side (the server owns the only clock), each
  candidate sees an honest "your progress is saved" banner, and every answer/freeze/resume is a
  SHA-256-linked checkpoint. On reconnect, sessions resume with lost time restored.
- **Trust.** `/audit` recomputes the whole hash chain in one click — PASS, or FAIL naming the exact
  broken row. The closed incident produces a transparent verdict — Re-Conduct / Partial Time
  Extension / No Action — rendering the rule, inputs, arithmetic and an illustrative cost-avoided
  figure, clearly labeled illustrative.

One Node.js 22 + TypeScript process is the whole product: Fastify 5, raw `ws`, SQLite via
`better-sqlite3`, React 19 + Vite. Zero external network calls at runtime, no auth, no LLM, no
cloud account — it runs on one laptop with the wifi off. Full pitch: `.hackathon/pitch.md`.

> Status: working prototype. Full golden path (kill switch → incident detection → freeze →
> checkpoint → reconnect → resume → verdict, plus the audit tamper/verify cycle) runs live and has
> been verified both over HTTP/WS (`.hackathon/qa.md`) and in a real Chromium browser
> (`.hackathon/screenshots/`, `.hackathon/qa.md` "browser-dry-run").

## Demo

- **Video (fallback, <1 MB):** `demo/sentinel-golden-path.webm` — real Playwright screen capture of
  the actual golden path: kill → hold → reconnect (partial-extension verdict) → `/audit` → verify
  PASS → tamper → verify FAIL.
- **Script for a live/browser walkthrough:** `.hackathon/demo.md` (beat-by-beat, timings, landmines,
  verbatim spoken lines).

## Quick start

```bash
# install (the only step that touches the network)
npm install

# copy env defaults (optional — every var has a working default)
cp .env.example .env

# seed the lived-in demo fixture (8 MP exam centers, 24 sessions, one resolved
# backstory incident) — do this before either run mode below
npm run seed --workspace server

# local dev: two processes, HMR — API :8080 + Vite :5173 with proxy
npm run dev

# single-command run of the real thing: build UI, serve everything from :8080
npm run build && npm start
# → http://127.0.0.1:8080
```

## Tests & checks

```bash
npm test               # node:test via tsx across server/test/**
npm run test:chain     # AC-7/AC-8 fast loop for the ledger
npm run typecheck      # tsc --noEmit, both workspaces
npm run check:offline  # greps web/dist for external origins (AC-14 guard)
```

## Demo utilities

```bash
npm run seed          # reset DB to the fixed scenario
npm run reset         # delete data/sentinel.db, migrate, seed (hard reset)
npm run verify-chain  # CLI PASS/FAIL chain verification
npm run tamper        # CLI raw-UPDATE tamper (second path to the in-app tamper control)
```

## Architecture (8 lines)

1. **One Node process, one port (`:8080`).** Fastify serves the REST API, raw `ws` broadcasts live
   updates, and — in production mode — the same process serves the pre-built React static bundle.
2. **SQLite via `better-sqlite3`** (synchronous, single file `data/sentinel.db`) is the only store;
   no ORM, no hosted DB, no Postgres.
3. **The server is the only clock.** `domain/clock.ts` computes `remainingMs`; the React UI only
   ever renders/extrapolates the server's value — it never counts independently.
4. **A hand-rolled SHA-256 hash chain, sharded per exam center** (`domain/chain.ts`), makes every
   answer-save/freeze/resume checkpoint tamper-evident and independently re-verifiable via `/audit`.
5. **A deterministic seeded telemetry simulator** (`sim/simulator.ts`, mulberry32 PRNG) stands in for
   real exam-center telemetry; the ingestion seam (`telemetry_event`) is documented so a real center
   agent can POST the same shape later. Every simulated surface is labeled on screen.
6. **Detection is real, not scripted:** the simulator's tick loop notices a missed heartbeat and
   opens/classifies the incident itself — the demo's "Kill Switch" never creates the incident directly.
7. **A policy-transparent verdict engine** (`domain/verdict.ts`) computes Re-Conduct / Partial
   Extension / No Action from real inputs and renders the rule, arithmetic and an illustrative
   cost-avoided figure — no black box, no ML.
8. **Zero external network calls at runtime** (`npm run check:offline` greps the built bundle) — no
   CDN fonts, no analytics, no auth, no API keys; deploy = `npm run build && npm start` on one laptop.

Full detail: `.hackathon/architecture.md` / `docs/architecture.md`.

## Env vars

All optional — every variable has a working default, so `npm start` works with zero `.env` file.
No API keys, tokens, or secrets exist anywhere in this project.

| Name | Purpose |
|---|---|
| `PORT` / `HOST` | HTTP + WS bind (default `8080` / `127.0.0.1`) |
| `NODE_ENV` | `development` \| `production` (production enables static UI serving) |
| `SENTINEL_DB_PATH` | SQLite file path (default `./data/sentinel.db`) |
| `SIM_SEED` | Deterministic PRNG seed (default `20261009`) |
| `SIM_TICK_MS` | Telemetry tick interval (default `1000`) |
| `SIM_CENTERS` | Number of centers (default `8`) |
| `SIM_SESSIONS_PER_CENTER` | Candidate sessions per center (default `3`) |
| `EXAM_DURATION_S` | Simulated exam length (default `3600`) |
| `VERDICT_FREEZE_THRESHOLD_S` | Partial-extension threshold (default `10`) |
| `VERDICT_RECONDUCT_THRESHOLD_S` | Re-conduct threshold (default `600`) |
| `VERDICT_COST_PER_CANDIDATE_INR` | Illustrative re-conduct cost input (default `850`) |
| `ENABLE_SIM_CONTROLS` | Gates the `/api/sim/*` demo-control routes (default `true`) |

Full names/defaults: `.env.example` (committed) and `.hackathon/architecture.md` §6.

## Team

Built end-to-end by an automated hackathon-factory agent pipeline (problem framing → spec →
architecture → build → integrate → test → harden → deploy → submit) running under the direction of
the repository owner (`hackclaude101@gmail.com`), as a reference prototype ahead of the in-person
MPOnline Idea & Innovation Hackathon 2026 (09–10 Oct, Bhopal). A registered human team (2–4
members, age 16–25) is required to compete on-site — see `.hackathon/STATE.md` blockers for what is
still outstanding before the real event.

## Stack

Node.js 22 + TypeScript · Fastify 5 + raw `ws` · SQLite via `better-sqlite3` · hand-rolled
SHA-256 hash chain (`node:crypto`), sharded per center · React 19 + Vite 6 + plain CSS ·
deterministic seeded telemetry simulator · npm workspaces (`server/`, `web/`, `shared/`).
