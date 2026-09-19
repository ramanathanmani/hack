# RESEARCH — "Does this work tonight?" scout report
PS06 — Live exam-integrity control tower (Detect → Response → Recovery → Trust)

Scope note: this document answers technical feasibility only. It does not resolve the two open
blockers already logged in STATE.md/decisions.md (D5): the "pre-written code" rules conflict with
MPOnline, and the unregistered team. Nothing below authorizes entering BUILD. Environment checked
2026-09-19: `node v22.22.2`, `npm 10.9.7`, `python 3.11.15`, `docker 29.3.1` all present; no
`sqlite3` CLI, no `cloudflared`, no `ngrok` pre-installed (all obtainable via npm/apt/direct binary
download, no account needed for the ones recommended below).

---

## 1. Recommended primary stack

Everything below runs **fully self-contained on one laptop, offline-capable, no cloud account, no
API key**. This is deliberate: PS06's own scope fence says "the demo must never depend on venue
wifi," and the rubric gives 20% to a working Prototype, not to infrastructure sophistication.

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 22 + TypeScript | Already present in this environment; one language for backend, simulator, and shared types with the frontend. |
| Backend framework | Fastify (or plain `node:http`) | Minimal, fast to scaffold, no build step needed for the server itself. |
| Event/session store | SQLite via `better-sqlite3` | Embedded, zero-config, synchronous (simple to reason about live during a demo), single `.db` file you can literally show a judge and diff. No server process, no Docker required for this piece. |
| Hash-chained checkpoint ledger | Hand-rolled, using Node's built-in `crypto` (`sha256`) | This is exactly a Git-commit-style hash chain: `entry_hash = sha256(prev_hash + canonical_json(payload))`. No blockchain library needed or wanted — a real blockchain adds consensus/latency problems irrelevant to a single-authority exam ledger, and would read as cargo-culting to a judge who asks "why blockchain?" A plain hash chain honestly demonstrates tamper-evidence and is trivial to verify live (`replay and recompute, show it matches / show it breaks`). |
| Real-time push to dashboard | WebSockets via `ws` or `socket.io` | Needed for the "judge kills a center, dashboard reacts within a second" beat. `socket.io` is heavier but has reconnect/backoff built in, useful for demoing candidate reconnect. Plain `ws` is fine if reconnect logic is written by hand. |
| State machine for a candidate exam session | Hand-rolled TS discriminated union / switch statement, or `xstate` if the team wants visual state charts for the architecture doc | States: `active → frozen (on incident) → resumed (on recovery) → submitted`. A dependency like Temporal/Camunda is explicitly NOT recommended — those need their own server/cluster and would eat the 3-hour budget for zero rubric benefit. |
| Frontend | React + Vite + TypeScript | Fast HMR for the "control tower" dashboard: a grid of exam centers with live health/risk color, an incident timeline, and a candidate-session inspector showing the checkpoint chain. |
| Charts / map | Plain SVG/CSS grid for the center grid (no need for a charting library); `recharts` only if a time-series risk graph is wanted | Keep dependency count low. |
| Simulator | A Node script/worker that generates synthetic telemetry (latency, heartbeat, answer-save events) for N simulated centers and M simulated candidates, plus a "kill switch" the judge can press | This *is* the mock strategy for the missing real exam infrastructure — see §3. |
| Local orchestration | `npm` workspaces or a single repo with `concurrently` to run API + simulator + frontend with one command; Docker Compose optional wrapper (`docker compose up`) for reproducibility since Docker is confirmed present | Docker is a nice-to-have polish for judges who peek at repo, not a requirement to get the demo running tonight. |
| Local dev "deploy" for the room | Everything on `localhost`, screen-shared/projected. For a real `preview_url` later (DEPLOY phase, not tonight), see §4. | |

Package licenses (all permissive, no ToS conflict with "MPOnline retains ownership" clause since these are open-source tools, not services):
- `better-sqlite3` — MIT
- `fastify` — MIT
- `ws` / `socket.io` — MIT
- `react`, `vite` — MIT
- `xstate` (if used) — MIT
- SQLite itself — public domain

No signup, no ToS acceptance, no rate limit applies to any of the above — they are all libraries
that run on the machine, not third-party services. This sidesteps essentially all of the
"external dependency" risk this scout normally has to chase down.

---

## 2. Feasibility verdict per component

