# SPEC B — "One Center, One Incident" Golden Path (conservative)

Codename: **Checkpoint** — the smallest end-to-end slice that still hits Detection → Response → Recovery →
Trust, built to survive a 3-hour clock with margin for rehearsal, not a live edit.

## 1. Problem & target user
Same MPOnline PS06 problem: online-exam infrastructure failures force costly, unfair blanket re-conducts
because there is no live detection or tamper-evident record of what actually happened to affected
candidates. Target user: the exam control-room operator who needs, at minimum, proof that a disrupted
candidate's in-progress work was preserved and that any re-conduct decision is evidence-based rather than
a guess. This spec narrows to **one exam center, one simulated incident, one clear before/after**, trading
breadth for reliability under a hard 3-hour clock (Round-1 judging at 13:30, per STATE.md).

## 2. In-scope / out-of-scope
**In scope:** one control-tower screen; a single exam center with 3 simulated candidates; one kill switch;
automatic freeze on incident; hash-chained checkpoint log; automatic resume on reconnect; a single verdict
readout computed from real data. Prevention (multi-center risk grid) is explicitly reduced to a static
"3 centers, only Center A is live" list — not a full fleet view.
**Out of scope:** everything in Spec A's out-of-scope, PLUS: multi-center live grid, incident
classification taxonomy (only one incident type: "connectivity loss"), historical timeline/trend views,
audit-trail tamper-demo UI (tamper check exists as a CLI/script, not a polished screen), configurable
policy thresholds.

## 3. Personas + golden flow
**Personas:** Operator, Judge (presses the one button), Integrity Officer (reads the one verdict card).

**Golden user flow:**
1. Operator opens the single-page **Exam Monitor**: shows Center A card (green, "healthy") and 3 candidate
   cards below it, each with a mock question, answer box (autosaving every few seconds), and a countdown
   clock.
2. Judge presses the one big red **"Simulate Outage — Center A"** button.
3. Center A card turns red, a banner appears: "Incident detected: connectivity loss at Center A —
   candidates frozen, work preserved." All 3 candidate clocks stop and each candidate card shows "Frozen —
   your last saved answer is safe" with a timestamp of the last checkpoint.
4. A **Checkpoint Ledger** panel (visible at all times, not a separate route) shows the append-only log of
   saved answers with hash + prev-hash for all 3 candidates, growing live during step 1 and locked (last
   entry highlighted) once frozen.
5. Judge presses **"Restore Connectivity."** Candidate clocks resume, adding back exactly the frozen
   duration; cards flip to "Resumed — no answers lost."
6. A single **Verdict Card** appears/updates: decision (e.g. "Partial Time Extension: +52s per affected
   candidate"), with the three numbers behind it shown (candidates affected, average frozen duration,
   checkpoints preserved vs. lost = 0).
7. Operator (or presenter) runs one terminal command (`npm run verify-chain`) shown on a shared screen or
   terminal panel embedded at the bottom of the page — output prints PASS with the chain length and root
   hash, demonstrating the record is real and checkable, without needing an interactive tamper UI.

## 4. Screens / routes
- `/` — Exam Monitor (the entire demo lives on this one screen): center status card, 3 candidate cards,
  checkpoint ledger panel, verdict card, kill/restore buttons, embedded terminal-output panel for the
  verify command.
- `/incident/summary` (optional, stretch) — a printable one-page incident report combining verdict +
  ledger excerpt, useful for the submission kit screenshot.

## 5. Data model (SQLite) — trimmed subset of Spec A
- `candidates(id, name, state[active|frozen|resumed], exam_duration_s, frozen_ms_total)`
- `checkpoints(id, candidate_id, seq, ts, answer_text, prev_hash, hash)`
- `incident(id, opened_at, closed_at, status[open|resolved])` — singleton row, reused/reset between runs
- `verdict(id, incident_id, decision, candidates_affected, avg_frozen_s, checkpoints_preserved,
  computed_at)`

