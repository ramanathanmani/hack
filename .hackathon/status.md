# Status Report — Phase DECISION → ARCHITECTURE

**Date:** 2026-09-19  
**Phase:** DECISION (complete), transitioning to ARCHITECTURE → PLAN → BUILD  
**Hours remaining:** N/A (pre-event reference-prototype build; real event is 20 days out on 09–10 Oct)  
**Demo freeze:** false (full build runway available)

---

## Summary

Spec-judge ruling is in and locked. **Spec A ("Sentinel")** wins with 14 acceptance criteria (AC-1..AC-14), 7 binding amendments (A1–A7), a risk register, and a prioritized 8-item cut list. Spec B ("Checkpoint") absorbed as milestone M1 — strict scope subset, no re-decision needed if M1 is the final shipping milestone.

---

## Status by category

| Category | Status |
|---|---|
| **DECISION** | ✓ DONE — ruling, amendments, freeze rule, AC list, risk register, cut list all in place |
| **Specification** | ✓ LOCKED — 14 acceptance criteria (decision.md §7); no new features until phase reopens scope |
| **Architecture** | ▶ NOT YET — ready for architect to begin design phase |
| **Build queue** | — — on hold pending architecture input |
| **Blockers** | See section below |

---

## Blockers (human/process only; do not block BUILD)

1. **Rules conflict — pre-event clarification needed.** FAQ restricts "previously built projects"; session is constructing a reference prototype. Status: Not a blocker for building now (decision.md D6); requires human email to hackathon@mponline.gov.in before the Oct 9 event. **Owner: User.** Ticket filed in STATE.md blockers.

2. **No registered team.** The event requires 2–4 humans aged 16–25, physically present in Bhopal, with paid registration. Outside this session's scope. **Status: Acknowledged; does not block prototype build.** Owner: User (before Oct 9).

3. **Unknown deadlines.** Registration close date, submission-lock deadline, and fee are not yet published on the hackathon URL. **Status: Tracked in STATE.md; low risk (20 days to clarify).** Owner: User (monitor mponline.gov.in).

---

## Next action (immediate)

**Architect enters ARCHITECTURE phase.**

- Consume decision.md §4–§7 (mandatory merges M1–M5, amendments A1–A7, AC-1..AC-14)
- Design the system in three milestone arcs: M1 (Checkpoint parity, runnable by itself), M2 (Fleet), M3 (Trust), M4 (Depth)
- Output: architecture.md with data model, API surface, component diagram, timing story (AC-5, AC-11), and WS→polling fallback (risk register mitigation)
- **Constraint:** Golden path rule — every commit leaves a runnable demo. Milestone M1 is the stage gate.

---

## Recommended cuts (if behind schedule)

**None recommended now.** We are ahead of the 3-hour Round-1 clock. Decision.md §8 lists 8 cuts in priority order (e.g., drop `/incidents` list, drop Docker Compose, drop trend sparklines, etc.). Apply in order only if architecture+plan reveals overrun. Cuts 1–7 preserve a coherent demo; cut 8 (audit UI) is the last acceptable cut before shipping the CLI fallback.

**Never cut:** kill switch, freeze, hash-chained ledger, resume with time restored, computed verdict, offline operation. These are the product.

---

## Demo freeze status

- **Recommendation: demo_freeze = false** (no time pressure; prototype schedule not in play)
- **Gate:** Once BUILD phase begins and the first end-to-end loop (M1) is live, `pm-timebox` will reassess at each milestone gate
- **Trigger for freeze:** If we slip ≤3 hours from Round-1 cut (13:30 IST on Day 1, Oct 9), demo_freeze switches to true and only debugger, test-runner, git-pusher, demo-director, pitch-writer, and scribe may run

---

## Artifacts in play

- `/home/user/hack/.hackathon/decision.md` — ruling, amendments, AC list, risk register (read by architect)
- `/home/user/hack/.hackathon/specs/spec-a.md` — "Sentinel" (winning spec)
- `/home/user/hack/.hackathon/specs/spec-b.md` — "Checkpoint" (M1 reference)
- `/home/user/hack/.hackathon/research.md` — stack: Node/TS + SQLite + WS/polling fallback + React/Vite
- `/home/user/hack/.hackathon/problem.md` — PS06 scope, golden path, kill criteria

---

**Next phase dispatcher: architect → planner → (BUILD: backend-builder ∥ frontend-builder) → data-seeder → …**