| Component | Verdict | Notes |
|---|---|---|
| Node/TS backend + SQLite | **GO** | Verified present in this environment. Zero external calls. |
| Hash-chained checkpoint ledger (custom, sha256) | **GO** | Pure computation, `node:crypto` is stdlib. Trivially demoable and verifiable live. |
| WebSocket live dashboard push | **GO** | `ws`/`socket.io` are local npm installs, no external service. |
| React/Vite dashboard | **GO** | Standard local dev server. |
| Synthetic telemetry simulator + "kill switch" | **GO** | This is code we write, not a dependency; see §3 for what it stands in for. |
| Candidate-session state machine | **GO** | Hand-rolled or `xstate`, both local. |
| Docker Compose wrapper | **GO, optional** | Docker confirmed installed; useful for the "Technology Architecture" submission doc and for a judge who wants to `docker compose up` the repo, but not required to run the demo tonight. |
| Real MPOnline exam-center telemetry / API | **NO-GO** | No such API exists or is documented anywhere in intake.md; intake.md explicitly says "NOT ASSUMED: no sponsor tech stack is mandated; do not invent one." Must simulate (see §3). |
| Real candidate auth / login | **N/A — out of scope by design** | problem.md explicitly excludes auth flows from the golden path. Do not build it; do not mock it either, just skip the screen. |
| Public live URL for judges to hit remotely tonight | **GO-WITH-MOCK** | Not needed for an in-person demo (judges watch a laptop screen at a team station per the agenda). If a shareable link is wanted anyway, see §4 — no paid/account-gated service required if using a Cloudflare Quick Tunnel. |
| Blockchain / distributed ledger for checkpoints | **NO-GO (deliberately rejected)** | Would require either a hosted chain (external dependency, wallet/gas costs, ToS, latency — everything this scout is supposed to flag) or standing up a local multi-node chain (Hyperledger/Fabric etc.) which is a multi-hour infra project by itself. A local hash chain gets 100% of the tamper-evidence demo value the judges can perceive, at 0% of the risk. |
| Cloud DB / hosted Postgres (e.g. Supabase, Neon) | **NO-GO for tonight** | Requires account creation, API keys, network dependency during the live demo — exactly the fragility the scope fence ("must never depend on venue wifi") warns against. SQLite file on the presenting laptop has none of these failure modes. |
| Any SMS/email "candidate communication" integration (Twilio, SendGrid, etc.) | **GO-WITH-MOCK** | intake.md does not name a sponsor comms API, and problem.md's golden path only asks for "an honest live status message" to the candidate — the dashboard/candidate-screen UI itself is the message channel. Render it in the same web UI (a banner: "Center X frozen, resuming in Ys") rather than integrating a real messaging provider. Zero signup, zero cost, zero risk of a live demo depending on a third party's delivery latency. |

---

## 3. Gaps that are real (things this environment genuinely cannot get) + mock strategy

| Gap | Why it's unreachable tonight | Mock/simulation strategy | Honesty note for judges |
|---|---|---|---|
| Real exam-center hardware/network telemetry | No such hardware exists in this environment; MPOnline has not published a telemetry API; even if it existed, connecting to a production exam vendor's infra during a hackathon would be reckless and almost certainly against ToS | A Node "simulator" process emits synthetic per-center heartbeat/latency/answer-save events on a timer into the same event log the real system would use. The **kill switch is a literal button** that flips one center's simulated state to `down`, exactly the trigger a real monitoring agent would emit on an actual outage. The ingestion/detection/response code downstream of that event is real, not mocked. | State plainly in the pitch: "telemetry ingestion point is real; the telemetry source is simulated because we don't have access to production exam infrastructure — the architecture doc shows exactly where a real agent would plug in." This is a *feasibility* claim, which the rubric explicitly rewards (15%), not a promise the whole thing is faked. |
| Real candidate exam-taking client (browser-based question renderer used in production) | Out of scope by design (problem.md), and building a full exam UI is a different, larger product | A minimal "candidate session" panel showing a mock question + answer box + a running clock, enough to visually demonstrate freeze/resume and never-lost-an-answer | Framed explicitly as a stand-in in the architecture doc: "candidate exam UI is illustrative; production would integrate with MPOnline's existing assessment front end." |
| Large-scale load (thousands of concurrent centers/candidates) | Can't be honestly demonstrated live on one laptop in a room, and isn't needed to prove the mechanism | Simulate a small number of centers (e.g. 6–12) and candidates (e.g. 20–50) live; put scalability argument (SQLite → Postgres, single-process → queue/worker pool, hash chain sharded per center) in the "Technology Architecture" submission doc, not in the live demo | Scalability is 10% of the rubric and is a written-answer criterion, not a "prove it live" criterion — don't spend build time faking scale theater. |
| Automated reconciliation/validation of candidate responses against an authoritative answer-key system | No such system exists to integrate with (would be MPOnline-internal) | The checkpoint chain itself is the reconciliation proof: replaying the hash chain from genesis and recomputing hashes either matches the stored final state or doesn't. Demonstrate a deliberate tamper (edit one row in the SQLite file directly) and show the verifier catches it. | This is arguably a stronger demo than "reconciliation against an answer key" would be, because it's self-contained and verifiable in front of the judge with no trust required in an offstage system. |
| A live public `preview_url` reachable by remote judges | No cloud credentials confirmed available in this session (see below) | See §4 | Only relevant if remote judging is later confirmed; the agenda (intake.md §6) describes in-person team-station judging, so this is likely unnecessary. |

