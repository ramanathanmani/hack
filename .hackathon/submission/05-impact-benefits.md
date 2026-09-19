# Impact & Benefits Document — Sentinel

## Who benefits and how

- **Candidates.** A candidate whose center goes dark today has only a phone call and an email as
  evidence that anything happened to them. With Sentinel, they get a per-session checkpoint history —
  proof of exactly when their progress was saved and exactly how much time was frozen and restored.
  Disputes stop being "the system was fine at our end" versus "it wasn't," and become a verifiable
  record either side can check.
- **MPOnline / the exam authority.** The verdict card is a governance artifact: for a real incident,
  it states which candidates were affected, the rule applied, the arithmetic, and the recommended
  remedy (Re-Conduct / Partial Time Extension / No Action). Instead of a blanket, expensive
  re-conduct decided defensively "to be safe," the authority can make — and later defend to a court
  or an RTI request — a narrower, evidence-backed decision.
- **Auditors / oversight bodies.** `/audit` recomputes the full tamper-evident hash chain on demand.
  A post-exam audit is a one-click operation with a clear PASS/FAIL result naming the exact broken
  record, rather than a manual reconciliation exercise.

## Quantified example (from the working prototype — read the caveat below)

On the seeded demo incident: 3 of 24 candidate sessions at one center were frozen for roughly 47
seconds, the system computed a **Partial Time Extension** verdict (not a full re-conduct), and
estimated **21 candidates spared a re-conduct** at an illustrative **₹850/candidate** re-conduct
cost, for a total of **~₹17,850 in cost avoided**.

**Honest caveat — read before citing this number.** ₹850/candidate is an **illustrative constant
this project invented**, not a figure sourced from MPOnline or any published re-conduct cost basis.
The app labels this figure "illustrative" on screen for exactly this reason. The ₹17,850 total is
arithmetic on 24 *simulated* candidate sessions, not real exam data — it demonstrates the *shape* of
the calculation Sentinel performs, not a validated real-world savings figure. A real deployment would
need MPOnline's actual per-candidate re-conduct cost (halls, invigilators, security, logistics) to
replace this placeholder before the number is cited to a decision-maker.

## The scale argument (also unmeasured — stated honestly)

The pitch argues that "8 centers on screen today, 800 is architecturally the same code path with
more rows," because the hash chain is sharded per center and verification is parallel and per-center.
This is a real architectural property, visible in the code (`server/src/domain/chain.ts`,
`server/src/repo.ts`) — but it has **not been benchmarked at that scale**. 24 simulated sessions is
not evidence about how the system behaves at the scale of a real statewide exam with potentially
hundreds of thousands of candidates. Treat the scalability claim as "the architecture does not
obviously prevent this," not as "this has been proven at scale."

## What would need to happen before real-world impact could be claimed

1. Replace the illustrative ₹850 constant with MPOnline's actual re-conduct cost basis.
2. Run a load/soak test at a realistic center and session count to validate the scalability claim.
3. Get primary input from an MPOnline stakeholder on whether the assumed verdict thresholds (freeze
   duration → remedy) match real policy, since none has been validated externally yet.
