# Reusable Surface Architecture

Code Trainer should be composed from a small set of product surfaces.

## Core surfaces

1. **App Shell** — identity, global navigation, account entry.
2. **Content Browser** — lists tracks, lessons, projects, problems, and quiz sets.
3. **Challenge Workspace** — main solving environment.
4. **Editor Surface** — language-aware code editor.
5. **HUD** — current goal, state, inline teaching, and assistance.
6. **Runtime Panel** — output, tests, and debugging views.
7. **Progress / Results Surface** — completion, mastery, XP, recommendations.

## Composition by pillar

```text
Learn       = Browser + Workspace + Teaching HUD
Projects    = Browser + Workspace + Project HUD
Interview   = Browser + Workspace + Test/Complexity HUD
Knowledge   = Browser + Question Surface + Results
```

## Design constraint
No pillar should introduce a second editor, runner, navigation model, or progress system unless the existing primitive cannot express the need.
