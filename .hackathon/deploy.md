# DEPLOY — Sentinel

Phase: DEPLOY · Date: 2026-09-19/20
Reads: `architecture.md` §6, §9, §14 (deploy definition + explicit blocked-path contingency).

**Status: LIVE. A real, public HTTPS URL now serves the actual product, deployed via the Vercel
MCP.** §0 below is current; §1-§7 are kept as the record of the earlier Cloudflare attempt (blocked
by this sandbox's network policy) and remain useful as the local-run fallback.

---

## 0. Live deployment (Vercel Sandbox) — current status

**Public URL:** `https://sb-7l06rm86jh7b.vercel.run` (Vercel project `sentinel-exam-integrity`,
`prj_EC1fM3Iw1Egq7qtYBpwoHGSeTFtL`).

**How it was deployed:** the user asked to deploy via the Vercel MCP instead of Cloudflare. Rather
than serverless Functions (Sentinel is a stateful single process with a persistent WebSocket server
and a SQLite file — not a fit for stateless request/response functions), this uses a **Vercel
Sandbox**: `mcp__Vercel__create_sandboxes_v4` cloned the GitHub repo, exposed port 8080, and
`mcp__Vercel__run_session_command` ran the real build:

```
npm install && npm run build && npm run seed --workspace server
NODE_ENV=production HOST=0.0.0.0 PORT=8080 npm start
```

**A real bug this surfaced and fixed:** the first deploy attempt crashed immediately with a native
addon assertion failure inside `better-sqlite3` on the sandbox's Node v24.21.0 build — the exact
"native-module ABI mismatch" risk `architecture.md`'s `connection.ts` comment had pre-flagged, with
`node:sqlite` documented as the fallback. Implemented that fallback for real (see the
`a14f969` commit): `db/connection.ts` now wraps Node's built-in `node:sqlite` behind the same
`prepare()/pragma()/transaction()/close()` shape, so `repo.ts` and `migrate.ts` needed only a
one-line type-import change each. Verified locally (typecheck, build, 16/16 tests, a live
kill→verify run) before redeploying.

**Verified live against the public URL itself** (not just locally): `GET /`, `GET /api/state`,
kill switch → real missed-heartbeat detection → incident opens → freeze → `POST reconnect` →
resolve, `POST /api/audit/verify` → PASS, `POST /api/sim/tamper` → verify → FAIL with the exact
broken row, `POST /api/sim/reset` → verify → PASS again. Also opened the URL in a real headless
Chromium browser (Playwright) and confirmed the UI renders correctly, including the honest
WS→2s-polling degrade badge.

**Honest limitations of this deployment, stated plainly:**
- **This is not a permanent URL.** The Vercel account is on the Hobby plan, which caps Sandbox
  sessions at 45 minutes; the sandbox is `persistent: true` with automatic snapshotting, so it can
  be resumed within its snapshot's expiration window (7 days) via
  `mcp__Vercel__get_named_sandbox(name: "sentinel-demo", resume: true)`, but it is not always-on
  infrastructure the way a Vercel Function deployment would be. For a durable, always-on URL, either
  upgrade to a Pro plan (24h sandbox sessions) or containerize the single process behind a
  conventional host (Fly.io, Render, a small VM) — the app itself needs no code changes for that,
  since it's already a single self-contained Node process.
- **Two Vercel API calls needed the `teamId` omitted, not included**, even though the account has a
  `defaultTeamId` — passing it returned a 403 scope error. Project creation and the sandbox itself
  were created without an explicit `teamId`/`slug`, which worked. Worth knowing if resuming this
  later.
- **The GitHub repo could not be linked to the Vercel project directly** (`create_project` with
  `gitRepository` also hit the same 403 scope error) — this needs the GitHub App/OAuth scope
  authorized in the Vercel dashboard first. The Sandbox path used here (cloning via plain git URL)
  does not require that authorization, which is why it worked without it.
- The sandbox's `git pull` failed silently against a shallow (`depth: 1`) clone (no local
  `origin/main` ref) when pulling the `node:sqlite` fix — worth using `git fetch && git reset --hard
  FETCH_HEAD` instead of `git pull` for any future update to this sandbox.

---

## 1-7. Earlier attempt: local run + Cloudflare tunnel (kept for reference)

---

## 1. Local run (copy-paste, verified working right now)

```bash
cd /home/user/hack
npm install                       # only network step
npm run build                     # tsc + vite build, both workspaces
npm run seed --workspace server   # resets DB to the lived-in demo scenario
NODE_ENV=production npm start     # serves API + WS + built UI on one port
```

