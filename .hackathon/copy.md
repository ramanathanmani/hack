# COPY — Sentinel

Phase: DESIGN · Agent: copywriter · Date: 2026-09-19
Fills the TBD copy strings flagged in `design.md` §1/§2/§4/§8, using tone from `brand.md`
(Vigilant, Transparent, Trustworthy). No lorem ipsum. Every string here is final unless a future
spec change forces an update — frontend-builder should treat this file as the copy source of truth,
not invent new strings on the fly. If a new UI copy site is needed, add it here first.

Rules followed:
- Plain language. No "leverage," "seamless," "next-gen," or other jargon.
- Every screen has a headline, a subhead, and one clear primary action.
- Empty states always say what to click next.
- No paragraphs in buttons or badges — short, real UI-length strings only.

---

## 1. Global chrome

| Element | Copy |
|---|---|
| Product name (wordmark) | Sentinel |
| Tagline (footer/about, if space allows) | See. Protect. Prove. |
| `FramingHeader` exam name (fixture) | Statewide Aptitude Exam — Live |
| `FramingHeader` counts format | `{centers} centers · {sessions} sessions · {incidents} incidents` |

### `ConnectionPill` states
| State | Label | Color |
|---|---|---|
| Connected | LIVE | green |
| Degraded (WS dropped, polling) | POLLING (2s) | amber |
| Disconnected | OFFLINE | grey |
| Manual reconnect link (only shown after 3s+ offline) | Retry | grey, underlined text link |

---

## 2. `/` — Control Tower

- **Headline:** Control Tower
- **Subhead:** Every exam center, watched in real time.
- **Primary CTA (inside SimulatorControls):** Kill Switch
- **Secondary CTA (appears once a center is down):** Reconnect

### States
| State | Copy |
|---|---|
| Empty (no seed data) | No exam data yet. Run `npm run seed` to start the demo. |
| Loading (skeleton, <1s typical) | (no text — skeleton cards only) |
| Loading (exceeds ~3s) | ConnectionPill → OFFLINE, "Retry" link below the grid |
| Error / WS drop | ConnectionPill → POLLING (2s) — no banner, no toast |

### Escalation banner (appears on incident open)
- **Headline:** Center Disrupted — [Center Name]
- **Detail line:** Connectivity Loss · Severity: High · [N] sessions frozen
- **Dismiss:** none (auto-clears on resolve — do not add a manual close button)

### `CandidatePanel` — per-session status banner
| Session state | Banner copy |
|---|---|
| Frozen (center down) | Center disrupted. Your progress is saved. Timer paused. Do not refresh. |
| Resuming | Reconnected. Resuming your timer... |
| Resumed (delta chip) | +{N}s restored |
| Normal (healthy) | (no banner — clock runs, no message needed) |

### `LedgerPanel`
- **Panel header:** Checkpoint Ledger
- **Empty (pre-first-checkpoint, should not occur post-seed):** No checkpoints yet.
- **Row kinds (labels used in the ledger list):**
  - `genesis` → Genesis
  - `answer` → Answer Saved
  - `freeze` → Session Frozen
  - `resume` → Session Resumed

### `SimulatorControls` (same panel text everywhere it appears)
- **Panel header (fixed, load-bearing, do not soften):** SIMULATOR CONTROLS — not part of the production system
- **Kill Switch button:** Kill Switch
- **Kill Switch helper text (small, under button):** Cuts connectivity to the selected center.
- **Reconnect button:** Reconnect
- **Reconnect helper text:** Restores connectivity and resumes frozen sessions.
- **Reset button (if present):** Reset Demo
- **Center picker label:** Choose a center to disrupt

### `SimulatedBadge` chip
- **Label:** Simulated telemetry

### `CenterGrid` card status labels
| Status | Word shown next to color dot |
|---|---|
| Healthy | Healthy |
| Down | Down |
| Recovering | Recovering |

---

## 3. `/center/:id` — Center Detail

- **Headline:** [Center Name]
- **Subhead:** Center history and live status.
- **Primary CTA:** none (read-only)
- **Back link:** ← Back to Control Tower
- **Empty (no telemetry history yet):** No events yet.
- **Loading/Error:** same as Control Tower conventions (skeleton rows / ConnectionPill)

---

## 4. `/session/:id` — Candidate Session Inspector

- **Headline:** Session [short ID]
- **Subhead:** Full checkpoint history for this candidate.
- **Primary CTA:** none (read-only)
- **Back link:** ← Back to Control Tower
- **Empty (zero checkpoints — data bug, not a normal state):** No checkpoints recorded. This session may not have started correctly.
- **State-machine badge labels:** Active / Frozen / Resumed / Complete

---

## 5. `/incidents` — Incident Timeline (list)

