# Status Report — PLAN complete, entering DESIGN → BUILD

**Date:** 2026-09-19  
**Current Phase:** PLAN (complete); next phases are DESIGN (brand-namer, ux-designer, copywriter) → BUILD (backend-builder, frontend-builder in parallel)  
**Hours remaining:** N/A (pre-event reference-prototype build; real event is 20 days out on 09–10 Oct with ~3h Round-1 clock)  
**Demo freeze:** false (full build runway available; no time pressure yet)

---

## Summary

ARCHITECTURE and PLAN phases are locked. Plan.md defines a 4-milestone golden path (M1 Checkpoint parity → M2 Fleet → M3 Trust → M4 Depth) with 14 acceptance criteria (AC-1..AC-14) and strict milestone gates. M1 is the non-negotiable floor: if only one thing ships, it is the clickable kill→detect→freeze→checkpoint→reconnect→resume→verdict loop on a single center with real hash-chained checkpoints, served live over HTTP+WS, rendered by a real React UI, all offline with zero external dependencies.

---

## Status by category

| Category | Status |
|---|---|
| **DECISION** | ✓ DONE — spec-a wins, 14 ACs, 7 amendments, freeze rule, risk register, 8-item cut list |
| **ARCHITECTURE** | ✓ DONE — data model, API surface, folder map, SQL schema, milestone→AC gating table, all risks catalogued |
| **PLAN** | ✓ DONE — ordered backlog T00–T102 with est, owners, dependencies, 4 milestone gates (T1G–T4G), kill gates at T-6h/T-3h/T-1h |
| **DESIGN** | ▶ NEXT — brand-namer, ux-designer, copywriter (can run in parallel with frontend-builder scaffold) |
| **BUILD** | ON DECK — backend-builder and frontend-builder fork after T05 scaffold gate |
| **Blockers** | See section below — none are code blockers |

---

## Blockers (human/process only; do not block BUILD)

1. **Rules conflict — pre-event clarification needed.** FAQ restricts "previously built projects"; session is constructing a reference prototype. Status: Not a blocker for building now (decision.md D6); requires human email to hackathon@mponline.gov.in before the Oct 9 event. **Owner: User.** Ticket filed in STATE.md blockers.

2. **No registered team.** The event requires 2–4 humans aged 16–25, physically present in Bhopal, with paid registration. Outside this session's scope. **Status: Acknowledged; does not block prototype build.** Owner: User (before Oct 9).

3. **Unknown deadlines.** Registration close date, submission-lock deadline, and fee are not yet published on the hackathon URL. **Status: Tracked in STATE.md; low risk (20 days to clarify).** Owner: User (monitor mponline.gov.in).

---

## Next human or agent action (immediate)

**Conductor dispatches brand-namer, ux-designer, copywriter to DESIGN phase.**

- Brand-namer: propose "Sentinel" tagline, 1-liner, visual identity (color palette for health states, quarantine warning style)
- UX-designer: layout sketches for `/` (control tower master view), `/audit` (verification UI), drill-down routes (optional under M4)
- Copywriter: framing header ("Session 2 of 3 — 8 centers — 412 candidates live"), verdict explanation prose, honesty labels, demo script callouts

**Parallel track:** Integration-agent begins SCAFFOLD (T00–T05) immediately after DESIGN completes or if DESIGN and BUILD can overlap per parallelism rules. T05 scaffold gate check (`npm install`, `npm run typecheck`, `better-sqlite3` smoke test) must pass before backend-builder and frontend-builder fork and proceed in parallel.

---

## Recommended cuts (if behind schedule)

**None recommended now.** We are 20 days ahead of the real event and not constrained by wall-clock. If DESIGN or BUILD reveals overrun before the real event, apply decision.md §8 in order:

1. Drop `/incidents` list + `/incidents/:id` detail (not core arc)
2. Drop Docker Compose (zero demo value)
3. Drop per-center risk trend sparklines (keep scalar only)
4. Drop `/session/:id` detail route
5. Drop WS→poll auto-degrade `ConnectionPill` UI (preserve underlying resilience)
6. Drop verdict reasoning breakdown beyond label + three numbers
7. Drop `/center/:id` detail route
8. Drop audit UI, keep CLI fallback (`scripts/verify-chain.ts`)

**Never cut:** kill switch, freeze, hash-chained ledger, resume with time restored, computed verdict, offline operation. These are the product (AC-1..AC-6).

---

## Demo freeze status

- **Recommendation: demo_freeze = false** (no time pressure; prototype schedule not in play)
- **Gate:** Once BUILD phase begins and the first end-to-end loop (M1, task T1G) is live and gates pass, `pm-timebox` will reassess at each milestone gate (T2G, T3G, T4G)
- **Trigger for freeze:** If we slip to ≤3 hours from Round-1 cut (13:30 IST on Day 1, Oct 9), demo_freeze switches to true and only debugger, test-runner, git-pusher, devops-deploy, demo-director, pitch-writer, readme-submit, scribe, pm-timebox may run per CLAUDE.md
- **For reference event only:** Plan.md §2 defines kill gates: T-6h (cut Phase 4), T-3h (demo_freeze = true), T-1h (submit kit locked, git push final)

---

## Artifacts in play

- `/home/user/hack/.hackathon/decision.md` — spec ruling, 14 ACs, 7 amendments, freeze rule, risk register, 8-item cut list (read by all builders)
- `/home/user/hack/.hackathon/architecture.md` — data model, API, folder map, schema, milestone→AC gating, run/test/deploy commands, top-5 risks, determinism/mock strategy (read by all builders before code)
- `/home/user/hack/.hackathon/plan.md` — ordered backlog T00–T102, 4 milestone gates, parallelism rules (read by all agents)
- `/home/user/hack/.hackathon/specs/spec-a.md` — "Sentinel" (winning spec, superseded by decision.md)
- `/home/user/hack/.hackathon/problem.md` — PS06 scope, golden path, kill criteria
- `/home/user/hack/.hackathon/research.md` — stack recommendation

---

**Next phase dispatcher: brand-namer ∥ ux-designer → integration-agent (T00–T05) → backend-builder ∥ frontend-builder (T10–T25+) → data-seeder (T60–T61) → qa-demo-path (T70–T72) → …**