---

## 4. If a public URL is ever needed (DEPLOY phase, not tonight)

Not required by the confirmed agenda (Round 1 and the finale are both in-person, judges come to the
team's station/stage). Flagging it now so DEPLOY doesn't stall later discovering this gap:

- **No cloud provider credentials are confirmed present in this environment** (no AWS/GCP/Azure/
  Render/Railway/Vercel/Fly.io token seen or referenced anywhere in STATE.md/intake.md). Any of
  those would need the human to create an account and hand over a token — real friction, flag as
  blocked-not-done if DEPLOY phase needs it and no token shows up.
- **Zero-signup fallback that works fully offline-until-needed**: Cloudflare "Quick Tunnel"
  (`cloudflared tunnel --url http://localhost:PORT`) issues a random `https://*.trycloudflare.com`
  URL with no account, no token, no DNS setup — good enough for "let a judge on another laptop hit
  it once." Not installed in this environment yet; installable via direct binary download (no
  account) or `npm i -g cloudflared`-style wrapper. Rate limit: none published for quick tunnels,
  but they are explicitly *not* meant for production/sustained traffic — fine for a hackathon demo,
  not something to rely on for actual judging infra.
- **Verdict: GO-WITH-MOCK.** Build and demo locally; only reach for Cloudflare Quick Tunnel if a
  remote-access requirement surfaces later. Do not attempt Render/Railway/Vercel signup mid-build —
  that is exactly the "waiting on external approvals/credentials" this scout is supposed to avoid.

---

## 5. Green light — what CAN be built for real, right now, with zero external accounts

1. Fastify (or plain Node) HTTP + WebSocket API — real code, real server.
2. SQLite-backed append-only event log (candidate actions, incident events, checkpoints) — real
   persistence, inspectable as a literal file.
3. A genuine SHA-256 hash chain over that event log, with a verifier that recomputes and flags
   tampering — real cryptography, real tamper-evidence, zero blockchain dependency.
4. A candidate-session state machine (`active/frozen/resumed/submitted`) driving real freeze/resume
   logic keyed off incident events — real business logic.
5. A synthetic telemetry simulator with a live "kill this center" control — real event production,
   clearly labeled as simulated input in the architecture doc.
6. A React/Vite live dashboard (center grid with health color, incident timeline, candidate
   inspector showing the hash chain) driven by real WebSocket pushes from the real backend.
7. A decision-support verdict function (`re-conduct / partial extension / no action`) computed from
   real event-log data (e.g., duration frozen vs. exam length, number of affected candidates) — real
   logic, not a hardcoded string, even though the policy thresholds are a reasonable first-pass
   heuristic rather than a validated policy.
8. Optional Docker Compose wrapper — Docker is confirmed installed, so this is genuinely buildable,
   not aspirational.

None of the above requires waiting on MPOnline, an API key, a cloud account, or venue wifi. The
only two things blocking the pipeline from advancing to BUILD are the two already logged in
STATE.md/decisions.md (D5): the pre-written-code rules conflict, and the unregistered team — both
of those are human/process blockers, not technical ones, and this research does not change that
status.

---

## 6. Recommendation to spec-author

Spec the golden path around the stack in §1: Node/TS + SQLite + hash-chained log + WebSocket
dashboard + React frontend + synthetic simulator with a kill switch. Treat §3's mock strategies as
first-class, disclosed design decisions in the "Technology Architecture" submission doc, not as
things to hide. Do not spec a blockchain, a hosted DB, or any third-party comms/SMS provider —
all were evaluated and rejected above as unnecessary external-dependency risk for a hackathon demo
whose scope fence already says it must never depend on the venue network.