- **Headline:** Incidents
- **Subhead:** Every disruption Sentinel has detected, in order.
- **Primary CTA:** none — click a row to open it
- **Empty state:** No incidents yet. Trigger one from the Control Tower. → link: Go to Control Tower
- **Loading:** skeleton rows
- **Error:** ConnectionPill → POLLING (2s), same as elsewhere

### Row fields (label style, not full sentences)
- Severity badge: Low / Medium / High
- Classification: Connectivity Loss / (future kinds)
- Timestamp (short, e.g. `14:32:07`)

---

## 6. `/incidents/:id` — Incident Detail + Verdict

- **Headline:** Incident [short ID] — [Center Name]
- **Subhead:** What happened, what the rule says, and what Sentinel decided.
- **Primary CTA:** none (read-only)
- **Secondary link:** View chain for this incident's centers →

### `VerdictCard`
- **Decision labels (colored per §3 hierarchy — amber/red/green):**
  - Re-conduct exam → **Re-Conduct Required**
  - Partial time extension → **Partial Time Extension**
  - No action needed → **No Action Needed**
- **Rule line label:** Rule Applied
- **Rule phrasing (example, fill values from policy):**
  `If average frozen time > 60s for more than 1 candidate, grant a time extension equal to the average frozen duration.`
- **Inputs section header:** Inputs
- **Input row labels:** Sessions Affected · Average Frozen Time · Max Frozen Time · Checkpoints Lost
- **Arithmetic section header:** How We Got Here
- **Arithmetic line style (monospace, literal computation, example):**
  `avg_frozen_ms (52,300) > threshold_ms (60,000)? No → Partial Time Extension`
- **Cost-avoided footnote label:** Illustrative cost avoided (not a guarantee)
- **Cost-avoided line (example):** `Estimated re-conduct cost avoided: ~₹42,000 (illustrative)`

### Empty / loading / error
| State | Copy |
|---|---|
| Verdict pending (incident still open) | Verdict computes automatically once the incident resolves. |
| Loading | skeleton card, same shape as VerdictCard |
| 404 / not available | Verdict not yet available. |

---

## 7. `/audit` — Chain Verifier + Tamper Demo

- **Headline:** Chain Integrity
- **Subhead:** Every checkpoint is hash-linked. Verify the whole chain in one click.
- **Primary CTA:** Verify Chain Integrity
- **Quarantined secondary CTA (inside red SimulatorControls panel):** Tamper (simulator)
- **Tamper helper text (small, under button):** Corrupts one stored hash to demonstrate detection. Simulator only — not a real attack path.

### Verify banner states
| State | Banner text | Color |
|---|---|---|
| Not yet verified | Not Yet Verified | grey |
| Verifying (rare, >1s) | Recomputing {N} hashes... | grey, spinner |
| PASS | Chain Verified — PASS | green |
| PASS detail line | {N} rows checked · verified at {timestamp} | green, smaller |
| FAIL | Tamper Detected — FAIL | red |
| FAIL detail line | Row broken: center {center}, seq {seq} — expected `{hash}`, found `{hash}` | red, monospace |
| True error (API unreachable) | Could not reach server. Try again. | grey, distinct from FAIL |

### Chain table
- **Table header:** Full Chain
- **Column labels:** Center · Seq · Kind · Hash · Prev Hash · Status

---

## 8. Buttons — canonical label list (reuse exactly, do not paraphrase per-instance)

- Kill Switch
- Reconnect
- Reset Demo
- Verify Chain Integrity
- Tamper (simulator)
- Retry
- Back to Control Tower
- Go to Control Tower

---

## 9. SHOW-phase pitch lines (short, for demo-director / pitch-writer later)

- **One-liner:** Sentinel is the control tower that keeps exams fair — it watches, it protects, and it proves.
- **Hook (opening line for judges):** Right now, if an exam center drops offline, no one can prove what happened to the candidates inside it. Sentinel can.
- **Demo close line:** Every decision you just saw was computed from a rule and an unbroken hash chain — not a guess.
- **Tamper-moment line (say while clicking Tamper):** Now watch what happens the moment someone touches the record.
- **Closing line:** That's the whole promise: see it, protect it, prove it.

---

## 10. Notes for frontend-builder

- Treat every string in this file as final copy. If a screen/component needs a string not listed
  here, add it to this file first, then implement — do not invent copy inline.
- The SimulatorControls header text is load-bearing per `design.md` §5/§7 — do not shorten or soften
  "not part of the production system."
- Status words always accompany color (never color alone) per `design.md` §6 accessibility rules —
  every label above already includes the word, use it as-is.
- Monospace styling applies to: hashes, arithmetic lines, cost-avoided figures, ledger hash columns —
  per `design.md` §5.
