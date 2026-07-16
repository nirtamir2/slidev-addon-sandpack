# Implementation Plan: Sandpack 0.4.0 controls and dark default

## Overview

Ship `slidev-addon-sandpack@0.4.0` with a dark omitted-theme default, stable
addon-owned control hooks, and scoped modifier-arrow step navigation. Verify
the packed package with React 18 and React 19, publish through the existing
trusted GitHub release workflow, then upgrade the real talks deck and capture
browser evidence.

## Architecture decisions

- Resolve an omitted theme to `"dark"` in both the preset resolver and renderer
  fallback; explicit themes remain pass-through values.
- Treat data attributes as the semantic control contract and BEM classes as
  empty consumer hooks.
- Target bundled control styles only through `:where([data-*])` selectors so
  the addon's defaults have zero specificity.
- Handle Meta/Control + Left/Right only on the control group. Keep the existing
  Sandpack-root propagation boundary for Slidev isolation.
- Release the additive public API as minor version 0.4.0 and consume the
  published artifact from `../talks`.

## Dependency graph

```text
Theme and control contract tests
        |
        v
Renderer, resolver, and stylesheet implementation
        |
        v
Public documentation and 0.4.0 metadata
        |
        v
Repository review and package verification
        |
        v
PR merge -> v0.4.0 release -> npm verification
        |
        v
Talks dependency upgrade -> browser verification -> screenshot -> merge
```

## Task 1: Prove the new theme default

**Description:** Change only the resolver and renderer expectations first,
confirm both tests fail against 0.3.0, then make the two smallest production
changes.

**Acceptance criteria:**

- [ ] An omitted theme resolves and renders as `"dark"`.
- [ ] Explicit `"auto"`, `"light"`, `"dark"`, and custom objects remain unchanged.
- [ ] Focused resolver and renderer tests pass after implementation.

**Verification:**

- [ ] RED and GREEN runs are recorded with focused Vitest commands.
- [ ] `pnpm exec vitest run test/presets.test.ts test/renderer.test.tsx` passes.

**Dependencies:** None

**Files likely touched:**

- `test/presets.test.ts`
- `test/renderer.test.tsx`
- `src/presets.ts`
- `src/renderer.tsx`

**Estimated scope:** Medium

## Task 2: Add the control customization contract

**Description:** Add failing DOM and stylesheet contract tests, then expose the
documented class hooks and semantic data attributes while moving bundled
control styles to zero-specificity data selectors.

**Acceptance criteria:**

- [ ] Every control element exposes its documented class and data hooks.
- [ ] Dynamic state and 1-based step metadata update after interaction.
- [ ] Bundled control CSS does not target the empty class hooks.

**Verification:**

- [ ] New renderer and stylesheet assertions fail before implementation.
- [ ] `pnpm exec vitest run test/renderer.test.tsx test/styles.test.ts` passes.
- [ ] `git diff --check` passes.

**Dependencies:** Task 1

**Files likely touched:**

- `test/renderer.test.tsx`
- `test/styles.test.ts`
- `src/renderer.tsx`
- `styles/sandpack.css`

**Estimated scope:** Medium

## Checkpoint: Theme and styling contract

- [ ] Tasks 1 and 2 are committed as tested increments.
- [ ] Focused tests and type checking pass.
- [ ] The public hooks exactly match the approved design.

## Task 3: Add scoped keyboard navigation

**Description:** Add failing tests for supported shortcuts, boundary behavior,
unsupported modifier combinations, and events outside the controls. Implement
the smallest control-group handler and accessible shortcut metadata.

**Acceptance criteria:**

- [ ] Meta/Control + Left/Right changes steps from a focused control.
- [ ] Shift/Alt combinations, unmodified arrows, and events outside the group do not navigate.
- [ ] Recognized shortcuts prevent their browser default and remain isolated from Slidev.

**Verification:**

- [ ] Keyboard tests fail before implementation and pass afterward.
- [ ] `pnpm exec vitest run test/renderer.test.tsx` passes.
- [ ] `pnpm run typecheck` passes.

**Dependencies:** Task 2

**Files likely touched:**

- `test/renderer.test.tsx`
- `src/renderer.tsx`

**Estimated scope:** Small

## Task 4: Document and prepare 0.4.0

