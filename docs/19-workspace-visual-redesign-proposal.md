# 19 - Challenge Workspace Visual Redesign Proposal

Status: IMPLEMENTED. Section 6's file-level change map is complete; verified via
`pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm test` and a live browser pass
(diagnostic banner, hint ladder escalation, dock tab auto-switching, zero-layout-shift
across phase transitions, and the 900px/700px breakpoints). It did not change any
contract in `workspace.types.ts`, `useWorkspaceController.ts`, or `teachingPolicy.ts` —
this was a presentation and interaction layer pass only.

## 1. What's actually there today

Contrary to the "step-wizard" framing this effort started from, `ChallengeWorkspace.tsx`
is already a two-pane grid (`teaching-hud` | `code-column`), not a paginated wizard. The
real gaps against docs/09 (Code Workspace UX) and docs/10 (Inline Assistant Contract) are
narrower and more specific:

- **Runtime dock is a cramped fixed 145px strip** (`index.css:204`) that scrolls
  internally instead of expanding — output and errors compete for the same tiny box, and
  a long console log requires scrolling inside a scrollbox inside a page.
- **The hint ladder is flat, not a ladder.** `TeachingHud` renders one "Show hint" /
  "Show another hint" button (`TeachingHud.tsx:120`) that walks a linear counter. Doc 10
  specifies five distinct levels (Observe → Describe → Explain concept → Give structure →
  Reveal) with different visual weight and tone; today they're indistinguishable — same
  box, same border, same copy treatment, appended one after another with no sense of
  escalation or of "you are 2 levels deep."
- **No annotation anchored to code.** Doc 09 prefers "annotations anchored to relevant
  code over generic chat messages." Right now all feedback — hints, diagnostics, the
  teaching response — lands in the HUD sidebar, never near the cursor or the offending
  line, even though CodeMirror's diagnostic gutter (`EditorSurface.tsx:80-86`) already
  proves the wiring exists for inline squiggles.
- **Static concept block always renders, even mid-flow.** The "What You're Learning"
  card (`TeachingHud.tsx:103-113`) is keyword-matched boilerplate that takes a fixed
  chunk of vertical space above the hint ladder regardless of phase, pushing hints below
  the fold on smaller viewports.
- **State transitions are abrupt.** Phase changes (`editing → running → checking →
  complete`) swap DOM wholesale (`ChallengeWorkspace.tsx:32`) with no shared layout
  animation, and the `Next` button's unlock is the only animated affordance in the whole
  screen (`index.css:207-208`).
- **Runtime/trace/action-dock are three separately-styled bands stacked in a fixed-row
  grid** (`.code-column` in `index.css:199`) rather than one coherent "console" system —
  each has its own background, its own border rhythm, its own font-size logic.

None of this needs new libraries. CodeMirror 6, React, and the existing token set
(`--blueprint`, `--copper`, `--spruce`, `--slate`, Recursive/IBM Plex Mono/Atkinson
Hyperlegible) are sufficient. This is a layout, motion, and information-architecture
pass, not a rewrite.

## 2. Design goals (what "10/10" means for the critic loop)

1. **Zero layout shift** across phase transitions (`editing → running → checking →
   feedback → complete`). Every panel reserves its space; content crossfades/height-
   animates inside a fixed track, it never causes reflow of sibling panels.
2. **The hint ladder is a discovery path, not a button.** Each level has a distinct
   visual identity (icon/weight/tone escalates from a quiet nudge to a bold reveal
   warning), the learner can see how many levels exist and where they are in the ladder,
   and levels already viewed stay visible (collapsed) rather than being replaced.
3. **Contextual, not just sidebar, feedback.** Diagnostics stay anchored to the offending
   line (already true via `setDiagnostics`); add a lightweight inline marker (gutter dot
   or line highlight) that cross-references the HUD's active teaching message, so the two
   surfaces read as one system.
4. **One console system**, not three bands. Program trace, runtime output, and the
   check-list state converge into a single tabbed/segmented diagnostics dock so a learner
   builds one mental model of "where does my program's status live."
5. **Density without clutter.** Reduce the fixed vertical tax of the always-on concept
   card; make it collapsible/contextual so the editor gets more room, matching the
   "expansive CodeMirror canvas" goal.
6. **Rewarding completion, contextual failure.** Keep the existing warm completion card
   pattern; sharpen error/failure language per doc 09 ("Not there yet", never punitive)
   and give the check-list transitions (○ → ✓) a small satisfying motion instead of an
   instant swap.
7. **Keyboard-first and accessible.** Every action already reachable by mouse (Run,
   Check, next hint, reveal) keeps a visible shortcut hint, focus rings stay high-
   contrast (`outline: 3px solid rgb(49 87 183 / 32%)` — verify it survives the redesign),
   and no interactive element drops below WCAG AA contrast on the existing palette.
8. **No new dependency, no touched contract.** `WorkspaceViewState`, `PublicChallenge`,
   `useWorkspaceController`, and `teachingPolicy` are load-bearing for
   `@code-trainer/learning-engine` / `@code-trainer/evaluators` integration and stay
   untouched. This is `ChallengeWorkspace.tsx` + its child components + `index.css` only.

