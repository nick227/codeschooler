# 09 - Code Workspace UX

## Stable layout
The workspace should remain recognizable across Learn, Projects, and Interview.

```text
Top bar: navigation context | lesson/problem title | progress | XP
Main: code editor | HUD
Bottom: Run | Check | tests/status | output/console
```

## HUD responsibilities
The HUD answers four questions:
1. What is the current goal?
2. What is the program currently doing?
3. What is correct, incorrect, or incomplete?
4. What should I try next if stuck?

## Editor requirements
- correct JavaScript tokenization and syntax coloring
- line numbers
- diagnostics without obscuring syntax colors
- keyboard-first editing
- controlled formatting support
- selection/cursor preservation during assistant feedback
- future language-neutral adapter boundary

## Inline guidance
Prefer annotations anchored to relevant code over generic chat messages.

Checks may evaluate silently after meaningful parseable states and short idle periods to update partial HUD progress. `Run` remains an ungraded experiment; `Check` is the learner's explicit declaration that the solution is ready. If runtime behavior is part of the objective, completion requires a relevant run.

Example feedback progression:
- `const` -> recognize declaration start
- `const score` -> recognize identifier
- `const score =` -> explain missing value
- `const score = 10` -> goal complete

## Runtime panel
Expose only useful state for the current lesson:
- console output
- test results
- selected variables / evaluated expressions
- DOM preview for browser projects

## Error language
Prefer:
- `Goal complete`
- `Not there yet`
- `This line cannot run yet`

Avoid failure-heavy gamification.

## Recovery
Always provide safe Undo and Reset Step actions. Experimentation should never feel destructive.