Then open `http://127.0.0.1:8080/`.

**Verified in this environment just now:**
- `npm run build` — PASS (web + server, incl. `copy-migrations`).
- `npm run seed --workspace server` — PASS ("Seeded 8 centers, 24 sessions, 70 checkpoints, one
  resolved backstory incident").
- `NODE_ENV=production npm start` — PASS. `curl http://127.0.0.1:8080/` → `200` (real built HTML).
  `curl http://127.0.0.1:8080/api/state` → `200` (real seeded fleet JSON).
  `curl http://127.0.0.1:8080/audit` → `200` (SPA fallback).
- No `.env` file needed — every var has a working default (see §2).

To reset mid-demo without restarting the server: `POST /api/sim/reset`, or hard-reset with
`npm run reset --workspace server` (deletes `data/sentinel.db`, re-migrates, re-seeds).

---

## 2. Required env vars (names only — no secrets exist in this project)

All optional; defaults make `npm start` work with zero `.env` file.

```
PORT
HOST
NODE_ENV
SENTINEL_DB_PATH
SIM_SEED
SIM_TICK_MS
SIM_CENTERS
SIM_SESSIONS_PER_CENTER
EXAM_DURATION_S
VERDICT_FREEZE_THRESHOLD_S
VERDICT_RECONDUCT_THRESHOLD_S
VERDICT_COST_PER_CANDIDATE_INR
ENABLE_SIM_CONTROLS
```

Full names/defaults/purpose: `.env.example` (committed) and architecture.md §6. There are no API
keys, tokens, or passwords anywhere in this system — nothing to keep secret, nothing was committed
that shouldn't be.

---

## 3. Deploy target

Per architecture.md §9/§14, this project's deploy target is **self-hosted single process on
localhost:8080** — no cloud host by design (no Vercel/Render/Railway/Fly, no account, no API key;
research.md §4: in-person team-station judging, offline-capable). Architecture.md explicitly flags
that this does not satisfy CLAUDE.md's project-wide DEPLOY exit condition (localhost = failure), and
names exactly one sanctioned fallback for a shareable URL: **`cloudflared tunnel --url
http://localhost:8080`** (Cloudflare Quick Tunnel, no account/API key required).

## 4. What was actually attempted

1. `cloudflared` was **not** pre-installed. Checked `apt`/`apt-get` (package not in the repos),
   then downloaded the official static binary directly from GitHub Releases
   (`cloudflare/cloudflared` v2026.9.1, `cloudflared-linux-amd64`) — this succeeded, no account or
   API key involved (`cloudflared --version` → `cloudflared version 2026.9.1`).
2. Built the app, seeded the DB, and started `NODE_ENV=production npm start` in the background.
   Confirmed `curl http://127.0.0.1:8080/` → `200` locally (see §1).
3. Ran `cloudflared tunnel --url http://localhost:8080` in the background. It successfully
   registered a Quick Tunnel with Cloudflare's control plane and printed a real hostname (twice,
   across two attempts: `https://complement-heights-photographers-reporter.trycloudflare.com` and
   `https://maui-footage-once-occupation.trycloudflare.com`), but the actual tunnel/data connection
   never came up:
   - First attempt (default QUIC/UDP transport): `curl`-ing the printed URL from outside the local
     process returned Cloudflare's own edge error page, HTTP **530**, not the app. cloudflared's log
     showed `UDP Connectivity: QUIC connection failed` and `Failed to dial a quic connection ...
     timeout: no recent network activity` — outbound UDP to Cloudflare's edge is not reachable from
     this sandbox.
   - Second attempt (`--protocol http2`, which uses TCP instead of UDP): still failed. cloudflared's
     own environment precheck printed `ERROR: Allow outbound TCP on port 7844` and the connection
     attempt errored `dial tcp <cloudflare-edge-ip>:7844: i/o timeout`.
4. Checked this session's own network-egress documentation
   (`/root/.ccr/README.md`, the pre-configured agent proxy). It states outbound HTTPS from this
   session is routed through an HTTP CONNECT proxy on port 443 only, and explicitly lists
   **"non-443 HTTPS ports"** and certificate-pinned/tunnel clients as **not supported through the
   proxy — report, do not work around**. cloudflared's control connection requires TCP or UDP port
   **7844**, which is neither 443 nor proxyable by an HTTP CONNECT tunnel. This matches exactly what
   the logs showed and confirms it is a hard environment restriction, not a flaky network blip
   (retried the connection multiple times over ~30s, same result both protocols).

