# Code Editor UX

## Required behavior

- Correct JavaScript syntax highlighting.
- Line numbers.
- Parse and syntax diagnostics.
- Semantic diagnostics when available.
- Active-line awareness.
- Inline assistant anchors.
- Run/check integration.
- Undo/redo and reset.
- Keyboard-first operation.

## Token categories

At minimum:

- keywords
- identifiers
- strings
- numbers
- operators
- punctuation
- comments
- built-ins
- functions
- invalid syntax

Error treatment must not destroy syntax coloration.

## Learning observation layer

The editor emits semantic events to the learning engine:

```text
code changed
line became parseable
syntax became invalid
known construct created
challenge check partially satisfied
misconception detected
repeated error detected
```

The editor itself does not decide how to teach.

## Language expansion

Keep editor integration language-neutral. JavaScript is the first language adapter, not a hardcoded assumption in the UI.
