# Implementation Plan: Icon-only Sandpack controls

## Overview

Replace every visible header-button label with a self-contained inline SVG,
remove the unsuccessful modifier-arrow shortcuts, and make the compact square
button styling survive Slidev's generic button reset. Preserve accessible
names, mode behavior, public class/data hooks, and the visible step status.

## Architecture decisions

- Keep icon components private to the renderer and use `currentColor`; do not
  add an icon dependency or public icon API.
- Treat icons as decorative. Native buttons retain action-oriented
  `aria-label` and matching `title` values.
- Show action icons on the mode button: lock while editing and pencil while
  read-only.
- Remove shortcut handling and `aria-keyshortcuts` without replacing them.
  Keep the existing Sandpack-root propagation boundary that isolates editor
  input from Slidev.
- Raise only the bundled button selectors to element-level specificity. The
  public consumer class remains more specific and can override defaults.

## Dependency graph

```text
Renderer and stylesheet contract tests
        |
        v
Icon-only renderer and shortcut removal
        |
        v
Square button and icon styling
        |
        v
Runtime documentation
        |
        v
Full package checks and real-browser verification
```

## Task 1: Encode the icon-control contract

**Description:** Update focused renderer and stylesheet tests first so the new
visual, accessibility, keyboard-removal, and override requirements fail against
the current implementation.

**Acceptance criteria:**

- [ ] Tests require icon-only button contents with preserved accessible names.
- [ ] Tests require action-based mode icon changes and retained state hooks.
- [ ] Tests prove modifier-arrow events no longer navigate or advertise shortcuts.

**Verification:**

- [ ] Focused Vitest run fails for the expected old text/shortcut behavior.
- [ ] Test diff contains no production implementation.

**Dependencies:** None

**Files likely touched:**

- `test/renderer.test.tsx`
- `test/styles.test.ts`

**Estimated scope:** Small

## Task 2: Render icons and remove shortcuts

**Description:** Add four small private inline SVG components, render them in
the existing buttons, preserve action/state semantics, and delete the scoped
modifier-arrow implementation.

**Acceptance criteria:**

- [ ] Previous and next render left/right arrows with no visible text.
- [ ] Mode renders lock while editing and pencil while read-only.
- [ ] SVGs are decorative while buttons retain labels, tooltips, and behavior.
- [ ] Shortcut handler and `aria-keyshortcuts` are absent.

**Verification:**

- [ ] `pnpm exec vitest run test/renderer.test.tsx` passes on Node 24.
- [ ] `pnpm run typecheck` passes on Node 24.

**Dependencies:** Task 1

**Files likely touched:**

- `src/renderer.tsx`
- `test/renderer.test.tsx`

**Estimated scope:** Medium

## Checkpoint: Behavior and accessibility

- [ ] Tasks 1 and 2 are committed as tested increments.
- [ ] Buttons work through click, Enter, and Space.
- [ ] Public classes, data states, disabled states, and edit-mode behavior remain intact.

## Task 3: Make icon-button styles reliable

**Description:** Convert the addon buttons to compact squares, size and center
their SVGs, and use low but sufficient selector specificity to beat Slidev's
generic button reset without weakening consumer overrides.

**Acceptance criteria:**

- [ ] Buttons have explicit square dimensions, centered icons, and compact padding.
- [ ] SVGs inherit color and cannot intercept pointer events.
- [ ] Bundled selectors do not target the public consumer classes.
- [ ] A normal consumer class selector can still override every default.

**Verification:**

- [ ] `pnpm exec vitest run test/styles.test.ts` passes.
- [ ] `git diff --check` passes.

**Dependencies:** Task 2

**Files likely touched:**

- `styles/sandpack.css`
- `test/styles.test.ts`

**Estimated scope:** Small

## Task 4: Update the public control documentation

**Description:** Remove the shortcut claim and describe the icon-only controls,
action-based mode glyphs, preserved labels, and styling hooks without rewriting
historical release notes.

**Acceptance criteria:**

- [ ] README no longer advertises a code-step shortcut.
- [ ] README explains the arrow and mode icons and their accessible names.
- [ ] No current-behavior documentation contradicts the renderer.

**Verification:**

- [ ] `rg` finds no current shortcut claim outside historical release material.
- [ ] `pnpm run format:check` passes on Node 24.

**Dependencies:** Task 3

**Files likely touched:**

- `README.md`

**Estimated scope:** Small

## Checkpoint: Release candidate

- [ ] Icon markup, behavior, styles, and docs form one consistent contract.
- [ ] Focused renderer and stylesheet suites pass.
- [ ] No unrelated files are changed.

## Task 5: Verify the package and live Slidev UI

**Description:** Run the complete Node 24 quality gates, packed-consumer checks,
and production audit, then inspect a real Slidev Sandpack demo at desktop size
and capture screenshot evidence.

**Acceptance criteria:**

- [ ] The full repository check, React 18/19 packed consumers, and production audit pass.
- [ ] Browser inspection shows icon-only buttons, working mode/step actions, and dark rendering.
- [ ] Computed button dimensions/padding are non-zero and Slidev does not override them.
- [ ] Browser console has no new addon errors.

**Verification:**

- [ ] `pnpm run check` passes on Node 24.
- [ ] `pnpm run test:pack` passes on Node 24.
- [ ] `REACT_VERSION=18.3.1 pnpm run test:pack` passes on Node 24.
- [ ] `pnpm run audit:prod` passes on Node 24.
- [ ] A real-browser screenshot and DOM/computed-style evidence are retained.

**Dependencies:** Task 4 and release-candidate checkpoint

**Files likely touched:** None beyond verification artifacts outside the repository

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] All approved design requirements are satisfied.
- [ ] All automated and browser checks pass.
- [ ] Branch is clean, reviewable, and ready for a PR or release decision.

## Risks and mitigations

| Risk                                           | Impact | Mitigation                                                                                        |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Icon-only controls lose accessible meaning     | High   | Keep native action labels/tooltips and test them by role.                                         |
| Mode icon communicates state instead of action | Medium | Test lock in editing and pencil in read-only explicitly.                                          |
| Slidev still removes button padding            | High   | Raise default selectors only to element specificity and inspect computed styles in the real deck. |
| Consumer overrides become harder               | High   | Keep public classes out of bundled selectors and assert class specificity remains higher.         |
| Shortcut behavior remains in docs or DOM       | Medium | Search docs and assert `aria-keyshortcuts`/navigation are absent.                                 |

## Open questions

None. The approved design resolves icon semantics, keyboard behavior, visible
text, accessibility, styling, and scope.
