# UX Vertical Slice

The first production-quality UX slice should prove the core product interaction rather than breadth.

## Flow

```text
Home
→ Learn
→ JavaScript / Getting Started
→ Challenge Workspace
→ Type one-line program
→ Live HUD reacts to progress/error
→ Run code
→ Check completed work
→ Complete challenge
→ Receive XP
→ Complete a transfer challenge
→ Answer a short concept check
```

## Required surfaces

- App Shell
- Learn Content Browser
- Challenge Workspace
- JavaScript editor with correct syntax coloration
- HUD
- Output runtime view
- Progress/reward feedback

## Acceptance criteria

- Beginner sees one clear next action at every step.
- Assistant does not react to every keystroke.
- Deterministic teaching loop works without a live AI dependency.
- Common syntax mistakes receive human-readable guidance.
- Completed subgoals collapse into concise state.
- No unused panels are visible.
- Workspace can later be configured for Interview without replacing the editor or runner.
- A visitor reaches editable code in under 30 seconds without required signup.
- The guided sequence, transfer challenge, and concept check expose whether learning transfers beyond the coached example.