**Description:** Update consumer documentation, changelog, and package metadata
to describe the dark default, explicit adaptive opt-in, styling contract, and
keyboard behavior.

**Acceptance criteria:**

- [ ] README and preset documentation match runtime behavior.
- [ ] The changelog explains user impact under 0.4.0.
- [ ] Package metadata reports 0.4.0 and retains Node >=24.

**Verification:**

- [ ] `rg` finds no stale statement that `"auto"` is the default.
- [ ] `pnpm run format:check` passes.

**Dependencies:** Task 3

**Files likely touched:**

- `README.md`
- `docs/presets.md`
- `CHANGELOG.md`
- `package.json`
- `pnpm-lock.yaml`

**Estimated scope:** Medium

## Checkpoint: Release candidate

- [ ] All implementation increments are committed.
- [ ] `pnpm run check` passes on Node 24.
- [ ] `pnpm run test:pack` passes with the default React 19 consumer.
- [ ] `REACT_VERSION=18.3.1 pnpm run test:pack` passes.
- [ ] `pnpm run audit:prod` passes.

## Task 5: Review, merge, and publish the addon

**Description:** Review the complete branch, open a ready PR, wait for every
required check, merge to main, tag the exact merge commit, publish the GitHub
release, and verify npm trusted publication and provenance.

**Acceptance criteria:**

- [ ] No actionable review findings remain and CI is green.
- [ ] The PR is merged and `v0.4.0` tags the exact main merge commit.
- [ ] npm reports 0.4.0 as `latest` with provenance.

**Verification:**

- [ ] GitHub PR checks and release workflow succeed.
- [ ] `npm view slidev-addon-sandpack@0.4.0 version dist-tags --json` reports the release.
- [ ] npm package metadata contains a provenance attestation.

**Dependencies:** Task 4 and release-candidate checkpoint

**Files likely touched:** None beyond release metadata already committed

**Estimated scope:** Small

## Task 6: Upgrade and build the talks deck

**Description:** Upgrade only the 2025-12-15 talk to the published 0.4.0
package, refresh the workspace lockfile, and prove the production deck still
builds before starting browser verification.

**Acceptance criteria:**

- [ ] The talk consumes `slidev-addon-sandpack@^0.4.0` without an explicit theme.
- [ ] The lockfile resolves the published 0.4.0 artifact.
- [ ] The relevant talk builds successfully on Node 24.

**Verification:**

- [ ] The relevant talks build command succeeds on Node 24.
- [ ] The dependency and lockfile diff contains no unrelated workspace updates.

**Dependencies:** Task 5

**Files likely touched:**

- `../talks/2025-12-15/src/package.json`
- `../talks/pnpm-lock.yaml`

**Estimated scope:** Small

## Task 7: Browser-verify and merge the talks deck

**Description:** Exercise the first Sandpack demo from the upgraded talk in a
real browser, capture visual evidence, then review, commit, push, and merge the
talks change.

**Acceptance criteria:**

- [ ] The first demo visibly uses the dark shell, renders its preview, and exposes the control hooks.
- [ ] Modifier-arrow navigation changes steps and the console has no new addon errors.
- [ ] A screenshot is retained as evidence and the talks change is merged.

**Verification:**

- [ ] DOM inspection confirms theme/control state and keyboard behavior.
- [ ] A real-browser screenshot shows the verified slide.
- [ ] Talks CI, if configured for the PR, succeeds before merge.

**Dependencies:** Task 6

**Files likely touched:** None beyond the Task 6 dependency update

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] All design success criteria are satisfied.
- [ ] Both repositories are clean and synchronized with their merged main branches.
- [ ] Release, npm provenance, browser evidence, and commit/PR URLs are reported.

## Risks and mitigations

| Risk                                               | Impact | Mitigation                                                                     |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Control CSS accidentally retains class specificity | Medium | Contract-test the stylesheet and inspect computed styles in the real deck.     |
| Shortcut collides with Slidev or editing           | High   | Attach only to the control group and test both propagation and outside events. |
| Package works in the repo but not for consumers    | High   | Build isolated packed consumers with both supported React majors.              |
| npm publication races the talks update             | Medium | Verify the exact published version before changing the talks lockfile.         |
| Real deck exposes layout/runtime regressions       | High   | Build and inspect the actual Sandpack slide before merging talks.              |

## Open questions

None. The approved design resolves the public contract and release scope.
