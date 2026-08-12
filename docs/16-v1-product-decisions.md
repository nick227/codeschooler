# 16 - V1 Product Decisions

## Status
This document records the decisions that close initial product discovery. It is the authoritative V1 boundary when an older document is ambiguous. Detailed subsystem documents still define implementation behavior.

## Product hypothesis
Code Trainer helps a person with little or no coding experience write, run, and understand a first JavaScript program in under ten minutes. Its distinguishing interaction combines three things:

1. the learner writes real code rather than assembling placeholder blocks;
2. deterministic systems recognize meaningful partial states as the learner types; and
3. a concise HUD explains what the program is doing and what remains.

The hypothesis to validate is that line-by-line deterministic guidance improves understanding without making the coding interface intrusive or overwhelming.

## Audience and release shape
- V1 is beginner-first. Interview preparation remains a core eventual audience.
- JavaScript is the only initial language, behind language-neutral interfaces.
- Learn, Projects, Interview, and Knowledge must all be represented at public launch. Learn is substantially deeper; the other pillars begin as thin, production-quality slices that prove architectural reuse.
- Onboarding is lightweight self-selection: completely new, some coding experience, projects, interview preparation, or knowledge testing.
- Onboarding changes recommendations only. Content is not hard-locked.
- A visitor reaches editable code in under 30 seconds without creating an account.
- The product is initially free and primarily serves independent learners.

## Teaching interaction
- Beginners type real syntax from the start. Scaffolding is an occasional authored teaching tool, not the default input model.
- Partial checks update automatically on meaningful parseable states and short idle intervals.
- Partial progress changes the HUD but does not repeatedly award XP.
- `Run` and `Check` are distinct. `Run` is ungraded experimentation; `Check` is the learner's declaration that the solution is ready for evaluation.
- When runtime behavior is part of the objective, at least one relevant run is required before completion.
- Guidance becomes less prescriptive as challenge context and difficulty increase.
- Revealing a solution may end eligibility for a specific achievement, but it never blocks ordinary progression.

## Assistant boundary
The teaching path is:

```text
source and runtime state
-> deterministic parser, runtime, and evaluators
-> learning-state interpretation
-> reviewed pedagogical response
-> optional AI conversation
```

- The evaluator is authoritative. An LLM never determines correctness.
- Syntax states, partial completion, known misconceptions, hints, evaluator results, and progression work without AI.
- AI is secondary and may later support rephrasing, follow-up questions, personalized examples, conceptual discussion, and explicit code-generation requests governed by teaching policy.
- The first validation slice has no live AI dependency.

## Workspace and execution
- The platform is architected as an IDE from the beginning, including files, tabs, adapters, diagnostics, previews, and project state.
- Progressive disclosure initially presents a beginner with one JavaScript file and only the controls needed for the task.
- Browser projects may progressively expose HTML, CSS, JavaScript, JSON, modules, assets, file creation, and a real preview.
- Mobile is a primary surface for Learn and Knowledge. Complex multi-file work may remain better suited to larger screens. Mobile uses prioritized surfaces, sheets, and a coding symbol row rather than a compressed desktop layout.
- Initial JavaScript execution uses a disposable Web Worker with a hard timeout, worker termination and recreation, an output cap, no application credentials, and runtime reset.
- DOM execution later uses an isolated iframe. Network, storage, timers, DOM APIs, and similar capabilities are enabled per content item.

## Mastery and assessment
- Mastery must be defensible enough to guide the product and honestly communicate capability; V1 is not a professional certification system.
- Practice and assessment evidence are distinct internally.
- Higher mastery requires multiple independent pieces of evidence across contexts. One completion never establishes mastery.
- Old evidence becomes `Mastered - needs refresh` rather than silently lowering displayed capability.
- Learn is untimed. Competitive assessments, anti-cheating, normalized scoring, and leaderboards are future systems.

## Identity, progress, and rewards
- XP is awarded for meaningful challenge or lesson completion, not each partial evaluator transition.
- Levels represent accumulated progression and may later unlock cosmetics or presentation features.
- Awards represent accomplishments. Neither system locks important learning content.
- Progress prioritizes `Recommended next`, followed by Skills, Tracks, Awards, and Activity.
- Anonymous drafts and progress save locally and merge on account creation. Merging preserves the strongest valid evidence and achievement history while keeping the newest active draft.
- Code autosaves after a short idle interval and before Run, Check, navigation, and unload.

## Durable curriculum contracts
- Canonical skill IDs are immutable. Skills support display names, aliases, prerequisites, deprecation metadata, and replacement IDs.
- Content IDs are immutable and content carries revisions.
- Editorial revisions preserve completion. A revision may require new evidence when its objective, measured skills, evaluator behavior, difficulty, or required competency changes materially.
- Content begins as repository-managed declarative data and may later synchronize to MySQL through Prisma.
- AI-assisted content requires schema and skill validation, a passing reference solution, rejection fixtures, alternate-solution coverage, hint review, difficulty/guidance review, and human approval before publishing.

## Validation
The first validation slice measures comprehension, not only funnel completion:

1. complete a guided sequence;
2. complete a different transfer challenge using the same concepts;
3. answer a short concept check; and
4. measure independence, errors, hints, completion, time, and conceptual accuracy.

Redesign is warranted when learners cannot find the next action, misunderstand their program, confuse Run with Check, find the HUD intrusive, struggle primarily with editor mechanics, or complete the guided work without transferring the concept.

This Learn validation slice is narrower than public launch. It proves the signature interaction before production effort expands across all four launch pillars.
