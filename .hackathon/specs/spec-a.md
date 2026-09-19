# SPEC A — "Full Loop" Control Tower (ambitious-but-demoable)

Codename: **Sentinel** — all five lifecycle stages visibly wired end-to-end, one incident, deep verdict.

## 1. Problem & target user
MPOnline runs large-scale, high-stakes online exams (recruitment, admissions, scholarships) across many
physical centers. When a center's infra fails mid-exam (network drop, app crash, mass disconnect), MPOnline
today has no live, evidence-based way to see it happening, protect in-progress candidate work, or decide
fairly afterward whether to re-conduct the exam — so it defaults to blanket re-conduct, which is expensive
and unfair to unaffected candidates. Target user: the **exam control-room operator** (MPOnline ops staff)
watching a live dashboard during an exam window, plus the **post-exam integrity officer** who has to justify
a re-conduct/no-action decision to auditors.

## 2. In-scope / out-of-scope
**In scope:** synthetic multi-center telemetry; live risk-scored center grid; automatic incident detection
+ classification + escalation; candidate session freeze/live-status; tamper-evident hash-chained checkpoint
ledger; automatic reconnect/resume-at-checkpoint; a computed decision-support verdict (re-conduct / partial
extension / no action) with visible reasoning; a post-incident audit-trail view with tamper-check verifier
you can deliberately break and catch.
**Out of scope:** real proctoring/webcam/face detection, real question banks or scoring, candidate
auth/login, mobile apps, multi-tenant admin/roles, real SMS/email delivery, cloud deployment, real exam
vendor integration.

## 3. Personas + golden flow
**Personas:** Ops Operator (watches control tower), Judge/Evaluator (plays the role of an incident — presses
kill switch), Integrity Officer (reads the verdict + audit trail after).

**Golden user flow (what happens live, in order):**
1. Operator opens the **Control Tower** dashboard: a grid of 8 exam centers, each showing live health
   (green/amber/red), candidate count, and a rolling risk score, fed by the simulator at ~1 event/sec/center.
2. A **candidate session panel** alongside shows 3–5 live simulated candidates at one center: a mock
   question, an answer box with periodic autosave, and a running exam clock.
3. Judge presses the **Kill Switch** for Center 3 (simulates network/app failure: heartbeat stops,
   answer-save latency spikes then fails).
4. Within ~1–2 seconds the dashboard flips Center 3 to red, an **Incident** appears in a live timeline with
   auto-classification ("Connectivity Loss — Severity: High") and an escalation banner.
