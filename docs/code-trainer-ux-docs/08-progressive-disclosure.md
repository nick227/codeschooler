# Progressive Disclosure & Cognitive Load

This is a product-level requirement, not a visual preference.

## Default rule

> Show the smallest interface that lets the user understand and perform the next useful action.

## Reveal policy

- No tests until tests matter.
- No call stack until execution flow matters.
- No full hint list before the user is stuck.
- No solution CTA in the primary action area.
- No complete lesson tree while solving.
- No mastery analytics during a one-line beginner task.

## Contextual actions

Prefer:

```text
Problem detected → See hint
Challenge complete → Continue
Output differs → Inspect output
Repeated error → Explain this
```

instead of permanent controls.

## Completion behavior

When a subgoal completes, compress it:

```text
✓ Variable created
```

Do not keep the full explanation open.

## Density tiers

- Beginner: minimal.
- Intermediate: moderate runtime/test visibility.
- Interview/advanced: denser, but still focused.