## 6. Internal API surface
- `GET /api/state` — single call returning center status, all 3 candidates, latest checkpoints, current
  verdict (dashboard can poll or subscribe via WS to this one shape).
- `POST /api/sim/kill` — trigger the one incident.
- `POST /api/sim/restore` — resolve it.
- `WS /ws` — pushes `state.updated` on every change (checkpoint saved, freeze, resume, verdict computed).
- `GET /api/verify` — recomputes the chain server-side, returns `{ ok, length, rootHash }` (backs the CLI
  script and can optionally back a "Verify" button if time allows).

## 7. External APIs
None, same reasoning as Spec A — everything is local (better-sqlite3, ws/socket.io, node:crypto). No
GO/GO-WITH-MOCK external service is used or needed at this scope.

## 8. Acceptance criteria
- [ ] Loading `/` shows Center A healthy and 3 candidates actively answering, with checkpoints appearing in
      the ledger panel roughly every few seconds without user action.
- [ ] Clicking "Simulate Outage" turns Center A red and freezes all 3 candidate clocks within 2s.
- [ ] Each candidate card shows "Frozen" with the correct last-saved-checkpoint timestamp.
- [ ] Clicking "Restore Connectivity" resumes all 3 clocks with the frozen duration added back (visually
      confirmable: displayed remaining time increases by the frozen amount at the moment of resume).
- [ ] Verdict Card updates automatically after restore with real computed numbers (not a hardcoded string):
      candidates_affected = 3, avg_frozen_s matches wall-clock frozen time within 1s, checkpoints_preserved
      = total checkpoints logged (none marked lost).
- [ ] Running the verify command/button returns PASS with a chain length ≥ number of checkpoints created
      during the run.
- [ ] Full flow (idle → kill → freeze → restore → resume → verdict) completes in under 60 seconds live and
      is repeatable (can be re-run without restarting the server) for rehearsal.
- [ ] Runs fully offline with venue wifi disabled.

## 9. Non-functional
- Update latency target: <2s from action to visible UI change (WS preferred; 1s poll fallback acceptable
  given only one page of state).
- Offline demo fallback: if the whole app dies right before presenting, a pre-recorded 90-second screen
  capture of one full successful run is kept as a `.mp4` in the repo as the literal last-resort fallback —
  called out explicitly as "shown only if live demo fails," never used if live works.
- Deterministic simulator (fixed candidate answers/timing) so every rehearsal run looks identical, which
  matters more here than in Spec A because there is no room in 3 hours to debug flakiness live.

## 10. 8-hour cut vs full cut
**8-hour (Round-1, ~3h realistic) cut is essentially the whole spec above** — this spec is sized to fit
inside the 3-hour Round-1 budget with margin, not to be cut further. If time is short, cut order is: (1)
drop `/incident/summary` printable page, (2) drop the `/api/verify` button and keep only the CLI script,
(3) reduce candidates from 3 to 2.
**Full cut (Day 2 stretch, if this spec wins and there's time left):** grow into Spec A's multi-center grid,
add incident classification, add the interactive tamper-then-verify UI, add a second concurrent incident.

## 11. Demo script hooks (what the judge clicks)
1. Judge clicks **"Simulate Outage — Center A."**
2. Judge watches the freeze happen on the one screen, no navigation needed.
3. Judge clicks **"Restore Connectivity."**
4. Judge reads the Verdict Card themselves.
5. Presenter points at the ledger panel and the printed `verify-chain` PASS output as the "why you can
   trust this" beat — no live tampering needed, lower risk of an on-stage mistake.

## 12. Explicit non-goals
No multi-center grid, no incident classification/severity taxonomy, no historical/trend analytics, no
interactive tamper-and-catch UI (CLI-only), no policy configuration, no real telemetry, no auth, no mobile,
no cloud deployment, no ML-based anomaly detection (single deterministic trigger only).
