# Innovation & Differentiation Note — Sentinel

## The differentiated angle

Most solutions built for an exam-integrity theme default to a proctoring or cheating-detection tool
— webcam monitoring, plagiarism checks, a chatbot for candidate grievances. Sentinel takes a
different angle entirely: **it treats the exam infrastructure itself as the integrity risk**, not
the candidate. The realistic failure mode on exam day is a router, a UPS, or a leased line — not a
cheating candidate — and that is the failure Sentinel is built to survive and prove.

## What is novel

- **A live, breakable demo, not a report.** A judge can press a real kill switch on stage and watch
  the system detect the outage itself (via a missed heartbeat, not the button), freeze only the
  affected sessions, and recover — then tamper with the stored evidence and watch the audit catch it.
  Most "integrity" submissions can only be described; this one can be attacked live.
- **A fleet-level control tower plus a per-center tamper-evident ledger plus a policy-transparent
  verdict, combined.** Each piece exists elsewhere in isolation (dashboards, hash chains, rules
  engines); the combination — turning a detected outage into a per-candidate, auditable remedy with
  published arithmetic — is not something that exists in Indian exam operations today.
- **The verdict engine is the original piece.** Instead of a binary "flagged / not flagged," it
  computes a specific remedy (Re-Conduct / Partial Time Extension / No Action) from real inputs and
  shows its work: the rule, the inputs, the arithmetic, and an illustrative cost-avoided figure. This
  turns an operational incident into a defensible governance decision, not just an alert.

## An honest limitation, stated plainly

**Sentinel does not use AI or machine learning**, at an event whose framing and several of its six
problem statements are AI-centric — PS06 itself names "AI analytics on systemic risk" and "early
prediction of technical/operational failure" as sub-asks this solution does not attempt.

This was a deliberate choice, not an oversight: the core claim Sentinel makes — "this verdict is
correct and this evidence has not been tampered with" — is strongest when it is a **deterministic,
auditable computation**, not a model's inference. A rule with published arithmetic can be checked by
hand by a court or an auditor; a model's confidence score cannot. We judged that a decision you can
audit beats a decision you can't explain, for this specific use case (a governance/fairness verdict
with real financial and legal weight).

We accept this will cost points from a judge scoring strictly against the AI-analytics sub-ask, and
disclose it here rather than overstating what was built. A natural, honest extension — not built in
this prototype — would be a *risk-scoring* layer (predicting which centers are likely to fail next
from historical telemetry patterns) sitting alongside, not replacing, the deterministic verdict
engine. See the Implementation & Feasibility Plan for where that would fit in a follow-on build.
