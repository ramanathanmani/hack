# DEMO SCRIPT — Sentinel

Phase: SHOW · Agent: demo-director · Date: 2026-09-19
Reads: `design.md` (golden path §1), `copy.md` (all spoken/on-screen strings below are quoted
verbatim from it), `qa.md` (NO P0s; golden path re-verified live over HTTP/WS; 2 P1s from the
qa-demo-path pass — stale README and a stale `/incidents/:id` step in design.md's own script — are
already accounted for in this script by never routing through `/incidents/:id`, which does not
exist in the shipped build), `deploy.md` (local-only: `npm run build && npm start` on `:8080`; no
shareable URL — this is a genuine sandbox network limit, documented as blocked in deploy.md, not a
product defect; on a real judging laptop this is simply the presenter's own machine).

No P0s exist. This script is written for the clean golden path, not around defects. The landmines
section below exists only because a real UI + a fixed timing constant (`VERDICT_FREEZE_THRESHOLD_S`)
create a few "don't do this or the demo looks wrong" traps — not because anything is broken.

---

## 0. One-time setup (before judges arrive)

```bash
cd /home/user/hack
npm install
npm run build
npm run seed --workspace server
NODE_ENV=production npm start
```

Open `http://127.0.0.1:8080/` in the browser tab judges will see. Confirm before judge #1 walks up:
- Framing header reads `8 centers · 24 sessions · 0 incidents` (0 incidents is expected — the seeded
  backstory incident at C4/"Indore - Rajwada" is already **resolved**, and resolved incidents from
  seed still count toward the incidents number shown in the header once one exists; if the header
  shows `1 incidents` that's fine too — it just means the backstory incident is present. Either way,
  **read whatever number is actually on screen before saying it out loud** — see landmine list.)
- `ConnectionPill` = LIVE (green).
- All 8 center cards green/"Healthy" except possibly C4 ("Indore - Rajwada"), which may show a small
  residual risk score from its resolved backstory incident — that's correct, not a bug.

---

## 1. Who talks vs. who drives

- **One person (solo demo):** you talk and click. Say each line *while* the previous action's
  network round-trip is still resolving (everything below is server-verified at single-digit-to-2s
  latency, so there's always a few seconds of dead air to fill with words, not silence).
- **Two people:** **Narrator** stands back from the laptop and delivers every quoted line below.
  **Driver** sits at the keyboard and only clicks — driver does not narrate, to avoid two people
  talking over the same beat. Driver picks the center to kill (**must be C1–C3, C5–C8, never C4** —
  see landmines) before the narrator's opening line finishes.

---

## 2. LANDMINES — read this section first, especially if qa.md flagged P1s

1. **Do not click an "incident row" expecting it to navigate anywhere.** `design.md`'s original
   script described clicking through to `/incidents/:id` — that route was **never built** (confirmed
   dead end, falls back to `/`, per `qa.md`'s qa-demo-path pass). The verdict renders **inline on `/`
   itself**, zero clicks required. This script never asks you to click an incident row. If you forget
   and click one out of habit, nothing breaks — it's just a wasted click, not an error.
2. **Never kill center C4 ("Indore - Rajwada").** It already carries a *pre-seeded, resolved*
   incident + "Partial Time Extension" verdict from the backstory scenario. Killing it live will make
   your on-screen numbers (a second incident on top of the first) confusing to narrate and won't
   match the clean before/after story. Use C1 (or any of C2, C3, C5–C8).
3. **Hold the freeze for ~15 seconds, not less.** `VERDICT_FREEZE_THRESHOLD_S=10` — a freeze under
   10s of wall-clock time computes **"No Action Needed"**, not the more demo-worthy **"Partial Time
   Extension"**. `qa.md`'s own re-verification confirms a ~15s hold reliably crosses the threshold.
   Do not rush the Reconnect click. (If you do click early and get "No Action Needed," that is still
   a *correct* computed verdict, not a bug — just less visually interesting. If it happens, say so
   plainly rather than pretending it's wrong: "No Action Needed — because we reconnected fast, which
   is itself the point: the rule only escalates when it should.")
4. **Do not refresh the browser while sessions are frozen.** The candidate banner literally says
   "Do not refresh" — this is honest, real product copy, not a demo hazard to hide. If asked, point
   it out as intentional.
5. **Click Verify Chain Integrity once (PASS) before clicking Tamper.** The FAIL flip only reads as
   a "reveal" if judges saw the green PASS state first. Don't tamper before establishing baseline.
6. **Don't leave more than ~15–20s between clicking Tamper and clicking Verify again.** The FAIL
   banner's text (center/seq/expected/actual hash) is always correct regardless of timing — it comes
   straight from the server response — but the chain table's *highlighted row* is capped to the
   newest 50 checkpoints client-side and could scroll out of view if you dawdle (qa.md P2, cosmetic
   only). Click Verify again right after Tamper.
7. **Never state a session/center count in narration without checking the header first.** Copy.md's
   framing format is exactly `{centers} centers · {sessions} sessions · {incidents} incidents`. The
   seed is 8 centers / 24 sessions — say those two numbers, they're fixed. The **incidents** number
   changes the moment you trigger one live, so don't pre-script that count; glance at the header and
   say what's actually there. (This is the narration hazard: your pitch deck / opening hook must not
   quote a stale session count that no longer matches the header on screen.)
8. **There is no shareable URL.** Do not tell judges "here's a link" or put a URL in slides — this
   runs on `http://127.0.0.1:8080` on the presenter's own laptop only (deploy.md: cloud tunnel is
   blocked by sandbox network policy; on a real laptop at the event this is a non-issue).
9. **If `ConnectionPill` shows "POLLING (2s)" instead of "LIVE," don't panic or apologize.** That's a
   designed resilience state (WS dropped, cleanly degraded to 2s polling) — say "it's still live,
   just polling instead of push" and keep going. It is not a broken connection.

---

## 3. THE 90-SECOND SCRIPT (target: land the full loop in ~60s, leaving margin)

Timing is a budget, not a stopwatch requirement — qa.md confirms the *system* completes kill→verdict
in under 10s server-side; the human pacing below is the real constraint.

| Time | Click | Say |
|---|---|---|
| 0:00 | (land on `/`, already loaded) | "This is Sentinel — the control tower that keeps exams fair. Right now, if an exam center drops offline, no one can prove what happened to the candidates inside it. Sentinel can." |
| 0:05 | Point at header/grid, no click | "8 centers, 24 sessions, all live right now." *(glance at the actual header before saying the incident count if you mention it — see landmine 7)* |
| 0:10 | Click **Kill Switch** on **C1** (not C4) | "I'm going to cut connectivity to this center — this is the simulator, clearly marked, not part of the real product." |
| 0:12 | (wait ~2s, card flips red, incident opens) | "There — real missed-heartbeat detection, not a scripted animation. Incident opened, severity High." |
| 0:14 | Point at `CandidatePanel` for C1 | "Its three candidates just froze. 'Center disrupted, your progress is saved, timer paused.' The clock actually stopped — that's server time, not a fake pause." |
| 0:18 | Point at `LedgerPanel` | "Every freeze is a hash-linked checkpoint, appended live." |
| 0:25 | (hold ~15s total since kill, keep narrating) | "We're letting this sit past ten seconds on purpose — that's our policy threshold for when a time extension kicks in." |
| 0:27 | Click **Reconnect** | "Now I bring the center back." |
| 0:29 | (wait ~2–3s, sessions resume, verdict renders inline) | "Sessions resumed, time restored — and look, a verdict appeared right here on this same screen, no extra click." |
| 0:33 | Point at `VerdictCard` | "Partial Time Extension. Here's the rule, here's the exact arithmetic — average frozen time versus threshold — and an illustrative cost-avoided estimate, clearly labeled illustrative. Every decision you just saw was computed from a rule and an unbroken hash chain, not a guess." |
| 0:42 | Navigate to `/audit` | "One more thing — proving none of this can be quietly edited afterward." |
| 0:45 | Click **Verify Chain Integrity** | "Chain Verified — PASS." |
| 0:47 | Click **Tamper (simulator)** | "Now watch what happens the moment someone touches the record." |
| 0:49 | Click **Verify Chain Integrity** again | "Tamper Detected — FAIL. It names the exact broken row: center, sequence, expected hash versus what's actually stored." |
| 0:53 | (done) | "That's the whole promise: see it, protect it, prove it." |

Total: ~55–60s of active script inside the 90s budget (per `problem.md`'s demo-in-90-seconds
definition), leaving ~30s slack for a slow click, a question interruption, or a POLLING fallback.

---

## 4. THE 180-SECOND SCRIPT (if given extra time)

Do everything in §3, then add:

1. **Before killing anything (+20s):** point out `SimulatedBadge` ("Simulated telemetry") and the
   red-bordered "SIMULATOR CONTROLS — not part of the production system" panel. Say: "Everything
   that's simulated is labeled as simulated — nothing here is dressed up to look more real than it
   is."
2. **During the freeze (+15s):** open the `LedgerPanel` fully and trace one hash chain by eye —
   point at a `freeze` row's `prevHash` and show it matches the prior `answer_save` row's `hash`.
   "This is append-only — nothing rewrites a prior row, it only ever adds the next linked one."
3. **After the verdict (+15s):** scroll to the seeded backstory example at C4 ("Indore - Rajwada")
   and show its already-resolved "Partial Time Extension" verdict from earlier in the exam. "This
   isn't the first incident today — here's one that happened earlier, same rule, same math."
4. **On `/audit`, before tampering (+15s):** scroll the full chain table, point out columns (Center,
   Seq, Kind, Hash, Prev Hash, Status), and note the "Not Yet Verified" neutral grey state never
   defaults to a false PASS.
5. **After the FAIL flip (+15s):** click **Reset Demo** live, re-click **Verify Chain Integrity**,
   show it flip back to PASS. "And it's fully resettable — deterministic seed, same starting state
   every time, so you could watch this exact sequence again right now."

This adds roughly 80s, landing the extended version around 130–150s of active narration — still
inside a 180s ceiling with margin for questions.

---

## 5. Backup plan if the app misbehaves — exactly when to switch

The system has no external API dependency (architecture-level ban — no network calls at runtime), so
"the API fails" in practice means one of: the local server process died, a click produced no visible
change, or the browser tab is stuck. Switch to backup **the moment any of these is true**, don't wait
past it:

- **No visible response within ~5 seconds of a click** (Kill Switch, Reconnect, Verify, or Tamper).
- **`ConnectionPill` shows OFFLINE (grey) for more than ~5 seconds**, not just POLLING (amber is
  fine, keep going — see landmine 9).
- **The page is blank or shows a raw error/stack trace** instead of the app.

**Backup steps, in order of speed:**

1. **Fastest — in-app reset, no restart:** click **Reset Demo** in `SimulatorControls`, wait 1–2s,
   reload `/`. This is the same button used for judge-to-judge resets (§6) and fixes almost any
   confused-state issue without touching the terminal.
2. **If the page itself won't load / server looks dead:** in the terminal, run:
   ```bash
   npm run seed --workspace server
   NODE_ENV=production npm start
   ```
   This takes well under a minute and always reproduces the identical seeded state (deterministic
   `SIM_SEED`). While it restarts, say: "Give me one second — resetting to a clean run," which is
   true and not an apology for a broken product.
3. **If you need to prove the logic is real while the UI recovers:** fall back to narrating the same
   arc via terminal `curl` calls hitting the same API the UI uses — this is not a fake mock, it's the
   identical backend, just without the rendered page:
   ```bash
   curl -s -X POST http://127.0.0.1:8080/api/sim/kill/C1
   curl -s http://127.0.0.1:8080/api/state          # show C1 status:"down", incident opened
   curl -s -X POST http://127.0.0.1:8080/api/sim/reconnect/C1
   curl -s http://127.0.0.1:8080/api/state          # show resumed + verdict
   curl -s -X POST http://127.0.0.1:8080/api/audit/verify   # {"ok":true}
   curl -s -X POST http://127.0.0.1:8080/api/sim/tamper
   curl -s -X POST http://127.0.0.1:8080/api/audit/verify   # {"ok":false,"brokenAt":{...}}
   ```
   Say: "Same backend, same computation — I'm just showing you the raw response while the UI catches
   up." This is honest and was exactly how the golden path was originally verified end-to-end
   (qa.md, integration-agent pass).
4. **There is no recorded video fallback in this repo** (deploy.md explicitly notes this was never
   produced — SHOW-phase gap, not attempted). If steps 1–3 all fail, be transparent: "This is a local
   build running on this laptop; let me restart it" and re-run step 2 — it is fast and deterministic
   enough to redo live rather than fake it.

---

## 6. Reset steps between judges (so judge #2 sees exactly what judge #1 saw)

Run **one** of these between every judge, in order of preference:

1. **Preferred — no restart needed:** click **Reset Demo** inside `SimulatorControls` on `/` (calls
   `POST /api/sim/reset`). Confirm the grid returns to 8 healthy-looking centers within ~1–2s, then
   reload the page once for a clean visual state.
2. **If the button isn't available or state looks wrong:** `POST /api/sim/reset` directly:
   ```bash
   curl -s -X POST http://127.0.0.1:8080/api/sim/reset
   ```
3. **Full hard reset (only if 1–2 didn't fix it):**
   ```bash
   npm run reset --workspace server    # deletes data/sentinel.db, re-migrates, re-seeds
   ```
   then reload `http://127.0.0.1:8080/` in the browser (server does not need restarting for this).

**Verify before judge #2 starts:** framing header reads `8 centers · 24 sessions`, all centers
green/"Healthy" except C4's small residual risk score (expected, from the resolved backstory
incident), `ConnectionPill` = LIVE, and `/audit` shows the neutral grey "Not Yet Verified" state (not
a leftover PASS or FAIL from the previous run) until you click Verify again live.

---

## 7. Quick reference — exact copy to use verbatim (from copy.md, do not paraphrase)

- Opening hook: "Right now, if an exam center drops offline, no one can prove what happened to the
  candidates inside it. Sentinel can."
- Buttons: **Kill Switch**, **Reconnect**, **Reset Demo**, **Verify Chain Integrity**,
  **Tamper (simulator)**.
- Verdict labels: **Re-Conduct Required** (red) / **Partial Time Extension** (amber) /
  **No Action Needed** (green).
- Audit banners: **Chain Verified — PASS** (green) / **Tamper Detected — FAIL** (red) /
  **Not Yet Verified** (grey, pre-click).
- Tamper moment line: "Now watch what happens the moment someone touches the record."
- Closing line: "That's the whole promise: see it, protect it, prove it."
