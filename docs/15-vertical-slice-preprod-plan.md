# 15 - Vertical Slice Preproduction Plan

## Objective
Prove the complete Code Trainer loop at production quality before scaling curriculum.

This is the first Learn validation slice, not the entire public-launch scope. Public launch represents all four pillars with Learn substantially deeper and Projects, Interview, and Knowledge implemented as thinner production-quality slices.

## Slice
A new user reaches editable code without signup in under 30 seconds, enters JavaScript Learn, completes a tiny variables lesson, receives relaxed real-time deterministic guidance, runs and checks code, earns XP, and sees progress update. The experience aims to let the learner write, run, and understand a first JavaScript program in under ten minutes.

## Required product surfaces
1. Home
2. Learn catalog
3. Code Workspace
4. Progress summary

## Required content
One section with 5-8 tightly sequenced beginner challenges:
- print text
- edit text
- print a number
- create a variable
- print a variable
- create a second variable
- simple arithmetic

## Required platform capabilities
- production-quality JavaScript syntax highlighting
- parser diagnostics
- safe JS execution
- evaluator registry
- partial-progress checks
- HUD goal/check rendering
- inline assistant hint ladder
- distinct Run and Check actions
- Undo / Reset Step
- challenge persistence
- XP award
- skill mastery event

## Out of slice
- full Projects catalog
- full Interview catalog
- Knowledge quiz engine beyond schema proof
- multiple languages
- sophisticated recommendation ML
- social features
- live AI conversation

## Acceptance criteria
- curriculum can be edited without changing workspace code
- no lesson-specific branches in UI/runtime
- user code can take multiple valid forms and still pass
- malformed code produces understandable diagnostics
- every editor state preserves correct syntax coloration where tokenization permits
- progress survives reload/login state
- telemetry can answer where learners stall, request hints, reset, and complete
- learner completes a different transfer challenge without being given the answer structure
- learner completes a short concept check after the transfer challenge
- telemetry distinguishes independence, errors, hint use, completion, time, and conceptual accuracy

## Redesign triggers
- the learner cannot identify the next action
- the learner cannot explain what the code is doing
- Run and Check are confused
- HUD intervention breaks flow
- editor mechanics become the primary obstacle
- guided completion does not transfer to a different exercise

## Next decision gate
After this slice, evaluate UX quality and authoring friction before producing large amounts of curriculum.
