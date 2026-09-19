# Problem Definition

## Problem in one sentence
Developers waste hours of a limited hackathon/dev sprint on repetitive, error-prone glue work (wiring APIs, writing boilerplate, chasing flaky tests, reviewing diffs) that an AI dev partner like IBM Bob 2.0 should be able to absorb — but generic AI coding assistants don't specialize deeply enough in any one of these workflows to be trusted end-to-end.

## Who hurts, what they do today, why it fails
- **Who:** Solo developers and small teams under time pressure (hackathon builders, small startup teams, students) who use AI coding tools but still hand-hold them constantly.
- **What they do today:** Manually re-prompt AI assistants step by step, copy-paste errors back in, re-run tests by hand, and manually review AI-generated diffs for regressions.
- **Why it fails:** Today's assistants optimize for single-shot code generation, not for owning a narrow workflow loop (e.g., "keep tests green," "keep this API integration verified," "keep this repo demo-ready") end-to-end without supervision. This burns exactly the scarce hours a 48-hour hackathon can't spare.

## Judging criteria mapped to product evidence
Official weighted criteria are UNKNOWN (see intake.md gap #3). Working assumption, mapped to typical lablab.ai criteria categories used across their events (technicality, usefulness/impact, presentation/pitch, IBM Bob 2.0 usage depth) until confirmed:

| Likely criterion | What we will show |
|---|---|
| Uses IBM Bob 2.0 as a core, non-trivial component | Bob 2.0 is the engine driving an autonomous workflow loop, not a side chat window |
| Usefulness / real problem solved | Live demo of Bob 2.0 catching and fixing a real, injected bug/regression unattended |
| Technical execution | Working, deployed prototype; clean repo; passing tests shown live |
| Presentation / pitch | 90-second scripted demo, clear before/after, one crisp narrative |
| Innovation / novelty | The "narrow, autonomous loop" framing rather than "yet another chat wrapper" |

## Constraints
- Time: 48-hour build window (Sept 25–27, 2026); we have not started building yet — plan is pre-event.
- Team: size UNKNOWN, assume solo-or-small-team default per platform (solo allowed).
- Must-use sponsor tool: **IBM Bob 2.0 IDE** — eligibility-gating requirement, must be a core component, not decorative.
- IBM Bob 2.0 itself likely inaccessible until Kick-Off Stream (Sept 25) — architecture and idea selection must not depend on pre-event experimentation with Bob 2.0's actual API/capabilities beyond public docs.
- Deadline time/timezone UNKNOWN — treat Sept 27 end-of-day as the hard constraint until confirmed.

## Must / should / won't
- **Must:** Showcase IBM Bob 2.0 as the core driver of the product's value; ship a working, demoable prototype; stay inside the 48-hour window.
- **Should:** Have a narrow, single golden-path demo rather than a broad feature set; include a short pitch deck and video per lablab norms.
- **Won't:** Build a general-purpose "AI chatbot for code" (too generic to score on novelty); won't depend on undisclosed/unconfirmed Bob 2.0 API capabilities without a fallback.

## Kill criteria (what makes this lose)
- Bob 2.0 is used as a cosmetic feature (e.g., just calling it in one function) rather than being structurally central.
- Demo requires narration to explain what "would" work rather than showing it working live.
- Idea depends on a sponsor API/dataset not confirmed to exist or be accessible in the 48h window.
- No fallback exists if the live/hosted Bob 2.0 integration breaks during judging.

## Demo-in-90-seconds definition of done
In under 90 seconds, a judge sees: (1) a broken/incomplete codebase state, (2) IBM Bob 2.0 autonomously diagnosing and fixing/completing it inside our product's workflow (not raw IDE chat), (3) a visible before/after (failing test → passing test, or missing feature → shipped), (4) a one-line value statement tying it back to time saved.

## Risks
- **API/access risk:** IBM Bob 2.0 access timing and capabilities are unconfirmed pre-event (flagged in intake.md) — HIGH, needs research-scout at event start before committing architecture.
- **Auth risk:** Unknown what credentials/setup Bob 2.0 requires; could eat build hours if onboarding is slow.
- **Judging-criteria risk:** Building against assumed (not confirmed) rubric weights could misallocate effort — MEDIUM, resolve via Discord/organizers as soon as possible, ideally before SPEC.
- **Scope risk:** "AI dev partner" theme is broad enough to invite scope creep — mitigated by narrow golden-path requirement above.

## Multiple official problem statements analysis
Only one open theme was found (not multiple competing statements): "Build what's next in AI-assisted development" using IBM Bob 2.0. No table needed — recommendation is to pick a single narrow angle under this one theme, produced in ideas.md.

STATE.md next_agent updated to idea-generator.