5. All active candidate sessions at Center 3 **freeze**: their clock stops, and each candidate panel shows an
   honest status banner ("Center 3 disrupted — your progress is saved, timer paused, do not refresh").
   Every answer already saved before the freeze is confirmed **checkpointed** into the hash chain (visible
   as a growing ledger with each entry's hash and prev-hash).
6. Judge presses **Reconnect Center 3**. Sessions transition to `resumed`: candidates pick up exactly where
   they left off, clock resumes with the frozen duration added back (time restored, not lost).
7. Operator opens the **Incident Detail** view: shows affected candidate list, total time frozen, checkpoint
   count before/after, and a computed **Verdict**: e.g. "Partial Time Extension — 3 candidates, avg 47s
   frozen, no data loss detected" with the reasoning inputs shown (thresholds used, not just a label).
8. Operator opens the **Audit Trail / Verifier** view, clicks "Verify Chain Integrity" — it recomputes every
   hash and shows PASS. Judge (or operator) then manually edits one row directly in the SQLite file (a
   pre-scripted `sqlite3` command run in a visible terminal) and clicks Verify again — it shows **FAIL** with
   the exact broken link highlighted. This is the "trust" payoff moment.

## 4. Screens / routes
- `/` — Control Tower: center grid + global incident ticker + kill-switch panel (per-center kill + reconnect
  buttons, admin-only in this build, visibly labeled "simulator controls").
- `/center/:id` — Center detail: candidate session list, live telemetry sparkline, incident history for
  that center.
- `/session/:id` — Candidate session inspector: state machine badge (`active/frozen/resumed/submitted`),
  full checkpoint chain for that candidate with hashes.
- `/incidents` — Incident timeline list, filterable by severity/center.
- `/incidents/:id` — Incident detail + computed verdict + reasoning breakdown.
- `/audit` — Chain verifier: run integrity check across all centers, tamper-demo controls.

## 5. Data model (SQLite)
- `centers(id, name, status[healthy|degraded|down], risk_score, updated_at)`
- `candidate_sessions(id, center_id, candidate_name, state[active|frozen|resumed|submitted], exam_started_at,
  frozen_at, frozen_ms_total, exam_duration_s, last_checkpoint_hash)`
- `telemetry_events(id, center_id, ts, type[heartbeat|latency|answer_save|disconnect], value_json)`
- `incidents(id, center_id, opened_at, closed_at, severity, classification, status[open|escalated|resolved])`
- `checkpoints(id, session_id, seq, ts, payload_json, prev_hash, hash)` — append-only, `hash =
  sha256(prev_hash + canonical_json(payload_json))`
- `verdicts(id, incident_id, decision[re-conduct|partial-extension|no-action], reasoning_json, computed_at)`

## 6. Internal API surface
- `GET /api/centers`, `GET /api/centers/:id`
- `POST /api/sim/kill/:centerId`, `POST /api/sim/reconnect/:centerId` (simulator control, clearly labeled)
- `GET /api/sessions/:id`, `GET /api/sessions/:id/checkpoints`
- `GET /api/incidents`, `GET /api/incidents/:id`
- `GET /api/verdicts/:incidentId`
- `POST /api/audit/verify` → `{ ok: boolean, brokenAt?: {table, rowId, expectedHash, actualHash} }`
- `WS /ws` — server pushes `center.updated`, `session.updated`, `incident.opened`, `incident.updated`,
  `checkpoint.appended`, `verdict.computed` events.

## 7. External APIs
None. All GO/GO-WITH-MOCK items from research.md are local libraries (better-sqlite3, ws, node:crypto), not
third-party services. No external calls in this spec.

## 8. Acceptance criteria
- [ ] Dashboard shows ≥6 centers with live-updating health/risk within 2s of simulator ticks.
- [ ] Pressing Kill Switch on a center visibly turns it red and creates an Incident row within 2s.
- [ ] All active sessions at that center transition to `frozen` and display the status banner within 2s.
- [ ] At least one checkpoint exists per session prior to freeze, and it is visible with its hash in the UI.
- [ ] Pressing Reconnect transitions frozen sessions to `resumed` and restores their remaining exam time
      (clock reflects frozen duration added back, verifiable on screen).
- [ ] Incident Detail page shows a non-hardcoded verdict computed from real frozen-duration/affected-count
      data, with the reasoning values visible.
- [ ] Audit page "Verify Chain Integrity" returns PASS on an untampered chain.
- [ ] After a manual row edit in the SQLite file, "Verify Chain Integrity" returns FAIL and identifies the
      exact broken row.
- [ ] Entire kill→detect→freeze→checkpoint→reconnect→resume→verdict loop completes live, on one laptop,
      with venue wifi disconnected.

## 9. Non-functional
- Detection-to-dashboard-update latency target: <2s (WebSocket push, not polling).
- Fully offline: no network calls after `npm install`. Demo must run with wifi off.
- Offline demo fallback: if WebSocket flakes, dashboard falls back to 2s polling of `/api/centers` and
  `/api/incidents` automatically (same UI, degraded refresh rate, silently, no crash).
- Simulator is deterministic-seedable so a re-run behaves the same in rehearsal and on stage.

## 10. 8-hour cut vs full cut
**8-hour (Round-1, ~3h realistic) cut:** centers grid + kill switch + incident detection + freeze +
checkpoint ledger + reconnect/resume. Verdict can be a simple threshold rule (if frozen_s > 30 → partial
extension, else no action) rendered with its inputs. Audit/tamper-demo can be a single hardcoded verified
chain with one scripted tamper example, not a fully general verifier UI.
**Full cut (Day 2 stretch):** multi-incident concurrent handling, per-center historical risk trend charts,
configurable verdict policy thresholds via UI, exportable PDF audit report, Docker Compose packaging,
candidate-facing "recovery confidence" UI polish, more realistic telemetry noise/patterns.

## 11. Demo script hooks (what the judge clicks)
1. Judge is handed the **Kill Switch** button for a specific center — they choose which one, live.
2. Judge watches the center flip red and the incident timeline populate in real time.
3. Judge is shown the candidate panel mid-freeze (clock stopped, banner visible).
4. Judge presses **Reconnect** themselves.
5. Judge opens **Incident Detail** and reads the computed verdict + reasoning aloud.
6. Judge (or presenter, at judge's request) runs the terminal tamper command and clicks **Verify** twice
   (before/after) to see PASS→FAIL.

## 12. Explicit non-goals
No real telemetry, no real candidate login, no real messaging provider, no cloud hosting, no ML model (the
"anomaly detection" is rule/threshold-based on synthetic signals, stated honestly), no multi-tenant/roles,
no mobile UI, no persistence beyond the local SQLite file.
