# Product Ideas

## 1. GreenGate — the PR that only merges when it's actually safe
**One-liner:** IBM Bob 2.0 sits on your PR and autonomously fixes failing tests/lint/type errors until the branch is truly green, then explains what it changed.

- **User + job-to-be-done:** A developer who just wants a PR to pass CI without babysitting 5 rounds of "fix this, fix that."
- **Why it scores on THIS rubric:** Bob 2.0 is the literal decision-maker (what to fix, when it's done) — deeply core, not decorative. Concrete, verifiable before/after (red CI → green CI).
- **Golden-path demo (≤6 steps):** 1) Show a repo with 3 intentionally broken things (failing test, lint error, type error). 2) Trigger our tool. 3) Bob 2.0 diagnoses each failure. 4) Bob 2.0 pushes fixes autonomously. 5) CI turns green live on screen. 6) Tool prints a plain-English changelog of what it fixed and why.
- **Build in 8h vs 24h:** 8h = CLI that wraps Bob 2.0 + a local repo with seeded failures + terminal demo. 24h = add a small web dashboard showing the fix timeline + GitHub Actions integration.
- **Unique twist:** "Explain your fix" mode — Bob 2.0 must justify each change in plain language before it's allowed to count as done, building trust rather than blind automation.
- **Fatal risks:** If Bob 2.0's actual capabilities don't include repo-wide autonomous multi-file fixes, this shrinks to single-file fixes (still demoable, less wow).
- **Scores (1–10):** wow 8, feasibility 7, rubric-fit 9, uniqueness 7

## 2. OnboardBot — zero-to-running in one command, for any repo
**One-liner:** Point Bob 2.0 at a strange, undocumented repo and it produces a working local dev environment plus a live "why this works" walkthrough.

- **User + job-to-be-done:** A developer joining a new codebase (or a hackathon teammate) who needs to go from clone to running app fast.
- **Why it scores on THIS rubric:** Directly "useful" and demonstrates deep repo understanding by Bob 2.0, not just code generation.
- **Golden-path demo:** 1) Clone an intentionally messy sample repo with missing README/setup steps. 2) Run our tool. 3) Bob 2.0 inspects the repo, infers install/run steps. 4) It generates and executes the setup. 5) App boots live on screen. 6) It emits a clean README/setup script as an artifact.
- **Build in 8h vs 24h:** 8h = single sample repo + CLI. 24h = support 2–3 repo types (Node, Python) + generated onboarding doc UI.
- **Unique twist:** Produces a durable artifact (README/setup script) as a side effect — value persists after the demo ends.
- **Fatal risks:** Environment/sandboxing (installing arbitrary deps live during judging) is risky/slow; needs a pre-warmed environment to avoid a live demo failing on network/install flake.
- **Scores:** wow 7, feasibility 6, rubric-fit 7, uniqueness 6

## 3. RegressionWatch — an AI dev partner that guards one promise forever
**One-liner:** Pick one critical invariant in your app (e.g., "checkout never throws 500"); Bob 2.0 continuously mutates the code in a sandbox, tries to break that promise, and immediately proposes a fix when it finds a real gap.

- **User + job-to-be-done:** A developer who wants continuous confidence in a specific critical path, not generic test coverage.
- **Why it scores on THIS rubric:** Very "narrow and dazzling" — one sharp promise instead of a platform; strong innovation angle (adversarial self-testing loop driven by Bob 2.0).
- **Golden-path demo:** 1) Define the one promise in a config file. 2) Bob 2.0 generates adversarial inputs/mutations. 3) It finds a real break live. 4) It proposes and applies the minimal fix. 5) Re-run confirms the promise holds. 6) Show a running log of "attempts vs breaks found."
- **Build in 8h vs 24h:** 8h = one seeded promise + one sample app with one findable bug. 24h = generalize to arbitrary promises via a small DSL + nicer live dashboard.
- **Unique twist:** Adversarial framing — Bob 2.0 plays both attacker and fixer, which is a distinctive story judges haven't seen from a plain "AI writes code" pitch.
- **Fatal risks:** Hardest to build reliably in 8h; adversarial mutation + fix loop could be flaky live. Needs the fallback break to be scripted/deterministic for the demo.
- **Scores:** wow 9, feasibility 5, rubric-fit 8, uniqueness 9

