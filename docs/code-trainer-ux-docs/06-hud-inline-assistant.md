# HUD & Inline Assistant

The HUD is the primary teaching surface and should remain concise.

Its normal teaching loop is deterministic and uses parser, runtime, evaluator, and authored-response state. Optional AI conversation is secondary and never decides correctness.

## Default beginner HUD

```text
GOAL
Create a variable named score.

PROGRESS
✓ Variable created
○ Give it the value 10

ASSISTANT
You've created the name correctly.
Now assign a value.
```

## Interaction hierarchy

1. Stay silent when no help is needed.
2. Acknowledge useful progress.
3. Explain the observed issue.
4. Give a conceptual hint.
5. Give a structural hint.
6. Reveal the solution only when requested or teaching policy allows it.

## Trigger events

Respond on meaningful moments, not every keystroke:

- user pauses
- line becomes parseable
- misconception appears
- same error repeats
- partial goal completes
- challenge completes

## Inline behavior

Prefer targeted annotation near the relevant code when possible. Use the HUD for summary and next action.

## Mode behavior

- **Learn:** proactive and explanatory.
- **Projects:** task-focused and less granular.
- **Interview:** restrained; avoid revealing approach prematurely.
