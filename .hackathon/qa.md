# QA log

## ui-polish

Phase HARDEN, run by ui-polish, 2026-09-19. Scope: visual consistency pass on the golden-path
screens only — `web/src/routes/ControlTower.tsx`, `web/src/routes/Audit.tsx`, and the components/
styles they use (`web/src/components/*.tsx`, `web/src/styles/*.css`). Read `design.md` and
`brand.md` first. Touched `web/src/**` only (frontend-owned); no new pages, no animation libraries,
no structural redesign.

### What was already right (left untouched)

The prior frontend-builder pass had already implemented most of design.md §5's rules correctly: 8px
spacing scale via CSS variables, a single forest-green brand accent (`--color-accent`) used
consistently for links/buttons/selected states, AA-checked status colors (darkened amber per
design.md §6), monospace for hashes/arithmetic, and a real two-column → single-column responsive
layout at 1024px. This pass found small, genuine inconsistencies rather than a broken base.

### Changes made

1. **Focus ring was a stray blue (`#1a73e8`), the one color in the app not from brand.md's
   single-accent palette.** Changed `--focus-ring` in `web/src/styles/tokens.css` to use
   `var(--color-accent)` (forest green) so every keyboard-focused control matches the brand accent
   instead of introducing a second, unrelated color.
2. **No hover/active states existed on any button anywhere** (`--color-accent-strong` was defined in
   tokens.css but never referenced — a dead token). Added `:hover` states for `.btn`, `.btn--secondary`,
   and `.btn--danger` in `web/src/styles/app.css`, using the existing `--color-accent-strong` token and
   a new `--color-bad-strong` (darker red) token for the danger variant, so buttons no longer feel
   static/dead on a demo laptop with a real cursor.
3. **Primary CTA emphasis, per the task brief:** Kill Switch (`web/src/components/SimulatorControls.tsx`)
   now uses the same `.btn--large` sizing already applied to Audit's "Verify Chain Integrity" button,
   so both golden-path primary CTAs share one consistent "this is the button that matters" size/weight
   treatment, while Reconnect/Reset Demo stay at normal size as secondary actions in the same panel —
   this reinforces the hierarchy without changing the red-quarantine SimulatorControls convention design.md
   requires.
4. **`ConnectionPill`'s inline "Retry" control had zero CSS reset**, so it rendered with native browser
   button chrome (grey box/border) inside a colored pill — an obvious visual clash. Reset it to a plain
   underlined text link matching the pill's own text color (`web/src/styles/app.css`,
   `.connection-pill__retry`).
5. **`VerdictCard`'s input `<dl>` had no margin reset on `dt`/`dd`**, so browser default `dd` indentation
   (~40px) misaligned the Sessions Affected / Avg Frozen Time / etc. grid — fixed with explicit
   `margin: 0` plus a small type-scale distinction (uppercase muted label vs. bold value) so the
   four-input grid reads cleanly instead of drifting right.
6. **Two ad-hoc inline `style={{...}}` overrides were replaced with real CSS classes** for consistency
   and to remove an actual bug: `web/src/routes/Audit.tsx`'s divider before the chain table had an
   inline `style` that silently overrode the `.simulator-controls__divider` class's intended dashed-red
   "quarantine" treatment with a plain solid grey line — removed the inline override so the divider
   matches the same red-quarantine visual language used everywhere else SimulatorControls appears (a
   design.md §5 consistency requirement, not just tidiness). `web/src/routes/ControlTower.tsx`'s
   action-error banner and SimulatedBadge spacing hack were moved into two small named classes
   (`.escalation-banner--neutral`, `.badge-row`) instead of inline styles, same visual result, easier
   to maintain.
7. Added a `:hover` border-highlight on `.center-card` (was previously only interactive via
   click/selected state, with no affordance that the whole card is clickable).

No copy was changed (copy.md is copywriter-owned), no new components/pages were added, no color
outside brand.md's forest-green + neutral + red/amber/green status palette was introduced, and no
JSX structure/logic changed — only `className` swaps, two new CSS custom properties
(`--color-bad-strong`, reusing the already-defined but previously-dead `--color-accent-strong`), and
new/edited CSS rules.

### Verification

**Disclosed limitation:** this agent's toolset in this session does not include a shell/Bash tool —
only file read/write/edit/grep/glob — so `npm run typecheck --workspace web` and
`npm run build --workspace web` (the two commands the task asked to be run) could **not** be executed
directly by this pass. What was done instead, as a substitute, before and after every edit:
- Read back every edited file in full after each `Edit` call to confirm exact JSX/TSX syntax
  validity (matching braces/tags, correct string literals) by eye.
- All changes are CSS-only (`web/src/styles/*.css`) or `className`-only swaps in `.tsx` files —
  no new imports, no prop/type changes, no JSX structural changes — so there is no plausible new
  TypeScript type error surface introduced. The only non-className TSX edits were: removing one
  inline `style={{...}}` prop (Audit.tsx divider), removing one inline `style` object and replacing
  a wrapping `<div>`'s className (ControlTower.tsx badge row/error banner), and adding one extra
  class token to an existing `className` string (SimulatorControls.tsx Kill Switch button) — all
  mechanically safe, no new identifiers referenced that don't already exist.
- Grepped for any remaining stray inline `style=` attributes and blue/non-brand hex colors in
  `web/src/**` after the edits to confirm none were reintroduced.

**Action required by whoever runs GIT/HARDEN next:** please actually run
`npm run typecheck --workspace web && npm run build --workspace web` (and ideally
`npm run check:offline --workspace web`) before this lands, since this pass could not execute them.
Given the narrow, additive nature of the changes (no logic/type changes, only CSS + className edits),
risk of a real failure is low, but it has not been machine-verified this pass.

### Files touched

- `web/src/styles/tokens.css`
- `web/src/styles/app.css`
- `web/src/routes/ControlTower.tsx`
- `web/src/routes/Audit.tsx`
- `web/src/components/SimulatorControls.tsx`

## qa-demo-path

Phase TEST, run by qa-demo-path, 2026-09-19. Judged as a tired sponsor with 90 seconds. Ran the
product for real from a clean rebuild — did **not** rely on the earlier passes' logs above, though
results corroborate them.

**Environment/commands executed, in order:**
```
rm -f server/data/sentinel.db
npm run build                       # both workspaces — PASS, no errors
npm run seed --workspace server     # PASS — "Seeded 8 centers, 24 sessions, 70 answer-save
                                     #   checkpoints, and one resolved backstory incident..."
npm start                           # NODE_ENV=production, root script — PASS, listens on :8080
```
Then hit it exactly as a judge/presenter would: curl for `/`, the built JS asset, `/audit` SPA
fallback, `GET /api/state`; `POST /api/sim/kill/:id` → wait → `GET /api/state`; `POST
/api/sim/reconnect/:id` → wait → `GET /api/state`; `POST /api/audit/verify` → `POST
/api/sim/tamper` → `POST /api/audit/verify` → `POST /api/sim/reset` → `POST /api/audit/verify`; a
raw `ws` client on `/ws` to confirm live push events. Also statically read every `web/src/**`
component/route file to sanity-check the actual rendered UI logic, since **no browser automation
tool (playwright/puppeteer) is installed in this environment** — this is a real, disclosed gap; the
below is HTTP/WS-verified truth plus code-reading for the UI layer, not a screenshot-verified pass.

### Overall verdict: **NO P0s found. Golden path is real and fast.** Two P1s (README staleness /
missing seed step; stale `/incidents/:id` step in design.md's script), a handful of P2s below.

### Golden-path step-by-step (design.md §1, steps 1–9)