## 3. Target layout taxonomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ workspace-layout (CSS grid, 2 fixed-ratio columns, unchanged shape)  │
├───────────────────────────┬─────────────────────────────────────────┤
│ context rail (aside)      │ code column                            │
│ • back nav + title/meta   │ • file tab bar (unchanged)              │
│ • objective                │ • CodeMirror canvas (grows to fill)     │
│ • progress checklist       │ • unified diagnostics dock (tabbed):    │
│ • collapsible concept card │     [Console] [Checks] [Trace]          │
│ • hint ladder (stepped,    │ • action dock (Run / Check / Next)      │
│   persistent history)      │                                         │
└───────────────────────────┴─────────────────────────────────────────┘
```

The two-column grid shape is *kept* (it already matches doc 09's `code editor | HUD`
spec and the mobile stacking rules in `index.css:306` already work) — the redesign is
inside each column, not the overall skeleton. This avoids destabilizing the responsive
rules that already handle mobile well.

### 3.1 Context rail changes (`TeachingHud.tsx`)

- Split into two components: `ChallengeContext` (nav/title/meta/objective/checklist —
  unchanged behavior, tightened spacing) and a new `HintLadder` component.
- Concept card becomes a `<details>`-backed disclosure (`ConceptDisclosure`), collapsed
  by default after the first view of a given topic, so it costs one line of vertical
  space instead of a fixed card once the learner has seen it.
- `HintLadder` renders the *authored* levels the learner has already requested as a
  stacked, collapsed-by-default history (most recent expanded), each level tagged with
  its ladder position (1 Describe, 2 Explain, 3 Structure, 4 Reveal) and a distinct
  left-border tone that escalates from `--slate` → `--blueprint` → `--copper`. The
  "Show next hint" affordance shows the *next* level's name before it's revealed (e.g.
  "Get a structural nudge") so the ladder reads as a path, not a mystery button. Reveal
  (level 4) keeps its existing confirm-dialog guard.

### 3.2 Code column changes

- `ProgramTrace` + `RuntimePanel` + the check-list summary collapse into one
  `DiagnosticsDock` with a small segmented control (Console / Checks / Trace), default
  tab driven by workspace phase (Console after Run, Checks after Check, Trace once a
  tracked value is ready) so the learner is never staring at an empty tab. This
  directly fixes the "three inconsistently-styled bands" problem and gives the console
  real vertical room instead of a fixed 145px box — the dock gets a `min-height` and can
  grow up to a capped `max-height` with internal scroll only past that cap.
- `EditorSurface` itself is visually untouched (its CodeMirror theme is already
  clean); only the frame around it changes to give it more of the available height.
- `WorkspaceActionDock` gets the same treatment applied to `next-btn` today (a subtle
  scale-in on state change) applied consistently: primary/secondary swap between Run and
  Check crossfades instead of snapping, and the save-status pill gets a brief pulse on
  change instead of silently swapping text.

### 3.3 Motion tokens (add to `index.css :root`)

```css
--ease-standard: cubic-bezier(.2,0,0,1);
--dur-fast: 120ms;
--dur-standard: 220ms;
```

All existing ad-hoc transitions (`next-unlock`, hover transforms) stay; new ones reuse
these tokens instead of inventing new easing curves. `prefers-reduced-motion` handling
already exists globally (`index.css:311`) and covers new animations automatically since
they're standard `transition`/`animation` properties.

## 4. Non-goals

- No changes to `@code-trainer/learning-engine`, `@code-trainer/language-javascript`,
  `@code-trainer/evaluators`, or any Prisma/Fastify/SDK contract.
- No new runtime dependencies (no animation library — CSS transitions/animations only,
  consistent with the existing codebase's approach).
- No change to the deterministic hint content or teaching policy logic — only how
  already-existing `TeachingResponse` / `hintLevel` data is *presented*.
- Mobile stacking behavior (`index.css:301-309`) is preserved in shape; only the
  same internal component swaps (HintLadder, DiagnosticsDock) apply there too.

## 5. Execution loop (autonomous)

This proposal is the shared spec for a recurring `/loop` cycle with four roles per
iteration:

1. **Engineer pass** — implement the next slice of section 3 against this proposal in
   `apps/web`, fully (no placeholders/TODOs).
2. **Validation pass** — `pnpm lint`, `pnpm typecheck`, `pnpm build` must pass; confirm
   `@code-trainer/learning-engine` and `@code-trainer/language-javascript` contracts are
   untouched (no edits outside `apps/web` unless a genuine bug is found elsewhere).
3. **Critic pass** — score against section 2's eight goals plus: micro-interactions,
   responsive scaling (test the `900px` and `700px` breakpoints), layout stability
   (no CLS across phase changes), keyboard accessibility, information density, and
   "does this still feel like a linear wizard anywhere." Anything short of a clean pass
   sends explicit, file-and-line feedback back to the engineer pass.
4. Loop continues until the critic pass has nothing left to flag, then stops.

## 6. File-level change map

- `apps/web/src/features/workspace/TeachingHud.tsx` — split into `ChallengeContext.tsx`
  + `HintLadder.tsx` (+ `ConceptDisclosure.tsx`); `TeachingHud.tsx` becomes a thin
  composer or is removed in favor of direct composition in `ChallengeWorkspace.tsx`.
- `apps/web/src/features/workspace/RuntimePanel.tsx`, `ProgramTrace.tsx` — merged into
  new `apps/web/src/features/workspace/DiagnosticsDock.tsx` (tabbed).
- `apps/web/src/features/workspace/WorkspaceActionDock.tsx` — visual/motion polish only,
  same props contract.
- `apps/web/src/features/workspace/ChallengeWorkspace.tsx` — updated composition, same
  props/controller contract.
- `apps/web/src/index.css` — new/replaced rules for `.teaching-hud` descendants,
  `.code-column`, new `.diagnostics-dock`, `.hint-ladder*` classes, motion tokens.
- No changes to `workspace.types.ts`, `useWorkspaceController.ts`, `teachingPolicy.ts`,
  `EditorSurface.tsx` internals (frame sizing via CSS only), `CompletionCard.tsx`,
  `MobileCodingRow.tsx`, or anything outside `apps/web`.
