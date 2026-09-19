# DESIGN — Sentinel Control Tower

Phase: DESIGN · Agent: ux-designer · Date: 2026-09-19
Implements: `.hackathon/specs/spec-a.md` (winning spec) + `.hackathon/architecture.md`
`brand.md` not found at time of writing — all copy below is **TBD** placeholder text pending
copywriter; do not treat any string in quotes as final copy.

Design target: a judge sitting at the laptop for **90 seconds** must be able to (a) understand what
they're looking at in <10s, (b) cause the incident themselves, (c) see freeze → checkpoint → resume
happen live, (d) read a computed verdict, and (e) watch chain verification flip PASS→FAIL after a
tamper. Everything in this doc is optimized for that arc, not for a "full product" feel.

---

## 1. Golden path (numbered clicks — this is the demo script, UI must support it exactly)

1. Judge lands on `/` (Control Tower). Header shows framing line (exam name, live counts) +
   `ConnectionPill` = LIVE. Center grid shows 6–8 cards, all green/healthy, candidate counts, risk
   score badges near 0. `SimulatorControls` panel (red-bordered, labeled "SIMULATOR CONTROLS — not
   part of production system") is visible below/beside the grid, not hidden in a menu.
2. Judge picks any center card and clicks **Kill Switch** inside `SimulatorControls` (dropdown or
   per-card button — see §2 ControlTower). Nothing else on screen needs to change state first.
3. Within ~1–2s: the chosen center card flips to red/"down", its risk score jumps, `IncidentTimeline`
   gets a new row ("Connectivity Loss — Severity: High"), an escalation banner appears at the top of
   the page.
4. Judge's eye is drawn (via layout, §4) to the `CandidatePanel` for that center: each of the 3
   sessions shows a status banner ("Center disrupted — your progress is saved, timer paused, do not
   refresh" — TBD copy), clock stops, and `LedgerPanel` shows a new `freeze` checkpoint appended per
   session with its hash + prev-hash visibly linked.
5. Judge clicks **Reconnect** in `SimulatorControls`. Within ~1–2s sessions flip to `resumed`, clocks
   resume and visibly restore the frozen duration (a small "+47s restored" delta chip — TBD copy),
   `LedgerPanel` appends `resume` checkpoints.
6. Judge (or presenter) clicks the incident row in `IncidentTimeline` → navigates to
   `/incidents/:id`. `VerdictCard` shows decision ("Partial Time Extension" — TBD label per policy),
   the rule, the input numbers (affected count, avg/max frozen ms, checkpoints lost), and the
   arithmetic line-by-line — not just a badge.
7. Judge (or presenter) navigates to `/audit`. Clicks **Verify Chain Integrity** → chain shows
   PASS (green) with a timestamp and rows-checked count.
8. Presenter clicks **Tamper** button inside the same red-quarantined simulator panel on `/audit`
   (or runs `npm run tamper` in a visible terminal per architecture A2 — UI must support both:
   the button path is the primary one for a 90s demo since a terminal switch costs time).
9. Judge clicks **Verify Chain Integrity** again → flips to FAIL (red), with the exact broken row
   highlighted inline in the ledger/audit table (center, seq, expected hash, actual hash).

Total on-screen surface touched: `/`, `/incidents/:id`, `/audit`. `/center/:id`, `/session/:id`,
`/incidents` (list) are secondary/depth screens for Q&A after the 90s, not part of the timed path —
design them minimally (see §2 and §8).

---

## 2. Screen list

### `/` — Control Tower (primary demo screen, must be self-sufficient per AC-10)
- **Purpose:** single pane of glass — see all centers' health, watch the incident happen, watch one
  center's candidates freeze/resume live. This is the screen a judge should be able to understand
  with zero explanation.
- **Primary CTA:** Kill Switch (inside SimulatorControls) — the action that starts the demo.
  Secondary CTA: Reconnect (appears/enables only once a center is down).
- **Empty state:** N/A at rest — the screen always has fixture data post-seed (per architecture,
  `npm run seed` always produces the same starting state). If DB is literally empty (fresh install,
  pre-seed), show a single centered message: "No exam data yet — run `npm run seed`" (TBD copy) with
  no grid skeleton, since this state should never occur during a real demo.
- **Loading state:** on first mount before `/api/state` resolves, show skeleton cards (grey rounded
  rectangles matching final CenterGrid card size, no shimmer animation — keep offline/no dependency)
  for ≤1s typical; if it exceeds ~3s show `ConnectionPill` = OFFLINE with a manual "Retry" text link.
- **Error state:** WS drop → `ConnectionPill` flips LIVE → POLLING silently (per architecture, no
  modal, no toast spam) — this must look intentional, not broken; label reads "POLLING (2s)" so a
  judge who notices it reads it as a designed resilience feature, not a bug.

### `/center/:id` — Center Detail (secondary, cut-list item 1 / M4)
- **Purpose:** drill-down for "can I see just this center's history" Q&A after the 90s script.
- **Primary CTA:** none required — read-only view. Back-to-tower link.
- **Empty/loading/error:** same patterns as Control Tower, scoped to one center; empty telemetry
  history before first tick shows "No events yet" text row, not a broken chart (no charting lib
  exists per architecture ban — telemetry history is a simple list/table, not a sparkline in M1-M3).

### `/session/:id` — Candidate Session Inspector (secondary, cut-list item 4 / M4)
- **Purpose:** prove the append-only chain at the individual-candidate level for a skeptical judge.
- **Primary CTA:** none — read-only. Shows state-machine badge + full checkpoint list with hashes.
- **Empty/loading/error:** if session has zero checkpoints (should not happen post-seed since genesis
  is always written), show "No checkpoints recorded" — treat as a data bug indicator, not a normal
  state.

### `/incidents` — Incident Timeline list (secondary, cut-list item 1 / M4)
- **Purpose:** filterable history when more than one incident exists (multi-run rehearsals).
- **Primary CTA:** click a row → `/incidents/:id`.
- **Empty state:** "No incidents yet — trigger one from the Control Tower" (TBD copy) with a link
  back to `/`. This is a legitimate, expected state right after `npm run seed`.
- **Loading/error:** skeleton rows / POLLING pill, same convention as above.

### `/incidents/:id` — Incident Detail + Verdict (primary demo screen, step 6)
- **Purpose:** the "why should I trust this decision" payoff — show the computed verdict with its
  full reasoning, not a black-box label.
- **Primary CTA:** none — read-only. Secondary link: "View chain for this incident's centers" →
  `/audit` prefiltered (nice-to-have, not required).
- **Empty state:** if verdict not yet computed (incident still open, pre-reconnect), `VerdictCard`
  shows a pending placeholder: "Verdict computes automatically once the incident resolves" (TBD copy)
  — must not show a fake verdict early.
- **Loading state:** skeleton card matching `VerdictCard` shape.
- **Error state:** if `/api/verdicts/:incidentId` 404s (shouldn't, but), show "Verdict not yet
  available" text, not a raw error/stack trace.

### `/audit` — Chain Verifier + Tamper Demo (primary demo screen, steps 7–9)
- **Purpose:** the trust payoff. Must make PASS and FAIL visually unmistakable from across a room.
- **Primary CTA:** "Verify Chain Integrity" button, large, top of page, always visible without
  scrolling. Secondary/quarantined CTA: "Tamper (simulator)" inside the same red
  `SimulatorControls`-styled panel used elsewhere (A2 quarantine convention), visually separated by a
  divider and a lock/warning icon so it never looks like a normal user action.
- **Empty state:** before first verify click, show a neutral (grey, not green/red) "Not yet
  verified" state — never default to a false PASS.
- **Loading state:** verify button shows an inline spinner/disabled state for the (expected: near-
  instant, <1s) computation; if it somehow takes >1s show "Recomputing N hashes..." text.
- **Error state:** this screen's "error" IS the FAIL state and is a designed success path, not a
  failure to route around — see §3 hierarchy. A true error (e.g. API unreachable) is a distinct grey
  "Could not reach server" banner, visually different from red FAIL.

---

## 3. Information hierarchy

Rank of what must be perceivable fastest, per screen, since judges scan in seconds:

**Control Tower (`/`):**
1. Overall system state at a glance — is anything red? (grid color, largest visual weight)
2. The live incident ticker/banner (top strip, appears only when relevant, high contrast)
3. The one center under discussion — candidate panel + ledger (secondary column, always visible
   once a center is selected/down, not behind a modal)
4. SimulatorControls — visible but visually "backstage" (red border, smaller type, clearly not part
   of the "real" product chrome) so a judge doesn't mistake it for the actual product surface
5. Framing header counts (centers/sessions/incidents) — smallest, top bar, ambient context only

**Incident Detail (`/incidents/:id`):**
1. Decision label (re-conduct / partial-extension / no-action) — largest text on the card, colored
   (amber = partial, red = re-conduct, green = no-action)
2. The rule + arithmetic lines — second tier, monospace or clearly "computed" styling to signal
   "this is math, not opinion"
3. Raw inputs (counts, ms values) — third tier, table/definition-list style
4. `cost_avoided` illustrative figure — clearly labeled "illustrative" per architecture A6, smaller
   type, footnote treatment so it reads as honest, not oversold

**Audit (`/audit`):**
1. PASS/FAIL state — the single largest element on the page, full-width banner, color + icon +
   word, unmissable
2. The broken-row detail (center, seq, expected vs actual hash) when FAIL — directly under the
   banner, monospace hashes with a visual diff (strikethrough/red on the mismatched hash)
3. Full chain table — below the fold, scrollable, for someone who wants to inspect further
4. Tamper control — bottom or clearly demarcated side panel, never above the Verify button

---

## 4. Component inventory (maps to architecture §3 `web/src/components/`)

| Component | Role | Notes |
|---|---|---|
| `FramingHeader` | Top bar: exam name (TBD copy), live counts (centers/sessions/incidents), `ConnectionPill` | Ambient, thin, always present |
| `ConnectionPill` | LIVE / POLLING (2s) / OFFLINE indicator | Small pill, top-right, color-coded (green/amber/grey) |
| `CenterGrid` | Grid of center cards: name, status color, risk score, candidate count | CSS grid, 2–4 cols responsive, min 6 cards |
| `CandidatePanel` | Per-selected-center list of 3 candidate sessions: state badge, question stub, answer box, clock | Clock text is server-driven only (never client-computed per architecture §5) |
| `LedgerPanel` | Live-appending list of checkpoints: seq, kind, short hash, prev-hash link indicator | Newest at top or bottom — pick one and keep it consistent app-wide (recommend: newest at top, like a log) |
| `IncidentTimeline` | List/feed of incidents with severity + classification + timestamp | Row click → `/incidents/:id` |
| `VerdictCard` | Decision + rule + inputs + arithmetic + cost-avoided (with `basis` footnote) | Reusable on both Incident Detail and (optionally) inline on Control Tower escalation banner |
| `SimulatorControls` | Red-bordered "SIMULATOR CONTROLS" panel: Kill/Reconnect/Reset per center, Tamper on audit page | Same visual treatment everywhere it appears — this consistency IS the "honesty" signal per A6/A2 |
| `SimulatedBadge` | Small chip: "simulated telemetry source" | Attached to any element whose underlying data originates from the simulator (per AC-13) |
| Verify banner (part of `Audit.tsx`, not separately listed in architecture but needs its own visual spec) | Full-width PASS/FAIL/neutral state banner | See §3 hierarchy — this is the single most important visual asset in the whole app |
| Status/escalation banner (Control Tower) | Top strip appearing on incident open | Auto-dismiss on resolve, not manually dismissable mid-incident (avoid a judge losing it) |

No icon library, no chart library, no UI kit per architecture §2 — inline SVG only, hand-drawn where
needed (e.g. a simple hash-link glyph between checkpoint rows).

---

## 5. Layout + spacing rules

- **Base unit:** 8px grid. All padding/margin/gap values are multiples of 8 (4px allowed only for
  hairline internal spacing like badge padding).
- **Page shell:** `FramingHeader` fixed height (56px), full-width, sticky top. Below it, main content
  max-width 1440px, centered, 24px side gutters on desktop, 16px on narrow windows (this is a laptop
  demo, not required to be fully responsive to mobile — do not spend time on mobile layout).
- **Control Tower layout:** two-column below the header on screens ≥1024px wide — left column
  (~60%) = `CenterGrid` + `IncidentTimeline` stacked; right column (~40%) = `CandidatePanel` +
  `LedgerPanel` stacked, for the currently-selected/most-recently-affected center. Below 1024px,
  stack single-column in that same order (grid → timeline → candidate panel → ledger) so the
  incident-relevant content is still reachable without a modal.
- **Card grid:** `CenterGrid` cards fixed min-width 160px, gap 16px, wraps naturally via CSS grid
  `auto-fill, minmax(160px, 1fr)`.
- **Status color coding (consistent everywhere, not just centers):** green = healthy/PASS/no-action,
  amber = degraded/partial-extension/pending, red = down/FAIL/re-conduct/escalated. Never reuse red
  for anything that is not "bad" and green for anything that is not "good" — judges pattern-match
  color fast and this must not mislead.
- **SimulatorControls visual quarantine:** 2px solid red/warning-colored border, slightly different
  background tint (e.g. faint red-tinted grey), 16px internal padding, always labeled with the fixed
  header text "SIMULATOR CONTROLS — not part of production system" (TBD exact copy, but the
  "simulator/not production" meaning is load-bearing, per architecture §7 — do not soften it away).
- **Verify banner:** full content-width, min-height 96px, 24px padding, largest type on the audit
  page (32–40px for the PASS/FAIL word itself).
- **Monospace usage:** hashes, arithmetic lines, and any raw computed value use a monospace font
  stack (system: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) to visually mark "this
  is data/computed," distinct from body/UI text (system sans stack, per architecture no web fonts).

---

## 6. Accessibility minimums

- **Contrast:** all status colors (green/amber/red) paired with text/icon/label, never color alone
  (colorblind judges/demo lighting) — e.g. status = colored dot + word ("Healthy"/"Down"), PASS/FAIL
  = color + word + icon (checkmark/cross SVG). Text contrast ratio ≥4.5:1 for body text, ≥3:1 for
  large text (18px+/bold 14px+), per WCAG AA — verify red-on-white and amber-on-white specifically
  since amber-on-white commonly fails contrast; darken amber if needed (e.g. `#9a6700` not `#ffc107`
  for text use).
- **Focus states:** every interactive element (buttons, links, table rows that navigate) has a
  visible focus ring (2px outline, offset 2px, not just a browser default that plain CSS resets
  might remove). Kill Switch / Reconnect / Verify / Tamper buttons must be keyboard-reachable and
  keyboard-activatable (Enter/Space) since a judge might tab to them.
- **Labels:** every button has visible text (no icon-only buttons without an `aria-label` at
  minimum, though prefer visible text always given plain-CSS/no-icon-library approach). Status
  badges and pills have `aria-label` or visible text equivalent, not color-only meaning conveyed to
  screen readers.
- **Live regions:** the escalation banner, incident timeline new-row, and PASS/FAIL banner should use
  `aria-live="polite"` (or `"assertive"` for PASS/FAIL flip) so state changes are announced, matching
  the fact that this whole product is about state changing without the user re-navigating.
- **Motion:** avoid flashing/strobing transitions on the red "down"/FAIL states (a solid color
  change or a single smooth fade is fine; no rapid blink) — both for accessibility and because rapid
  blink reads as "buggy" rather than "alerting."
- **Semantic structure:** use real `<button>` elements for actions (not styled `<div onClick>`), real
  `<table>` for the checkpoint/ledger and audit rows so screen readers get row/column semantics.

---

## 7. What NOT to design

- No settings page, no configuration UI (verdict thresholds are env vars per architecture §6, not a
  UI — do not build a policy-editing screen even as a stretch).
- No admin/roles/user-management screens — there is no auth at all (architecture §7); do not design
  a login screen "for later," do not mock a user avatar/account menu.
- No onboarding flow, tutorial, tooltip tour, or "welcome" splash screen. The product must be
  understandable from the Control Tower's layout and labels alone within the 90s demo; if it needs an
  explainer screen, that's a layout failure, not a missing screen.
- No multi-tenant switcher, no organization picker.
- No notification/alert preferences UI, no email/SMS templates (out of scope per spec §2).
- No mobile-specific layout/breakpoints below ~768px — this runs on one presenter laptop.
- No dark-mode toggle or theming system — pick one theme (light, high-contrast-friendly) and ship it.
- No animated charts/sparklines (also banned at the architecture level — no charting library). Any
  "trend" is a plain list/table.
- No export/PDF/report-generation UI (mentioned only as Day-2 stretch in spec §10 — not this pass).
- No search bar, no global command palette, no filters beyond the single severity/center filter
  already specified for `/incidents` — do not add filter chips, saved views, or sort-order pickers.
- No polish/empty decorative illustrations, no marketing landing page — `/` IS the product, not a
  splash page in front of it.

---

## 8. Handover notes

- All quoted copy strings in this doc are placeholders marked TBD; copywriter should treat §1 and
  §2's quoted strings as the literal set that needs final wording (status banners, verdict labels,
  empty-state text, SimulatorControls header) — do not introduce new UI copy sites without updating
  this doc.
- `brand.md` did not exist at design time — no color palette, type scale, or logo lockup was
  available. Color usage in §5/§6 is functional (status semantics) not brand-driven; if brand.md
  lands later, only hex values / type family should change, not the semantic mapping (green=good,
  amber=caution, red=bad) or the layout structure.
- Frontend-builder should treat §2 (screens) and §4 (component inventory) as directly mapping to the
  existing `web/src/routes/` and `web/src/components/` files named in architecture.md §3 — no new
  component files are introduced by this doc.