| # | Step | Result | Timing |
|---|---|---|---|
| 1 | Land on `/`, see 8 healthy centers + framing header + SimulatorControls | **PASS** | `/` → HTTP 200 real built `index.html` (`<title>Sentinel — Exam Integrity Control Tower</title>`, real `<script>`/`<link>` refs to hashed bundle, not blank); `GET /api/state` in 8ms returns 8 real centers all `healthy`, riskScore 0 (except the seeded backstory center C4 at 15, itself correct — a resolved incident leaves a small residual score) |
| 2 | Pick a center, click Kill Switch | **PASS** | `POST /api/sim/kill/C1` → `{"ok":true}` |
| 3 | Center flips red, incident row created within ~1–2s | **PASS** | 2s after kill: C1 `status:"down"`, `riskScore:90`, new incident `INC-0002` `classification:"Connectivity Loss"`, `severity:"medium"`, `detailJson` shows a real `missed_heartbeat` detection signal — not short-circuited by the kill call itself |
| 4 | All 3 sessions at that center freeze, banner + ledger checkpoint per session | **PASS** | All 3 C1 sessions `state:"frozen"`; `recentCheckpoints` shows 3 new `kind:"freeze"` rows, each with correct `prevHash`→`hash` chain linkage (verified by hand, e.g. session 1's freeze row's `prevHash` matches its prior `answer_save` row's `hash`) |
| 5 | Click Reconnect, sessions resume, time restored, resume checkpoints appended | **PASS** | `POST /api/sim/reconnect/C1` → 2.5s later: sessions `state:"resumed"`, `frozenMsTotal:18018` (~18s, matching real elapsed wall-clock frozen time), `remainingMs` correctly reflects restored time; incident auto-closed (`status:"resolved"`) |
| 6 | Click incident row → `/incidents/:id`, see VerdictCard with rule/inputs/arithmetic | **PARTIAL / design-drift, not a functional bug** | There is **no `/incidents/:id` route and no IncidentTimeline component** — `web/src/router.tsx`/`App.tsx` only wire `/` and `/audit`; any other path falls back to `/`. This is a **documented, reasoned deviation**: decision.md's AC-10 only requires `/` to be self-sufficient for the whole arc with `/audit` as the one required stop, and design.md §4 explicitly allows the VerdictCard to render "inline on Control Tower escalation banner" instead. In practice the build took the inline option — `VerdictCard` renders directly on `/` under a "Verdict" panel next to the selected center, no navigation needed. Verified live: after reconnect, a real computed verdict appeared (`decision:"no-action"` for my quick 18s freeze test; the seeded backstory incident at C4 shows `decision:"partial-extension"` with full `rule`/`inputs`/`arithmetic`/`cost_avoided` — e.g. `"47000ms frozen > 30000ms threshold", "0 checkpoints lost", "-> PARTIAL EXTENSION +47s"`, cost-avoided ₹17,850 clearly labeled "illustrative"). **This satisfies AC-6/AC-10 as written, but design.md's own numbered demo script (step 6) describes a click-through that does not exist in the shipped UI** — a presenter who tries to click an "incident row" that isn't there mid-demo will look confused. Flagged as P1 below (documentation/script drift, not a broken feature). |
| 7 | Go to `/audit`, click Verify Chain Integrity → PASS | **PASS** | `/audit` → HTTP 200 via SPA fallback; `POST /api/audit/verify` → `{"ok":true}` in 13ms — comfortably "near-instant" per design.md's <1s bar |
| 8 | Click Tamper (simulator) in quarantined panel | **PASS** | `POST /api/sim/tamper` → `{"tampered":true,"checkpointId":242,"centerId":"C7","seq":31}`; server-side `pickTamperTarget()` always targets the single latest checkpoint overall (`ORDER BY id DESC LIMIT 1`), so it's deterministic and always within the client's `recentCheckpoints` (capped at 50, newest-first) — the broken row will visually highlight in the `/audit` chain table in the normal case |
| 9 | Click Verify again → FAIL, exact broken row shown | **PASS** | `POST /api/audit/verify` → `{"ok":false,"brokenAt":{"centerId":"C7","rowId":242,"seq":31,"expectedHash":"...","actualHash":"..."}}` in 9ms. `Audit.tsx`'s FAIL banner renders the exact center/seq/expected/actual hashes as monospace text regardless of the chain table's scroll state, and the `ChainTable` component highlights the matching row red when it's present in the (client-capped) recent list. Reset (`POST /api/sim/reset`) → verify → `{"ok":true}` again — full PASS→FAIL→PASS cycle confirmed, resettable without restarting the server (AC-12). |

### Acceptance criteria (decision.md AC-1..AC-14)

| AC | Result | Evidence |
|---|---|---|
| AC-1 (≥6 centers, live health within 2s) | **PASS** | 8 centers returned, all healthy at rest, `/api/state` responds in single-digit ms |
| AC-2 (Kill → red + incident within 2s) | **PASS** | confirmed within a 2s sleep window above |
| AC-3 (sessions → frozen within 2s, banner) | **PASS** | confirmed same window; `CandidatePanel.tsx` renders the exact "Center disrupted. Your progress is saved. Timer paused. Do not refresh." banner for `frozen` state |
| AC-4 (≥1 checkpoint per session pre-freeze, hash visible) | **PASS** | genesis + answer_save checkpoints exist per session before freeze; hashes present in `recentCheckpoints` and in `LedgerPanel`/`ChainTable` UI (hash shown truncated with full value in `title` attr) |
| AC-5 (Reconnect → resumed, remaining time restored) | **PASS** | `frozenMsTotal` and `remainingMs` both reflect real elapsed frozen duration, server-computed only (client never counts its own authoritative clock — `SessionClock` snaps to server value on every push per `useEffect` dep array) |
| AC-6 (verdict computed from real data, rule/inputs/arithmetic/cost-avoided rendered) | **PASS** | verified both live (my 18s test → `no-action`) and seeded backstory (47s → `partial-extension`, ₹17,850 illustrative cost avoided) |
| AC-7 (`/audit` verify PASS on clean chain) | **PASS** | `{"ok":true}` |
| AC-8 (post-tamper verify FAIL with exact broken row) | **PASS** | `{"ok":false,"brokenAt":{...}}` with center/seq/expected/actual hash all present |
| AC-9 (full loop live, one laptop, network disabled) | **PASS** | entire arc run over local HTTP/WS only; `check:offline` (below) confirms zero external origins in the built bundle |
| AC-10 (`/` self-sufficient, only `/audit` requires navigation) | **PASS** | confirmed by code reading — `ControlTower.tsx` renders CenterGrid + SimulatorControls + CandidatePanel + LedgerPanel + inline VerdictCard, no other navigation required |
| AC-11 (core loop <60s) | **PASS, with large margin** | kill→incident detected ≈2s, reconnect→resumed+verdict ≈2.5s; the full kill→verdict loop completes in well under 10s server-side. The *human* click-and-narrate time is the real constraint, not the system — comfortably inside 60s for any reasonably paced presenter |
| AC-12 (deterministic seed, resettable without server restart) | **PASS** | `POST /api/sim/reset` truncates+reseeds live; re-ran seed twice against a scratch DB, identical shape both times; chain re-verifies PASS after reset |
| AC-13 (every simulated surface visibly labeled) | **PASS** | `SimulatedBadge` rendered on the Control Tower next to the center grid; `SimulatorControls` panel headed "SIMULATOR CONTROLS — not part of the production system" appears identically on both `/` and `/audit` |
| AC-14 (zero outbound network at runtime) | **PASS** | `npm run check:offline` (re-run this session, see below) — PASS, no external origins in `web/dist` |

### Empty / error / loading states — checked?

- **Empty (`centers.length === 0`):** checked by code reading (`CenterGrid.tsx`, `ControlTower.tsx`) — correct copy shown ("No exam data yet. Run `npm run seed` to start the demo."), no broken skeleton grid. Could not force this state live without deleting all seeded data mid-review, but the guard is a simple, obviously-correct length check.
- **Loading (`state === null`, pre-hydrate):** `CenterGridSkeleton`/`VerdictCardSkeleton` render grey placeholder cards, no shimmer, matches design.md. Confirmed by code reading; real-world load in this environment is sub-10ms so this state is visually imperceptible on a local demo (as intended).
- **Error / WS drop → POLLING:** `useLiveState.ts` degrades cleanly to `POLLING (2s)` on WS close/error/timeout without throwing, verified the reducer logic is shared between the WS-push and poll-snapshot code paths (no second code path to rot). Did not physically kill the WS mid-session to watch the pill flip in a real browser (no browser tooling available) — this is a code-verified pass, not a rendered-screenshot pass. Recommend a human do one real-browser dry run before the actual demo to eyeball the POLLING pill and the escalation banner's `aria-live` announcement timing.
- **Verify-banner neutral/error states:** code-verified — "Not Yet Verified" grey banner before first click (never a false PASS default, per design.md), and a distinct grey "Could not reach server. Try again." banner for a genuine fetch failure, visually separate from the red FAIL state, as required.

### Mobile / narrow viewport

Not applicable per design.md §7 ("No mobile-specific layout/breakpoints below ~768px — this runs on
one presenter laptop") — explicitly out of scope by design, not a QA gap. `app.css` does have a
1024px breakpoint for the two-column→single-column layout switch, which is the one responsive rule
design.md actually asks for; not independently re-verified in a resized browser window (no browser
tooling), but the CSS itself matches the documented rule.

### Secrets in repo?

**None found.** `git ls-files` shows only `.env.example` tracked (no `.env`); grepped the whole
tree (excluding `node_modules`) for api-key/secret/password/token/private-key patterns — zero real
hits, only a comment in `.env.example` itself stating "No secrets exist in this project." `.gitignore`
correctly excludes `.env`, all `*.db*` files, and `*.log`.

### Can a stranger start from README?

**Mostly yes, but with a real gap — P1.** `README.md`'s "Run locally" section (`npm install` → `cp
.env.example .env` → `npm run build && npm start`) **does work exactly as documented** — verified by
running that literal sequence from a clean `rm -f server/data/sentinel.db` state: build passes,
server boots, `/` serves 200, `/api/state` returns 8 real healthy centers. **But two things will
mislead or shortchange a stranger:**
1. README's status line still reads **"Status: scaffold only. Backend/frontend implementation
   lands next"** — stale by several build phases. A judge/teammate reading the README before
   running anything will believe the product isn't built yet.
2. The "Run locally" quickstart never calls `npm run seed` — it's listed later only under "Demo
   utilities" as if optional. Confirmed live: booting via the documented quickstart alone
   auto-seeds through `Simulator.start()`'s idempotent empty-DB check, but that path uses the
   **plain/bare `repo.seedScenario()`** (8 healthy centers, sessions just started, only genesis
   checkpoints) — **not** the richer, intentional demo fixture `scripts/seed.ts` produces (70
   answer-save checkpoints, one pre-resolved "backstory" incident + computed verdict at
   Indore-Rajwada). A stranger following the README literally gets a working but visibly blander
   dashboard than the one every other build pass in this repo's own qa.md log assumed was the demo
   starting state, and would not see a live example of a resolved verdict without triggering their
   own kill→reconnect cycle first.

### Real bugs / risks found this pass

- **P1 — README is stale and omits the seed step from the primary quickstart.** Fix: update the
  status line, and move `npm run seed` into the "Run locally" sequence (between build and start, or
  note that `npm start` auto-seeds the *plain* scenario and `npm run seed` is required for the
  intended "lived-in" demo state).
- **P1 — design.md's golden-path step 6 ("click the incident row in IncidentTimeline → navigate to
  `/incidents/:id`") describes UI that does not exist in the shipped build.** The actual UI
  satisfies the underlying acceptance criteria (AC-6, AC-10) via an inline VerdictCard on `/`
  instead — which is arguably a *better* demo (zero navigation), but the design doc itself should be
  corrected (or the presenter must be explicitly briefed) so nobody tries to click a nonexistent
  incident row live in front of judges.
- **P2 — Tamper always targets the single latest checkpoint fleet-wide, and the client only keeps
  the newest 50 checkpoints in `recentCheckpoints`.** With the simulator ticking ~1x/sec and
  producing multiple checkpoints per tick across 8 centers, roughly 15–20 seconds of presenter delay
  between clicking Tamper and clicking Verify could scroll the tampered row out of the visible
  `ChainTable`'s highlighted set (though the FAIL banner's text — center/seq/expected/actual hash —
  is always correct regardless, since it comes straight from the server response, not from the
  client-filtered table). Low risk for a fast 90-second demo, but worth knowing if a presenter
  pauses too long between the two clicks.
- **P2 — `verify-chain` timing note:** both PASS and FAIL responses returned in single-digit
  milliseconds in this environment — well under design.md's "Recomputing N hashes..." >1s fallback
  threshold, so that copy path is effectively dead code for a normal demo (not a bug, just an
  observation that the loading state is unlikely to ever be seen).
- **Disclosed gap, not a new bug:** no headless-browser tooling (playwright/puppeteer) exists in
  this environment, so the actual *rendered* UI (pixel layout, real click interactions, focus rings,
  aria-live announcements) was verified by careful code reading plus full HTTP/WS-level behavior
  verification, not by an actual browser screenshot. This has been a known, repeatedly-flagged gap
  since frontend M1 and integration M1 in the qa.md history above. **Recommend one live human
  dry-run in an actual browser before presenting**, specifically to eyeball: the escalation banner
  appearing/dismissing correctly, the POLLING pill on a real WS drop, and the Tamper→FAIL row
  highlight in the chain table.

### Re-verified repo-wide gates this pass

```
$ npm run check:offline --workspace web    # PASS — no external origins in web/dist
$ npm run typecheck                        # PASS, both workspaces (re-run after rebuild)
```

### Cleanup

Killed the test server process; repo left in the standard demo-ready seeded state (`npm run seed`
re-run as the final action, matching every prior pass's convention) — 8 centers, 24 sessions, one
resolved backstory incident+verdict at Indore-Rajwada, ready for a fresh kill-switch demo on any
other center.

---

## integration - M1 end-to-end

Phase INTEGRATE, run by integration-agent, after backend M1 / frontend M1 / data-seeder passes
above (all read first). Goal: prove the golden path runs as ONE product for real, not by code
inspection, per architecture.md's one-process-serves-API+WS+UI shape (§0, §1, §9).

### Starting state found

`server/src/index.ts` already imported nothing from a `static.ts` and `server/src/static.ts` did
not exist on disk at the start of this pass — despite a git history that suggested a prior partial
integration attempt (`git log` shows a commit "Backend M1 verified end-to-end via live HTTP; static
serving added" mentioning `server/src/static.ts` "(in progress)"). Verified by reading the actual
files before editing (Read tool, not `git show`) — the gap was real in the working tree, not just in
old history. So: **static UI serving was not wired.** This is squarely this agent's owned file per
architecture.md §3 (`server/src/static.ts` — integration-agent) and a real M1/AC-9 gap (one process
must serve API + WS + built UI), so it was built now.

### Gaps found and fixed (this pass's actual glue work)

1. **`server/src/static.ts` did not exist.** Created it: `@fastify/static` serving `web/dist` from
   the compiled `dist/server/src/static.js` location (path computed via `import.meta.url`, 4 levels
   up to repo root + `/web/dist` — verified against the actual `tsc` output layout, not assumed), plus
   a `setNotFoundHandler` SPA fallback that serves `index.html` for any non-`/api`, non-`/ws` GET so
   the client router (`/`, `/audit`) works on a hard refresh/direct link.
2. **`server/src/index.ts` never imported or registered it.** Wired `registerStatic(app)`, gated on
   `config.nodeEnv === "production"` and registered *after* all API routes so `/api/*` 404s still
   behave normally when unmatched, and *before* `simulator.start()`.
3. **The documented single command silently did not serve the UI.** README/architecture.md's
   contract is "`npm run build && npm start` → `http://127.0.0.1:8080`" serving API+WS+UI. But
   `server/package.json`'s `"start"` script was `"node dist/server/src/index.js"` with no
   `NODE_ENV`, and `config.ts` defaults `NODE_ENV` to `"development"` when unset — so running the
   exact documented command would boot the API+WS fine but silently skip static registration, and a
   judge hitting `/` would get a 404, not the app. Fixed by changing the `start` script to
   `"NODE_ENV=production node dist/server/src/index.js"`. This is the one non-trivial glue bug this
   pass found — everything else (routes, WS shapes, `lib/api.ts` route names) already matched between
   `web/**` and `server/**` with no adapter needed.

### Commands run (this pass), against the exact documented golden path

```bash
$ npm run build                                   # root, both workspaces
# → web: tsc --noEmit && vite build → dist/index.html + assets (247 kB js / 9.97 kB css)
# → server: tsc -p tsconfig.json && copy-migrations → dist/server/src/**, dist/server/src/static.js
# → PASS, no errors

$ rm -rf server/data data
$ SENTINEL_DB_PATH=./data/sentinel.db npm run seed --workspace server
# → real local dev DB at server/data/sentinel.db (workspace scripts run with cwd=server/, so the
#   *default* SENTINEL_DB_PATH used by `npm start` and this seed invocation resolve to the same file)
# → "Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, and one resolved backstory incident
#    at Indore - Rajwada (INC-0001 -> partial-extension, 3 sessions affected)."

$ npm start                                        # root — exactly the README-documented command
# → "> server@0.1.0 start" / "> NODE_ENV=production node dist/server/src/index.js"
# → "[sentinel] listening on http://127.0.0.1:8080 (production)"   ← confirms production mode with
#   NO manual env override, i.e. the documented command now actually works as documented.

$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/
# → HTTP 200 — built React index.html served by the same process, same port, as architecture.md §0
#   requires ("the 'deploy' is npm run build && npm start, one process, one port")
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/assets/index-<hash>.js
# → HTTP 200 — JS bundle served
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/audit
# → HTTP 200 — SPA fallback: a non-file GET path resolves to index.html so the client router handles it

$ curl -s http://127.0.0.1:8080/api/state
# → real seeded fleet: 8 centers, 24 sessions, 1 resolved incident (backstory), 1 verdict — not a stub

$ curl -s -X POST http://127.0.0.1:8080/api/sim/kill/C2
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C2 status 'down', riskScore 90, a new incident opened (status:'open', classification
#   'Connectivity Loss', detailJson {"signal":"missed_heartbeat",...} — real detection, not
#   short-circuited by the kill handler), all 3 C2 sessions state:'frozen'

$ curl -s -X POST http://127.0.0.1:8080/api/sim/reconnect/C2
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C2 status 'healthy', all 3 C2 sessions state:'resumed', incident status:'resolved' with
#   closedAt set, a new verdict entry present (decision computed from real frozen-duration/
#   affected-count inputs, e.g. {"decision":"no-action","reasoning":{"policy_version":"v1",
#   "rule":"frozen_ms <= FREEZE_THRESHOLD_MS ...","inputs":{...},"arithmetic":[...],
#   "cost_avoided":{...,"basis":"illustrative ..."}}})

$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify           # → {"ok":true}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/tamper             # → {"tampered":true,"checkpointId":...,"centerId":"C5","seq":...}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify           # → {"ok":false,"brokenAt":{"centerId":"C5","rowId":...,"seq":...,"expectedHash":"...","actualHash":"..."}}

$ node -e '...ws = new WebSocket("ws://127.0.0.1:8080/ws")...'
# → WS OPEN, then live "checkpoint.appended" / "session.updated" events streamed in real time from
#   the running simulator tick loop — confirms the WS broadcast path, not just the HTTP poll path

$ npm run typecheck        # → PASS, both workspaces
$ npm test                 # → 16/16 pass (chain/clock/verdict, node:test via tsx)
$ npm run check:offline    # → PASS, no external origins in web/dist
```

### Result

- **Golden path proven end-to-end as one product**, exactly via the README/architecture-documented
  `npm run build && npm start` command with no manual env overrides: one Fastify process on `:8080`
  serves the REST API, the raw-`ws` WebSocket broadcast, and the built React SPA (verified: `/` →
  200 real `index.html`, hashed JS asset → 200, `/audit` client route via SPA fallback → 200).
- Full AC-2/AC-3/AC-4/AC-5/AC-6/AC-9 arc (kill → real missed-heartbeat detection → incident opened →
  sessions frozen with real hash-chained checkpoints → reconnect → sessions resumed with restored
  time → incident resolved → verdict computed with rule/inputs/arithmetic/cost-avoided) exercised
  live over HTTP against the running production-mode process, twice (once during manual `curl`
  exploration, once again against the exact documented command) — both runs landed correctly.
- Full AC-7/AC-8/AC-12 audit cycle (verify PASS → in-app tamper → verify FAIL with exact broken
  row/expected/actual hash → reset → verify PASS again) confirmed live over HTTP.
- WS broadcast path confirmed live (not just the HTTP hydrate/poll path) — a raw WS client connected
  to `/ws` received real `checkpoint.appended`/`session.updated` events streamed by the running
  simulator tick loop.
- `lib/api.ts` (frontend) route names/methods checked one-by-one against the actual registered
  Fastify routes (`routes/state.ts`, `sim.ts`, `audit.ts`, `verdicts.ts`) and against `Hub`'s WS
  broadcast — every route frontend-builder coded against exists and returns the shape
  `useLiveState.ts`'s reducer expects (`ApiState`/`WsEvent` from `shared/types.ts`). No route
  mismatch found; no adapter/shim code was needed on the API-shape side.
- `.env.example` reviewed against `config.ts` — already complete (13 vars, all with defaults, no
  secrets) from the scaffold pass; no changes needed.
- `npm run typecheck` / `npm test` / `npm run check:offline`: all PASS after the fix above.
- Server process and all test data cleaned up after verification; `server/data/sentinel.db` was
  re-seeded to the standard fixed scenario as the last action of this pass so the repo is left in the
  demo-ready starting state (8 centers healthy except the pre-resolved C4 backstory incident, ready
  for a fresh kill-switch demo on any other center).

### What was NOT faked

No external API is in this system (architecture.md §2/§7 — hard ban, no keys, no accounts, no
network at runtime). There was nothing to switch between "live" and "mock" for — the only "external"
surface is the simulator, and it is honestly labeled as simulated everywhere per AC-13, not
disguised as live. `npm run check:offline` re-confirms zero outbound origins in the built bundle.

## backend M1

Phase BUILD, M1 "Checkpoint parity" backend, run by backend-builder. Owned path: `server/**`
(architecture.md §3). Did not touch `web/**`, `shared/types.ts`, or any `.hackathon/*.md` besides
this file. Files existing before this pass: `server/package.json`, `server/tsconfig.json`,
`server/src/db/connection.ts`, `server/src/db/migrate.ts`, `server/src/db/migrations/001_init.sql`
(integration-agent scaffold, verified in "integration - scaffold" above).

Note: this session found the repo already at a state where an earlier pass of this same build had
apparently landed and committed (`git log` shows `b8a87df "M1 golden path: backend + frontend
built"` and a follow-up fix commit, both attributed to this session). This pass re-derived the
backend independently against architecture.md/decision.md/plan.md/spec-a.md/shared/types.ts and the
result matched almost exactly (byte-identical on most files) — the one live discrepancy was
`server/scripts/seed.ts` and `server/src/sim/scenario.ts`, which a concurrently-running data-seeder
pass had already enhanced (backstory incident, answer-save history, `BACKSTORY_CENTER_INDEX`). Those
two files were left as data-seeder produced them (their owned paths per architecture.md §3) rather
than being overwritten back to a plainer version — see "## data-seeder" below for what's in them.

### Files built (first-write order, chain.ts first per architecture.md §14)
- `server/src/domain/chain.ts` + `server/test/chain.test.ts` — `canonicalJson`, `hashEntry`,
  `buildNextEntry`, `verifyChain`. Pure/DB-free by design so it's unit-testable standalone.
- `server/src/domain/clock.ts` + `server/test/clock.test.ts` — `remainingMs`/`freezeFields`/
  `resumeFields`, the one authoritative exam-clock formula (architecture.md §5).
- `server/src/domain/verdict.ts` + `server/test/verdict.test.ts` — `computeVerdict()`, fixed
  `reasoning_json` shape (`policy_version`/`rule`/`inputs`/`arithmetic`/`cost_avoided`), mandatory
  honesty `basis` string (A6).
- `server/src/domain/sessions.ts`, `server/src/domain/incidents.ts` — pure state-machine/
  classification helpers.
- `server/src/config.ts` — env var parsing + defaults, names matching `.env.example` exactly.
- `server/src/sim/rng.ts` — mulberry32 seeded PRNG (`Math.random()` never used anywhere in `server/**`
  — confirmed by grep, see below).
- `server/src/sim/scenario.ts` — fixed center/candidate/question fixtures (later extended by
  data-seeder).
- `server/src/sim/simulator.ts` — seeded tick loop; `kill()`/`reconnect()`/`reset()` only toggle a
  heartbeat-suppression flag or truncate+reseed. Incident open/close is driven by a real
  missed-heartbeat check inside the same tick loop (`detectIncidents`/`recoverIncidents`), never
  short-circuited by `kill()`/`reconnect()` directly — matches the task brief's honesty requirement
  and architecture.md §13.
- `server/src/repo.ts` — all SQL (only file besides `db/connection.ts` importing `better-sqlite3`).
  Freeze-all-sessions-at-a-center, resume-all, and checkpoint append each run inside one
  `db.transaction()`. Includes the A2 raw-`UPDATE` tamper path (`tamperCheckpoint`) and
  `getApiState()` (the `GET /api/state` aggregate, architecture decision #2).
- `server/src/routes/{state,centers,sessions,incidents,verdicts,audit,sim}.ts` — REST surface per
  spec-a §6 + M5. `/api/sim/*` and `/api/sim/tamper` gated by `ENABLE_SIM_CONTROLS`.
- `server/src/ws/hub.ts` — raw `ws` broadcast; every event payload is a `WsEvent` from
  `shared/types.ts`, itself a subset of `ApiState`.
- `server/src/index.ts` — Fastify entrypoint: `getDb` → `migrate` → `Repo` → Fastify → `Hub` (attached
  to Fastify's already-created `http.Server`, no `app.ready()` ordering issue) → routes → `Simulator`
  → `simulator.start()` → `app.listen()`.
- `server/scripts/verify-chain.ts`, `server/scripts/tamper.ts` — CLI PASS/FAIL and raw-UPDATE-tamper
  paths, zero `sqlite3` CLI dependency (both go through `Repo`/`better-sqlite3` directly, per A2).
- `server/scripts/seed.ts` (initial version, since enhanced by data-seeder).
- `server/package.json`: added a `copy-migrations` step to `build` — `tsc` only emits compiled `.ts`,
  so `db/migrations/*.sql` was missing from `dist/` until this was added; without it, `npm start`
  failed at boot with `ENOENT ... db/migrations` the first time it was tried against a real build.

### Commands run

```bash
$ npx tsx --test server/test/chain.test.ts
# → 8/8 pass (canonicalJson determinism, hashEntry determinism/sensitivity, verifyChain PASS on a
#   clean multi-center chain, verifyChain catches a tampered payload with exact centerId/rowId/seq/
#   expectedHash/actualHash, verifyChain catches a broken prev_hash link, genesis shape)

$ npm test --workspace server        # chain + clock + verdict, via tsx --test
# → 16/16 pass, 0 fail

$ npm run typecheck                  # both workspaces
# → server: clean. web: clean.

$ npm run build                      # both workspaces
# → web: vite build OK. server: tsc OK, dist/server/src/index.js present (matches
#   server/package.json's "start": "node dist/server/src/index.js" — confirmed against the actual
#   compiled output, not just assumed).

$ rm -rf server/data && npm start --workspace server   # after build
# → "[migrate] applied: 001_init.sql" then "[sentinel] listening on http://127.0.0.1:8080 (development)"

$ curl -s http://127.0.0.1:8080/api/state
# → real JSON: 8 centers (Bhopal/Indore/Gwalior/Jabalpur/Ujjain/Sagar names), 24 sessions with
#   real remainingMs/serverNow, real genesis checkpoints with real SHA-256 hashes, incidents: [],
#   verdicts: [] (fresh seed) — not a stub.

$ curl -s -X POST http://127.0.0.1:8080/api/sim/kill/C1
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C1 status flips to 'down' (riskScore 90), INC-0001 opened with classification
#   'Connectivity Loss', detailJson shows {"signal":"missed_heartbeat", ...} (real detection, not
#   created by the kill handler), all 3 C1 sessions state='frozen', freeze checkpoints appended.

$ curl -s -X POST http://127.0.0.1:8080/api/sim/reconnect/C1
$ sleep 3 && curl -s http://127.0.0.1:8080/api/state
# → C1 status back to 'healthy', sessions state='resumed', frozenMsTotal restored (~13s in this
#   run), incident status='resolved' with closedAt set, one verdict computed (real
#   frozen-duration/affected-count inputs, decision depended on the random tick timing of this
#   manual run — landed 'no-action' once at 13s frozen, 'partial-extension' in the seeded backstory
#   scenario at a fixed 47s — both are real computations, not hardcoded).

$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":true}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/tamper           # → {"tampered":true,"checkpointId":...}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":false,"brokenAt":{...}}
$ curl -s -X POST http://127.0.0.1:8080/api/sim/reset            # → {"ok":true,"action":"reset"}
$ curl -s -X POST http://127.0.0.1:8080/api/audit/verify        # → {"ok":true}   (PASS again)

$ npx tsx server/scripts/verify-chain.ts   # → "PASS ..." exit 0
$ npx tsx server/scripts/tamper.ts         # → tampers latest checkpoint via raw UPDATE
$ npx tsx server/scripts/verify-chain.ts   # → "FAIL — broken link detected: {...}" exit 1
$ npm run seed --workspace server && npx tsx server/scripts/verify-chain.ts
# → re-seed clears the tamper; PASS again

$ grep -rn "Math.random" server/src server/scripts server/test    # → none (only comments mentioning the ban)
$ grep -rn "sqlite3 " server/src server/scripts server/test       # → none
```

### Result
- `chain.test.ts`: PASS (8/8), run standalone as required, before anything else.
- Full `npm test` (chain/clock/verdict): PASS (16/16).
- `npm run typecheck`: PASS (both workspaces).
- `npm run build`: PASS (both workspaces); confirmed `server/dist/server/src/index.js` exists and
  matches `server/package.json`'s `start` script.
- `npm start` after a clean build: PASS — server boots, migrates, seeds, listens on `:8080`.
- `GET /api/state`: PASS — returns real, non-stub aggregate data.
- Full golden path exercised live over HTTP: kill → real missed-heartbeat detection → incident
  opened → sessions frozen with real checkpoints → reconnect → sessions resumed with time restored
  → incident resolved → verdict computed. All AC-2..AC-6, AC-9 behaviors observed directly, not
  inferred from code reading alone.
- `/api/audit/verify` PASS → `/api/sim/tamper` → `/api/audit/verify` FAIL with exact broken row →
  `/api/sim/reset` → PASS again: full AC-7/AC-8/AC-12 cycle confirmed over HTTP.
- `npm run verify-chain` / `npm run tamper` CLI scripts: PASS/FAIL exit codes confirmed independent
  of the HTTP route (A2's second path, no `sqlite3` CLI anywhere).
- Repo-wide grep gates: no `Math.random()` calls, no `sqlite3` CLI invocations in `server/**`.
- Left `server/scripts/seed.ts` and `server/src/sim/scenario.ts` as data-seeder produced them (see
  "## data-seeder" below) rather than reverting to this pass's plainer initial versions — their
  richer seed (backstory incident, answer-save history) was re-verified against this pass's
  `repo.ts`/`domain/*` unchanged and still builds/tests/verifies clean.
- Not built (correctly out of M1 scope per architecture.md §10 gating table / decision.md A1):
  `domain/incidents.ts`'s classification taxonomy beyond a single type (M2 cut-list item 5),
  multi-classification/escalation, `server/src/static.ts` (integration-agent's file, wires
  `@fastify/static` for production — not required for M1's API/WS surface to be provable over curl).
- Cleanup: all `server/data/*` and temporary log files removed after manual testing; nothing left
  running (`node dist/server/src/index.js` processes killed).

## data-seeder

Phase BUILD, data-seeder pass, run after backend-builder's M1 backend landed. Owned files only
(architecture.md §3): `server/scripts/seed.ts`, `server/src/sim/scenario.ts`. Read but did not edit
`architecture.md`, `shared/types.ts`, `server/src/repo.ts`, `server/src/domain/*.ts`,
`server/src/sim/simulator.ts`, `server/src/config.ts`, `server/src/sim/rng.ts`, brand.md.

### What changed
- `server/src/sim/scenario.ts`: added `BACKSTORY_CENTER_INDEX` export (center C4 by default,
  "Indore - Rajwada") documenting which center hosts the pre-seeded incident, kept away from index 0
  so the operator's live kill-switch demo still has a pristine first center. No changes to the
  existing center/candidate/question fixtures — they already used real MP district/city names
  (Bhopal, Indore, Gwalior, Jabalpur, Ujjain, Sagar) and a realistic Indian candidate-name pool with
  `MPO2026-####`-style roll numbers, matching brand.md's "Sentinel" / MPOnline framing.
- `server/scripts/seed.ts`: rewrote to make the golden path look alive from t=0 instead of an empty
  dashboard:
  1. Exam `examStartedAt` is set 22 minutes before seed time (not `Date.now()`), so sessions open
     mid-exam with a partially-consumed clock, not a suspicious fresh boot.
  2. Every session gets 2-4 real `answer_save` checkpoints (deterministic `mulberry32(SIM_SEED)` PRNG
     from `sim/rng.ts` — no `Math.random()`, per architecture.md §13/decision #5) so the ledger and
     candidate panels show real progress, not just genesis rows.
  3. One pre-resolved "backstory" incident is seeded at `BACKSTORY_CENTER_INDEX`'s center using the
     *same* domain functions the live simulator uses (`repo.freezeSessionsAtCenter`,
     `resumeSessionsAtCenter`, `openIncident`, `closeIncident`, `domain/verdict.computeVerdict`,
     `insertVerdict`) — a 47s simulated outage, 3 affected sessions, real hash-chained freeze/resume
     checkpoints, real computed `partial-extension` verdict with cost-avoided arithmetic. Every other
     center is left `healthy`/untouched so the operator can still run the live
     kill -> incident -> reconnect -> recovery -> verdict arc via `SimulatorControls` for the demo.
  No routes/ws/domain files were touched — only the two owned files, calling already-public `Repo`
  methods and already-public domain functions.

### Commands run (against a real local SQLite file, not the dev DB)

```bash
$ npm run build --workspace server
# → tsc -p tsconfig.json && copy-migrations → PASS, no errors

$ rm -f data/sentinel_seedtest.db
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run seed --workspace server
# → Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, and one resolved backstory incident
#   at Indore - Rajwada (INC-0001 -> partial-extension, 3 sessions affected).

$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run verify-chain --workspace server
# → PASS — chain integrity verified across all centers.

# Idempotency: re-ran seed against the same file, then re-verified.
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run seed --workspace server
# → Seeded 8 centers, 24 sessions, 70 answer-save checkpoints, one resolved backstory incident
#   (same shape, new timestamps — truncateAll() runs first, so no duplication/drift).
$ SENTINEL_DB_PATH=./data/sentinel_seedtest.db npm run verify-chain --workspace server
# → PASS — chain integrity verified across all centers.

# Direct DB inspection (better-sqlite3, read-only) to confirm realistic data landed:
$ node -e "... SELECT id,name,status,candidate_cnt FROM centers ..."
# → 8 centers: C1 Bhopal - Arera Colony, C2 Bhopal - MP Nagar, C3 Indore - Vijay Nagar,
#   C4 Indore - Rajwada, C5 Gwalior - City Centre, C6 Jabalpur - Napier Town, C7 Ujjain - Freeganj,
#   C8 Sagar - Civil Lines — all status 'healthy', candidate_cnt 3 each.
$ node -e "... SELECT id,center_id,candidate_name,roll_no,state,frozen_ms_total FROM candidate_sessions LIMIT 8 ..."
# → e.g. S-C1-01 / Aarav Sharma / MPO2026-0001 / active; S-C2-02 / Vivaan Joshi / MPO2026-0005 / active
$ node -e "... SELECT * FROM incidents ..."
# → INC-0001, center C4, opened/closed 47s apart, classification 'Connectivity Loss',
#   severity 'medium', status 'resolved', affected_count 3
$ node -e "... SELECT reasoning_json FROM verdicts ..."
# → decision partial-extension; inputs {affected_candidates:3, max_frozen_ms:47000,
#   avg_frozen_ms:47000, checkpoints_lost:0, threshold_ms:30000, exam_duration_ms:3600000};
#   arithmetic ["47000ms frozen > 30000ms threshold", "0 checkpoints lost",
#   "-> PARTIAL EXTENSION +47s"]; cost_avoided.basis states the INR figure is illustrative (A6).
$ node -e "... SELECT kind, COUNT(*) FROM checkpoints GROUP BY kind ..."
# → answer_save 70, freeze 3, genesis 24, resume 3  (100 total, all real SHA-256 chain entries)
```

### Result
- `npm run build --workspace server`: PASS
- Seed against a real local SQLite file (`SENTINEL_DB_PATH` override, not the tracked `data/sentinel.db`): PASS
- `npm run verify-chain --workspace server`: PASS, both on first seed and after a re-seed (idempotent)
- Direct SQL inspection confirms: realistic MP center names, realistic Indian candidate names + roll
  numbers, one resolved incident with a real computed verdict populated before any operator action,
  100 real hash-chained checkpoints, 7 of 8 centers left pristine for the live kill-switch demo arc.
- No auth exists in this system (architecture.md §7 — "No auth for demo", explicit hard-ban on
  auth/login/roles). No "judge user" was created; nothing to document in deploy.md for credentials.
- Test artifacts (`server/data/sentinel_seedtest.db*`) were removed after verification; `server/data/`
  and root `data/` are gitignored per architecture.md, so no DB files are tracked in git.

## frontend M1

Phase BUILD, M1 "Checkpoint parity" frontend, run by frontend-builder. Built against
`shared/types.ts` as source of truth; `server/**` had no routes/index.ts/ws yet at build time
(only db/connection.ts, migrate.ts, 001_init.sql existed), so the app was verified against a dead
backend — no mocks were added, since the API/WS routes are named by architecture.md §3 and the app
must degrade honestly (ConnectionPill OFFLINE) rather than fake data.

### Files added (web/src/** only)
- `styles/tokens.css`, `styles/app.css` — brand.md forest-green accent + neutrals, 8px grid,
  AA-checked status colors (amber darkened per design.md §6), focus rings, no web fonts.
- `router.tsx` — minimal hand-rolled pushState router (no new dependency; only "/" and "/audit"
  are wired for M1 per design.md §1).
- `lib/api.ts` — typed fetch wrappers for GET /api/state, POST /api/sim/kill|reconnect|reset,
  POST /api/audit/verify, POST /api/sim/tamper, GET /api/verdicts/:id.
- `lib/useLiveState.ts` — WS client (`/ws`) with auto-degrade to 2s polling of GET /api/state after
  a 3s connect timeout or a close/error event; single reducer shared by both the WS event path and
  the poll/snapshot path, per architecture.md §8/§11 risk 3.
- `lib/clock.ts` — display-only duration formatter; the client never computes the exam clock
  (architecture.md §5), it only extrapolates the *display* and snaps to server `remainingMs` /
  `serverNow` on every push.
- `components/`: FramingHeader, ConnectionPill, CenterGrid (+ skeleton), CandidatePanel,
  LedgerPanel, VerdictCard (+ skeleton), SimulatorControls, SimulatedBadge — all copy pulled
  verbatim from `copy.md` (no inline copy authoring; the handful of structural labels not covered
  by copy.md, e.g. table column-adjacent field labels like "Question N", are plain factual UI
  labels, not narrative copy).
- `routes/ControlTower.tsx` (`/`) — self-sufficient for the whole kill→freeze→checkpoint→
  reconnect→resume→verdict arc (AC-10): auto-selects the first center on hydrate, escalation
  banner, SimulatorControls, VerdictCard, CandidatePanel + LedgerPanel scoped to the selected
  center. Loading = skeleton cards (no shimmer). Empty (zero centers) = the copy.md seed message.
  Error/WS-drop = ConnectionPill flips to POLLING/OFFLINE silently, Retry link after 3s offline.
- `routes/Audit.tsx` (`/audit`) — Verify Chain Integrity button (large, top, no-scroll), neutral/
  verifying/PASS/FAIL/error banner exactly per copy.md wording, quarantined red Tamper (simulator)
  control, full chain table with the broken row highlighted on FAIL.
- `App.tsx` — renders ControlTower or Audit based on pathname; unknown paths fall back to `/` since
  M1's route surface is fixed to these two.
- `main.tsx` — now renders `<App />` (replaced the scaffold placeholder), imports the two stylesheets.

### Commands run

```bash
$ npm run typecheck --workspace web
# → tsc -p tsconfig.json --noEmit  → clean, no errors

$ npm run build --workspace web
# → tsc --noEmit && vite build
# → dist/index.html (0.43 kB), dist/assets/index-*.css (9.97 kB, gzip 2.32 kB),
#   dist/assets/index-*.js (247.05 kB, gzip 76.08 kB)
# → built in 1.34s

$ npm run check:offline --workspace web
# → check:offline PASS — no external origins in web/dist

# Manual dev-server smoke (no backend running on :8080):
$ npx vite --port 5183 &
$ curl -s http://127.0.0.1:5183/                 # → 200, index.html served, no server-side crash
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5183/api/state
# → 500 (proxy target :8080 not listening — expected, no backend yet)
```

### Result

- `npm run typecheck` (web): PASS
- `npm run build` (web): PASS
- `npm run check:offline` (web): PASS
- `vite` dev server: starts and serves `index.html` without crashing. Could not run a full headless
  browser render check in this environment (no puppeteer/playwright/jsdom installed and none named
  in architecture.md as a dependency to add). By code inspection: `useLiveState`'s initial
  `getState()` call and its WS-connect-timeout/error/close handlers all route failures through
  `ApiError` → `catch` blocks that set `connection: "offline"` and `error`, never throw during
  render — so with the backend absent (confirmed via the `/api/state` 500 above), the expected
  behavior is `ConnectionPill` = OFFLINE with the seed-message/empty state, not a blank screen or an
  uncaught exception. Recommend integration-agent or test-runner re-verify with a real browser once
  `server/src/index.ts` exists and again with it stopped, to close this gap with an actual rendered
  screenshot.
- Not implemented in this pass (out of M1 scope, deferred to later milestones per architecture.md
  §10 gating table): CenterGrid multi-center fleet view (M1 renders whatever `centers[]` the backend
  returns — no hardcoded count), IncidentTimeline component, `/center/:id`, `/session/:id`,
  `/incidents`, `/incidents/:id` drill-down routes, ConnectionPill's M4-listed polish. `Reset Demo`
  button is wired to `POST /api/sim/reset` even though AC-12 is formally an M2 gating AC, since
  `SimulatorControls`' component inventory (design.md §4) includes it for M1 and it costs nothing to
  wire against the same route the M1 backend must already expose for rehearsal resets.


## integration - scaffold

Phase 0 SCAFFOLD (plan.md T00–T05), run by integration-agent. Environment: Node v22.22.2,
npm 10.9.7, Linux.

### Commands run

```bash
$ npm install
# → added 197 packages, and audited 200 packages in 17s
# → 1 high severity vulnerability (transitive, not addressed — pre-existing advisory noise,
#   not a runtime dependency added by this task; left for security-linter at HARDEN)

$ node -e "console.log(require('better-sqlite3'))"
# → [Function: Database] { SqliteError: [Function: SqliteError] }
# native module loads successfully — no ABI/prebuild failure in this environment.
# (architecture.md §11 risk 5 — node:sqlite fallback plan documented as a comment in
#  server/src/db/connection.ts, NOT implemented, since the primary driver works here.)

# End-to-end smoke: open/create the DB via connection.ts, run migrate.ts, confirm schema.
$ npx tsx <scratchpad>/smoke.mts
# → migrations applied this run: [ '001_init.sql' ]
# → tables: [ 'candidate_sessions', 'centers', 'checkpoints', 'incidents',
#             'schema_migrations', 'sqlite_sequence', 'telemetry_events', 'verdicts' ]
# → SMOKE OK
# (temporary sentinel.db removed afterward; data/ stays empty/gitignored until data-seeder runs)

$ npm run typecheck
# → server@0.1.0 typecheck: tsc -p tsconfig.json --noEmit   → clean, no errors
# → web@0.1.0 typecheck: tsc -p tsconfig.json --noEmit      → clean, no errors

$ npm run build
# → web: tsc --noEmit && vite build → dist/index.html + dist/assets/index-*.js (224 kB, gzip 70 kB)
# → server: tsc -p tsconfig.json → dist/server/src/**, dist/shared/**
#   (rootDir is auto-inferred to the monorepo root because server/tsconfig.json includes
#    ../shared/types.ts for cross-workspace typechecking with no build step for shared/;
#    this means the compiled entrypoint lands at dist/server/src/index.js, not dist/index.js —
#    server/package.json's "start" script is set accordingly:
#    "start": "node dist/server/src/index.js". backend-builder: keep this in mind, or adjust
#    tsconfig later if you want a flatter dist/ layout.)

$ npm run check:offline
# → FAIL on first run: matched http://www.w3.org/... (SVG/XML namespace constants, not network
#   calls) and https://react.dev/errors/... (doc link embedded in a minified React error string).
#   Both are compile-time constants baked into React/DOM internals, never fetched at runtime.
#   Fixed by whitelisting those two known-safe patterns in web/scripts/check-offline.mjs.
# → re-run: PASS — no external origins in web/dist
```

### Result

- npm install: PASS
- better-sqlite3 native module smoke check: PASS (loads directly; also proven via a full
  connection.ts → migrate.ts → schema smoke run)
- npm run typecheck (both workspaces): PASS
- npm run build (both workspaces): PASS
- npm run check:offline: PASS (after whitelisting two false-positive constant strings)
- npm start: NOT YET RUNNABLE — `server/src/index.ts` (boot: migrate → seed → Fastify → ws →
  simulator.start) is backend-builder's file, not created in this scaffold pass by design (task
  scope: "Do NOT implement backend routes, business logic, or frontend UI").

### Scope note

This pass touched only integration-agent-owned paths per architecture.md §3: root `package.json` /
`tsconfig.base.json` / `.env.example` / `.gitignore`, `shared/types.ts`, `server/src/db/connection.ts`
+ `db/migrate.ts` + `db/migrations/001_init.sql`, `web/vite.config.ts` (+ minimal `web/package.json`,
`web/tsconfig.json`, `web/index.html`, `web/src/main.tsx` placeholder, `web/scripts/check-offline.mjs`
as scaffold necessities), `docs/architecture.md` (copy), `README.md` stub. No backend routes,
domain logic, or real UI were implemented — that is backend-builder's and frontend-builder's next
work, per plan.md's fork point after T05.

## test-runner

Ran the full suite live on 2026-09-19 against the current working tree (server/, web/, shared/).

- **`npm test` (root → server workspace, 16 tests):** PASS. All chain/hash, remainingMs freeze/resume,
  and verdict-policy tests (AC-5, AC-6, AC-7, AC-8) pass. `web/package.json` has no `test` script;
  root `npm test` only runs server (`test --workspace server`), matches repo config, not a gap in
  this run.
- **`npm run typecheck` (server + web, via tsc --noEmit):** PASS, zero errors in both workspaces.
- **`npm run build` (web: tsc --noEmit + vite build, then server: tsc + copy-migrations):** PASS.
  `web/dist` produced (index.html + 1 css + 1 js bundle, 247KB/76KB gzip). `server/dist` produced with
  migrations copied to `dist/server/src/db/migrations`.
- **`npm run check:offline` (web):** PASS — `check:offline PASS — no external origins in web/dist`,
  confirms AC-14 (zero outbound network calls) at the build-artifact level.
- **Repo-wide ban: `Math.random(` in `server/src` and `web/src`:** Zero live invocations. The only
  hits are in code comments documenting the ban itself: `server/src/sim/rng.ts:2` and
  `server/src/sim/scenario.ts:8`. `web/src` has zero matches at all. Ban holds.
- **Repo-wide ban: `sqlite3` CLI invocations in scripts:** Zero live invocations anywhere
  (`server/scripts`, `web/scripts`, no other `scripts/` dirs in the tree outside `node_modules`/`dist`).
  Only hits are comments explaining why the CLI is *not* used: `server/scripts/tamper.ts:4-5` and
  `server/scripts/verify-chain.ts:5` (per architecture.md's hard ban / Amendment A2 — tamper and
  verify both go through `better-sqlite3` directly). Ban holds.

## debugger - P1 fixes

Phase HARDEN, run by debugger, 2026-09-19. Scope: the 4 P1s + P2-7 from `review.md` (code-reviewer).
No new features; no other files touched. All fixes verified by actually running the code (build +
tests + a live server on a real port + curl), not just by reading it.

### P1-1 — frozen SessionClock kept ticking down under "Timer paused"
`web/src/components/CandidatePanel.tsx` — `SessionClock` now takes a `state: SessionState` prop and
its `useEffect` returns early (no `setInterval`) when `state === "frozen"`, in addition to snapping
`display` to the fresh `remainingMs` first. `state` was added to the effect's dependency array so the
interval is torn down/rebuilt the moment a session's `state` changes (e.g. `frozen` -> `resumed`).
Caller (`CandidatePanel`) now passes `state={session.state}`. Verified via `npm run typecheck` (web)
and `npm run build` (web) — both pass; the frozen-clock behavior itself is a rendered-UI effect that
only a browser dry-run can visually confirm, which is out of scope for this curl-based pass (same
caveat review.md already flagged for P1-1/P1-4/P2-8).

### P1-2 — VERDICT_FREEZE_THRESHOLD_S 30 -> 10
Changed the default in both `server/src/config.ts:32` and `.env.example:23`. Verified live: booted
the built server against the seeded fixture, `POST /api/sim/kill/C1`, waited 15s (`date` before/after
confirms elapsed time), `POST /api/sim/reconnect/C1`. New verdict `INC-0002` came back
`decision: "partial-extension"` with `max_frozen_ms: 14018` and rule text showing the new
`FREEZE_THRESHOLD_MS (10000ms)` — confirms a realistic 15s outage now reliably lands on the money
verdict instead of "No Action Needed". `npm test` still 16/16 green (verdict-policy tests use
their own injected thresholds, unaffected by the default change).

### P1-3 — "Reset Demo" now replays the same fixture as `npm run seed`
Extracted the seeding logic (scenario seed + 22-min-in exam clock + per-session answer-save history
+ pre-resolved backstory incident/verdict at `BACKSTORY_CENTER_INDEX`) out of `scripts/seed.ts` into
a new shared function `seedDemoFixture(repo, now)` in `server/src/sim/seedFixture.ts`. Both
`server/scripts/seed.ts` and `Simulator.reset()` (`server/src/sim/simulator.ts`) now call it, so
`reset()` no longer falls back to a bare `repo.seedScenario()`. `Simulator.scenario` is reassigned to
the fixture's scenario on reset so subsequent live ticks (answer-save autosaves) use the same
center/session ids the fixture just wrote. Verified live: `npm run seed` printed "Seeded 8 centers,
24 sessions, 70 answer-save checkpoints, and one resolved backstory incident at Indore - Rajwada
(-> partial-extension)" (same numbers as before the refactor); then hit `POST /api/sim/reset` on a
running server that had since been kill/reconnect/tampered, and `GET /api/state` afterward showed the
fixture restored exactly: 8 centers, 24 sessions, 50 (of 70, client-capped) recentCheckpoints, one
resolved incident `INC-0001` at `C4` with `verdicts: [("INC-0001", "partial-extension")]` — matching
the pre-tamper/pre-kill seeded state, not a blank/healthy reset.

### P1-4 — tamper no longer double-broadcasts the checkpoint
`server/src/routes/audit.ts` — removed the `broadcast({ type: "checkpoint.appended", ... })` call in
`POST /api/sim/tamper`; `repo.tamperCheckpoint()` still runs (mutates the row + returns it to the
caller in the HTTP response), but no WS event fires for a checkpoint id the client already has,
because `useLiveState`'s `checkpoint.appended` reducer branch is a blind prepend, not an upsert-by-id.
The FAIL banner/highlight in the UI is driven by `POST /api/audit/verify`'s response, not by this
event, so nothing regresses. Verified live end-to-end: `POST /api/sim/tamper` ->
`{"tampered":true,"checkpointId":213,"centerId":"C4","seq":28}`, `POST /api/audit/verify` ->
`{"ok":false,"brokenAt":{"centerId":"C4","rowId":213,"seq":28,...}}` (verify still correctly finds the
break), then `GET /api/state` -> counted ids in `recentCheckpoints` with a `Counter`: 50 total ids, 0
duplicates. Also re-ran `npm test` (chain.test.ts's synthetic-tamper assertions, 4 tests) — still
green, confirming `verifyLedger`/`tamperCheckpoint` themselves were untouched.

### P2-7 — ENABLE_SIM_CONTROLS=false no longer 403s the whole app
`server/src/routes/sim.ts` — removed the root-scoped `app.addHook("preHandler", ...)` (which gated
every route registered on the shared Fastify instance, and didn't `return` on `reply.send()`, so
Fastify treated the 403 as a non-terminal continuation) and moved the
`if (!config.enableSimControls) return reply.code(403)...` check into each of the three handlers
(`kill`, `reconnect`, `reset`), matching the pattern `routes/audit.ts` already used for
`/api/sim/tamper`. Verified live: booted the server with `PORT=8081 ENABLE_SIM_CONTROLS=false`. Results:
`GET /` -> 200, `GET /api/state` -> 200, `POST /api/audit/verify` -> 200, `POST /api/sim/kill/C1` ->
403, `POST /api/sim/reset` -> 403, `POST /api/sim/tamper` -> 403. Exactly the intended scope: only
`/api/sim/*` is gated.

### Full verification run (after all 5 fixes)
- `npm run typecheck` (server + web): PASS, 0 errors.
- `npm run build` (web: tsc --noEmit + vite build; server: tsc + copy-migrations): PASS.
- `npm test` (server, node:test): 16/16 PASS, unchanged pass count from the pre-fix baseline.
- Live golden path against the built server + fresh `npm run seed`:
  - kill C1 -> wait 15s (measured via `date`) -> reconnect C1 -> new verdict `INC-0002` =
    `partial-extension` (not `no-action`). P1-2 confirmed fixed.
  - tamper -> verify (`ok:false`, correct `brokenAt`) -> `/api/state.recentCheckpoints` has 0
    duplicate ids. P1-4 confirmed fixed.
  - `POST /api/sim/reset` after the above -> state matches a fresh `npm run seed` (8 centers, 24
    sessions, `INC-0001`/C4/partial-extension backstory verdict), not a bare healthy re-seed.
    P1-3 confirmed fixed.
  - `ENABLE_SIM_CONTROLS=false` -> only `/api/sim/*` 403s, `/` and `/api/state` still 200. P2-7
    confirmed fixed.
  - P1-1 (frozen clock) confirmed by code/typecheck/build only — needs the mandatory human browser
    dry-run review.md already calls for (no browser available in this pass).

### Not touched (out of scope per task)
P2-5 (50-row cap vs "Full Chain" label), P2-6 (cumulative `frozenMsTotal` in verdict math), P2-8
(static risk score), P3-9 (dead code) — left as-is per the explicit "P1s + P2-7 only" scope.

**Overall: all 6 checks pass, no failures to report.** No file:line failures — nothing to fix.