**Exact missing permission:** outbound network access (TCP or UDP) to Cloudflare's edge on port
**7844** from this sandbox. Only outbound TCP/443 (via the pre-configured HTTP CONNECT proxy) is
reachable. No combination of `cloudflared` flags (`--protocol quic` default, `--protocol http2`)
routes its control connection over port 443, so no cloudflared Quick Tunnel can be established here
regardless of credentials — this is not a credentials problem, `cloudflared` itself needed no
account or key.

**Was not attempted (and would not help):** `ngrok` and similar tunnel services are explicitly
named in the same environment doc as unsupported for the same reason (non-443 ports /
certificate-pinned clients), so they were not tried — retrying with a different tunnel tool would
reproduce the identical block.

## 5. Status: BLOCKED

**DEPLOY (shareable https URL) = BLOCKED.** Missing permission: outbound TCP/UDP egress on port
7844 to Cloudflare's edge network (or equivalent egress for any other tunnel provider — same
proxy-doc restriction applies to all of them). This environment's egress proxy only permits
port 443. There is no in-environment workaround; a human running this same repo checkout on a
network without that restriction (i.e., their own laptop, exactly as architecture.md describes the
in-person demo) would see `cloudflared` connect immediately — the binary and the local app are both
proven working, only the egress port is closed here.

**LOCAL (`npm run build && npm start`) = WORKING, verified live in this session** (see §1). This is
a deploy-tooling/network gap in this sandbox, not a product gap — qa.md's full AC-1..AC-14 pass
stands.

### Exact commands a human can run to finish this (on a normal laptop/network)

```bash
cd /home/user/hack
npm install
npm run build
npm run seed --workspace server
NODE_ENV=production npm start &     # or in a separate terminal, no `&`

# separate terminal — get the cloudflared binary if not already installed, e.g.:
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:8080
```

`cloudflared` will print a line like `https://<random-words>.trycloudflare.com` — that is the
`preview_url`. No account, login, or API key is needed for this Quick Tunnel path.

---

## 6. Rollback / "API down" demo fallback

The product's own tamper/reset controls double as the rollback story — this is not a separate
system:

- **App-level "down" demo (primary, already built, no extra recording needed):** the SIMULATOR
  CONTROLS panel's kill switch (`POST /api/sim/kill/:centerId`) *is* the "API/center down" scenario
  the product is built to demonstrate — a real missed-heartbeat detection opens a real incident,
  freezes real sessions, and `POST /api/sim/reconnect/:centerId` recovers them. This is the intended
  golden path, not a failure fallback, and was re-verified end-to-end in qa.md.
- **Full hard reset if state gets confusing mid-demo:**
  `npm run reset --workspace server` (deletes `data/sentinel.db`, re-migrates, re-seeds) or, without
  restarting the process, `POST /api/sim/reset`.
- **If the live server itself becomes unreachable during a real presentation** (laptop crash,
  network flake): there is no recorded video fallback in this repo yet
  (`demo/fallback-run.mp4` referenced in architecture.md's folder map has not been produced —
  that is demo-director's SHOW-phase deliverable, out of scope for this DEPLOY pass). Until that
  exists, the fallback is: re-run §1's four commands, which take well under a minute and always
  reproduce the identical seeded state (deterministic `SIM_SEED`).
- **If the shareable tunnel URL is unreachable at judging time** (e.g. this same port-7844
  restriction on the judging network): fall back to presenting on `http://127.0.0.1:8080` directly
  on the presenting laptop, which is the architecture's actual documented primary path (§9: "no
  cloud target ... required — in-person team-station judging").

---

## 7. Conductor note

`STATE.md` `preview_url` has been set to `BLOCKED: outbound TCP/UDP port 7844 to Cloudflare edge
not permitted in this sandbox (HTTP-CONNECT-only egress proxy, port 443 only) — see deploy.md §4-5`.

This is a sandbox network limitation, not a missing credential and not a product defect:
- The **local product is fully built, seeded, and verified working** end-to-end in this same
  session (§1), consistent with qa.md's AC-1..AC-14 PASS. The `cloudflared` binary itself required
  no account/API key and installed cleanly — the block is purely this sandbox's egress port policy.
- No further automated retry will change the outcome inside this sandbox — this needs either (a) a
  human running §5's commands on an unrestricted network, or (b) a conductor decision to proceed to
  SHOW/SUBMIT on the strength of the local build + this documented, one-command deploy path, per
  CLAUDE.md's own instruction: "Blocked (not done) if this environment cannot deploy. Record the
  exact missing credential/command. Do not pretend DEPLOY succeeded."