## 4. HandoffPack — Bob 2.0 writes the docs/tests you'll actually need at 3am
**One-liner:** After a coding session, Bob 2.0 automatically generates the tests, changelog, and "what to check before you ship" checklist a tired developer forgot to write.

- **User + job-to-be-done:** A hackathon team at hour 40 that has working code but no tests/docs and no time.
- **Why it scores on THIS rubric:** Extremely relatable pain (esp. for a hackathon judged on execution + presentation), fast to build, safe/low-risk demo.
- **Golden-path demo:** 1) Show an undocumented, untested feature branch. 2) Run tool. 3) Bob 2.0 reads the diff and generates missing tests. 4) Tests run and pass live. 5) Bob 2.0 outputs a changelog + pre-ship checklist. 6) Show the artifact ready to paste into a PR description.
- **Build in 8h vs 24h:** 8h = full working version on one sample diff. 24h = polish UI, support multiple languages.
- **Unique twist:** Framed as "insurance for hackathon submissions" — meta and relatable to judges who are themselves reviewing rushed code.
- **Fatal risks:** Lower "wow" ceiling — feels like a utility rather than a showpiece.
- **Scores:** wow 5, feasibility 9, rubric-fit 6, uniqueness 5

## 5. LiveCoPilot Arena — watch two coding strategies race, judged by outcome
**One-liner:** A judge-facing dashboard where Bob 2.0 attempts the same coding task two different ways (e.g., quick patch vs. root-cause fix) side by side, live, so judges see the "how" not just the "what."
- **User + job-to-be-done:** Hackathon judges/evaluators who want to see reasoning quality, not just final output.
- **Why it scores on THIS rubric:** Strong for "presentation" — built specifically to be judge-legible in 90 seconds, visually distinctive (split-screen race).
- **Golden-path demo:** 1) Load one bug. 2) Kick off two Bob 2.0 runs side by side. 3) Both attempt fixes live. 4) Dashboard scores each on speed/correctness/code quality. 5) Winner highlighted. 6) One-line takeaway on what made the difference.
- **Build in 8h vs 24h:** 8h = single hardcoded bug + simple side-by-side UI. 24h = multiple bugs, richer scoring rubric.
- **Unique twist:** Turns the pitch itself into the demo mechanic — judges are watching a live "judging" happen, which is meta and memorable.
- **Fatal risks:** Needs two concurrent Bob 2.0 sessions, doubling API/infra risk; less "useful product," more "showcase" — could read as gimmicky if judging values real-world usefulness heavily.
- **Scores:** wow 8, feasibility 6, rubric-fit 6, uniqueness 8

---

## Recommendation
**Primary: #1 GreenGate.** Best balance of wow (visible red→green transformation), feasibility in 8–24h, and direct rubric fit (Bob 2.0 as core decision-maker, not a chat sidebar), with a believable, low-risk demo built on seeded/deterministic failures rather than live adversarial mutation.

**Conservative fallback: #4 HandoffPack.** If Bob 2.0's real capabilities turn out to be narrower than expected at Kick-Off (e.g., read-only suggestions rather than autonomous multi-file edits), this degrades gracefully — Bob 2.0 only needs to read a diff and generate text artifacts (tests/docs), which almost any AI coding assistant tier can do.

**Action for RESEARCH phase:** research-scout must confirm, at event kickoff, whether Bob 2.0 supports autonomous multi-file edits/pushes (needed for GreenGate) vs. read-only suggestions (fallback territory) before SPEC locks in.
