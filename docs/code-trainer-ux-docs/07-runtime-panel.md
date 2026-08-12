# Runtime Panel

The Runtime Panel is one reusable surface with progressively revealed views.

Potential views:

```text
Output
Tests
Variables
Call Stack
```

## Beginner defaults

Early lessons should usually show only `Output`.

Later lessons may expose `Variables` when state inspection becomes educational.

## Interview defaults

Prioritize:

```text
Tests | Console
```

Complexity guidance belongs in the HUD, not as another permanent tab.

## Advanced debugging

Only reveal stack/call-state views when debugging or execution flow is being taught.

## Rules

- Never expose an empty panel just because the platform supports it.
- Auto-focus the view that explains the latest action.
- Preserve user-selected view when they intentionally switch.
