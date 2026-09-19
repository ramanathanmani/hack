# PROBLEM — chosen challenge and framing

Rubric in force: **Technical track** (see intake.md §4). Weight shape drives everything below:
Innovation 20 + Prototype/MVP 20 = 40%; Problem Understanding 15 + Technical Feasibility 15 = 30%;
Impact on HE/Governance 15; Scalability 10; Presentation only 5.

## Selection: **PS06 — Resilient & Trustworthy Online Assessment Ecosystem**

### Scored against the six
| PS | Demo-wow | Originality headroom | Build risk in ~3h to Round 1 | Judge/organizer resonance | Verdict |
|---|---|---|---|---|---|
| 01 Career readiness | low | **very low** — every team builds a resume-scoring chatbot | low | medium | crowded |
| 02 Smart campus | low | low — reads as an ERP with no time to build an ERP | **high** (broad surface) | medium | reject |
| 03 AI exam / OSM | medium | medium | medium (needs answer-script data) | high | fallback #2 |
| 04 Rural digital inclusion | medium | medium | medium | high | fallback #3 |
| 05 AI public services | medium | low — grievance chatbot is the default answer | low | high | crowded |
| 06 Resilient assessment | **high** | **high** | medium-low if scoped to one loop | **highest** | **CHOSE** |

### Why PS06
1. **It is MPOnline's own bleeding wound.** MPOnline runs large-scale MP examination and counselling
   portals. The problem statement is unusually detailed and names the business outcome plainly —
   *avoid unnecessary re-conduct of examinations*. That is a budget line, not an abstraction. The 15%
   "Impact on Higher Education / Governance" criterion is nearly free if we quantify re-conduct cost.
2. **Lowest crowding.** It is the least "hackathon-shaped" of the six, and it is the last card on the
   page. Most 2–4 person teams will drift to PS01/PS05 chatbots. Differentiation is 20% of the score.
3. **The demo is inherently dramatic.** Nothing else on this list lets you break something live on stage
   and have the system save the exam in front of a judge. That converts a working prototype into a story
   without spending the (only 5%) presentation budget.
4. **It scopes down cleanly.** The PS lists twelve sub-asks. Twelve is a trap. The lifecycle framing the
   organizers themselves published — *Prevention → Detection → Response → Recovery → Trust* — lets us
   build one vertical slice through all five stages instead of twelve shallow features, and still answer
   the brief in the organizers' own vocabulary.

### The golden path to build (one loop, all five stages)
A live exam-integrity control tower for a simulated large-scale exam:
- **Prevention** — health telemetry from exam centres/candidate sessions; a risk score per centre.
- **Detection** — anomaly detection flags a centre going bad (latency spike, mass disconnects,
  answer-save failures) *before* candidates notice; auto-classifies and escalates the incident.
- **Response** — affected candidates' clocks freeze and they get an honest live status message;
  responses already captured are checkpointed to tamper-evident (hash-chained) storage.
- **Recovery** — on reconnect, session resumes at the exact checkpoint with time restored.
- **Trust** — a per-candidate, evidence-based audit trail and a decision-support verdict:
  *re-conduct / partial extension / no action*, with the reasoning shown.

The stage moment: a judge presses a button that kills a centre mid-exam, and the tower detects,
communicates, checkpoints, recovers and then issues an auditable fairness verdict — while the candidate
screen beside it never loses a single answer.

### Explicitly out of scope (protect the 3 hours before Round 1)
Real proctoring/face detection, actual question banks, user registration/auth flows, mobile apps,
multi-tenant admin, and any of the twelve sub-asks not on the loop above. Breadth is the failure mode here.

### Fallbacks
- If the judging panel signals they want education-facing rather than infrastructure-facing work:
  **PS03 (AI-driven OSM)** — same team, reuse the audit-trail and fairness machinery for marking
  consistency and evaluator-drift detection.
- If the venue network is too poor for a distributed demo: run the whole simulation locally and
  deterministically; the demo must never depend on venue wifi.

## Kill criteria
- If by the 13:30 Day-1 Round 1 the detect→recover loop is not visibly working end to end, drop
  Prevention analytics and Trust reporting and show only Detection → Response → Recovery. A three-stage
  loop that actually runs beats five stages of mockup, because Prototype/MVP is 20% and slides are 5%.
- Do not add a chatbot. Do not add a login screen.

## Open question that gates everything (see intake.md §9)
Whether application code may be written before 09 October. Until MPOnline answers
hackathon@mponline.gov.in, this pipeline does not enter BUILD.
