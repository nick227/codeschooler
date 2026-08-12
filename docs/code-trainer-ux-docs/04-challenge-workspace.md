# Challenge Workspace

The Challenge Workspace is the primary reusable product surface for Learn, Projects, and Interview.

## Regions

```text
┌─────────────────────┬────────────────────────────┐
│ Goal / Problem      │ Editor                     │
│                     │                            │
│ Description         │                            │
│ Examples            │                            │
│ Constraints         │                            │
│                     │                            │
├─────────────────────┼────────────────────────────┤
│ HUD                 │ Runtime                    │
└─────────────────────┴────────────────────────────┘
```

The physical layout may adapt, but the conceptual regions should remain stable.

## Cognitive-load rules

- Only show content needed for the current mode and challenge.
- Collapse completed guidance into concise checkmarks.
- Preserve distinct `Run` and `Check` actions. `Run` is ungraded experimentation; `Check` declares readiness for evaluation. Visual emphasis may shift with the current state so only one action dominates at a time.
- Hide secondary actions under a quiet menu or contextual reveal.
- Do not permanently display hints, solutions, docs, tests, output, variables, and stack simultaneously.

## State changes

The workspace should visibly transition between:

```text
Reading → Editing → Running / Checking → Feedback → Complete
```

without navigating away.
