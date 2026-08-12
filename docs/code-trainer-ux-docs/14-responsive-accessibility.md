# Responsive & Accessibility UX

## Responsive workspace

Desktop can use split panes. Smaller screens should stack surfaces by priority rather than shrink all panes simultaneously.

Suggested mobile order:

```text
Goal / Problem
Editor
HUD
Runtime
```

Runtime may appear as a bottom sheet or collapsible panel.

Learn and Knowledge must be genuinely usable on phones. Use prioritized sheets and a coding accessory row for common symbols rather than shrinking a desktop IDE. Complex multi-file project work may be optimized for larger screens while remaining inspectable on mobile.

## Keyboard

Core coding flow should be keyboard-operable:

- focus editor
- run/check
- open/close HUD help
- switch runtime view
- continue challenge

## Accessibility

- Never communicate correctness through color alone.
- Syntax themes need sufficient contrast.
- Inline diagnostics need text equivalents.
- Motion must respect reduced-motion preferences.
- Reward animations must never block controls.
- Screen-reader labels should distinguish code diagnostics from assistant guidance.
