# Decision Log

### 2026-09-19 — Selected idea: GreenGate
- Decision: Pursue "GreenGate" (Bob 2.0 autonomously drives a broken repo to green CI, then explains its fixes) as the primary product idea for IBM Bob 2.0 Hackathon. "HandoffPack" (Bob 2.0 generates missing tests/docs/changelog) held as conservative fallback.
- Why: Best balance of demo wow (visible red→green transformation), rubric fit (Bob 2.0 is the core decision-maker, not decorative), and feasibility in an 8–24h build, per problem.md's judging-criteria mapping and kill criteria (must be structurally central, must work live, no unconfirmed-API dependency).
- Rejected alternatives: OnboardBot (install/sandboxing risk live on stage), RegressionWatch (highest wow but least feasible in short build, flaky adversarial loop), LiveCoPilot Arena (doubles infra risk, reads as gimmicky vs. "useful product").
- Follow-up: research-scout must verify at event kickoff whether IBM Bob 2.0 supports autonomous multi-file edits/pushes. If not, fall back to HandoffPack rather than forcing GreenGate against a read-only tool.

### 2026-09-19 — Pipeline held at RESEARCH (status=blocked)
- Decision: Stop the pipeline at end of RESEARCH-entry rather than fabricating architecture/spec decisions.
- Why: IBM Bob 2.0's real capabilities are inaccessible until the event's Kick-Off Stream (Sept 25, 2026); SPEC/ARCHITECTURE would otherwise be based on guesses about a required sponsor tool, violating "do not invent sponsor APIs not in intake."
- Rejected alternatives: Proceeding to SPEC/ARCHITECTURE speculatively — rejected because a wrong bet on Bob 2.0's capabilities (autonomous edits vs. read-only suggestions) would waste build hours during the actual 48h window.
- Follow-up: Resume pipeline at event start by re-running research-scout against live IBM Bob 2.0 access, then continue SPEC → DECISION → ARCHITECTURE per hackathon-conductor dispatch map.
