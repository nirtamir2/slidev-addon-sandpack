# Implementation Plan: Production Sandpack layout wrap fix

## Overview

Make the addon-owned Sandpack workspace keep its editor and preview on one flex
line regardless of whether Vite development CSS or the production bundle loads
first. Prove the regression test fails before the fix, verify the built runtime
in a real browser, publish patch release 0.5.1, and upgrade the real R3F talk.

## Architecture decisions

- Strengthen the existing workspace selector to
  `.slidev-sandpack__workspace.sp-layout`; do not add `!important` or change
  editor/preview percentages.
- Treat production-bundle browser behavior as the authoritative regression
  check because `slidev dev` reverses the relevant stylesheet order.
- Ship the correction as patch release 0.5.1 and consume only the published npm
  artifact from `../talks`.

## Dependency graph

```text
Failing style contract
  -> stronger workspace selector
    -> addon verification and production-browser proof
      -> 0.5.1 metadata and release
        -> talks dependency upgrade
          -> hosted production verification
```

## Task 1: Add the failing specificity regression

**Description:** Update the style contract to require the combined workspace
and Sandpack layout classes on the rule that owns `flex-wrap: nowrap`.

**Acceptance criteria:**

- [ ] The test describes protection from Sandpack's later runtime style.
- [ ] The assertion requires `.slidev-sandpack__workspace.sp-layout`.
- [ ] The targeted test fails against the current single-class selector.

**Verification:**

- [ ] Run `pnpm exec vitest run test/styles.test.ts` on Node 24 and capture the
      expected failure.

**Dependencies:** None.

**Files likely touched:**

- `test/styles.test.ts`

**Estimated scope:** XS.

## Task 2: Strengthen the workspace selector

**Description:** Apply the minimum CSS change so the addon rule outranks
Sandpack's generated single-class rule independent of injection order.

**Acceptance criteria:**

- [ ] The selector is `.slidev-sandpack__workspace.sp-layout`.
- [ ] Existing workspace and child sizing declarations are unchanged.
- [ ] No `!important` is added to `flex-wrap`.

**Verification:**

- [ ] `pnpm exec vitest run test/styles.test.ts` passes on Node 24.
- [ ] `git diff --check` passes.

**Dependencies:** Task 1.

**Files likely touched:**

- `styles/sandpack.css`

**Estimated scope:** XS.

## Checkpoint: Regression contract

- [ ] The test was observed failing before the implementation.
- [ ] The targeted test passes after the implementation.
- [ ] The diff contains only the test and minimum selector change.

## Task 3: Verify the addon and production bundle

**Description:** Run the complete addon gates and prove the compiled example
uses `nowrap` after Sandpack injects its runtime stylesheet.

**Acceptance criteria:**

- [ ] Formatting, lint, types, all tests, and example production build pass.
- [ ] React 18 and React 19 isolated package consumers pass.
- [ ] Production dependency audit reports no high-severity vulnerabilities.
- [ ] Built example computes `flex-wrap: nowrap`; editor and preview have the
      same vertical position and retain their horizontal split.

**Verification:**

- [ ] `pnpm run check`
- [ ] `pnpm run test:pack`
- [ ] `REACT_VERSION=18.3.1 pnpm run test:pack`
- [ ] `pnpm run audit:prod`
- [ ] Serve `example-dist` and inspect the workspace with Chrome DevTools.

**Dependencies:** Task 2.

**Files likely touched:** None beyond generated, ignored build output.

**Estimated scope:** S.

## Task 4: Prepare and publish 0.5.1

**Description:** Record the user-visible production fix, update the package
version, repeat the release gate, and ship through trusted publishing.

**Acceptance criteria:**

- [ ] `package.json` and `CHANGELOG.md` describe version 0.5.1.
- [ ] The release commit is reviewed and merged through a green PR.
- [ ] GitHub release tag `v0.5.1` targets the exact verified merge commit.
- [ ] npm reports `slidev-addon-sandpack@0.5.1` as `latest`.

**Verification:**

- [ ] Repeat the documented release checklist on Node 24 after metadata changes.
- [ ] Wait for PR CI, post-merge CI, and the Publish workflow to succeed.
- [ ] Query npm and the remote tag after publication.

**Dependencies:** Task 3.

**Files likely touched:**

- `package.json`
- `CHANGELOG.md`

**Estimated scope:** S.

## Checkpoint: Published addon

- [ ] Main, tag, GitHub release, and npm all identify the same 0.5.1 commit.
- [ ] The addon repository is clean on `main`.

## Task 5: Upgrade and verify the R3F talk

**Description:** Consume the published patch in `../talks`, refresh its
lockfile, build the real deck, and send the two-file change through its PR and
Netlify checks.

**Acceptance criteria:**

- [ ] The R3F talk depends on `slidev-addon-sandpack@^0.5.1`.
- [ ] The lockfile resolves the published 0.5.1 integrity.
- [ ] The R3F production build passes on Node 24.
- [ ] The talks PR and Netlify preview pass and merge to `main`.

**Verification:**

- [ ] Confirm the installed package reports version 0.5.1.
- [ ] Run `pnpm --filter react-three-fiber-talk run build` on Node 24.
- [ ] Serve the production output and verify the editor/preview positions.

**Dependencies:** Task 4.

**Files likely touched:**

- `../talks/2025-12-15/src/package.json`
- `../talks/pnpm-lock.yaml`

**Estimated scope:** S.

## Task 6: Verify hosted production

**Description:** Wait for the merged talks deployment and inspect the public
R3F slide rather than assuming the repository merge reached production.

**Acceptance criteria:**

- [ ] The hosted workspace computes `flex-wrap: nowrap`.
- [ ] Editor and preview share the same vertical position and render side by
      side at the reproduced 1080 CSS-pixel viewport.
- [ ] No new addon console errors appear.
- [ ] Both repositories are clean and synchronized with `origin/main`.

**Verification:**

- [ ] Inspect `https://talks.nirtamir.com/2025/react-next/16` with Chrome
      DevTools after deployment.
- [ ] Check final Git, GitHub release, and npm state.

**Dependencies:** Task 5.

**Files likely touched:** None.

**Estimated scope:** XS.

## Checkpoint: Complete

- [ ] All success criteria in the approved design are met.
- [ ] The original production failure is verified fixed end to end.
- [ ] Release and rollback references are documented in the handoff.

## Risks and mitigations

| Risk                                                      | Impact | Mitigation                                                                   |
| --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| A static CSS test passes while runtime order still breaks | High   | Inspect a built production page and compare computed styles and geometry.    |
| `!important` reduces consumer control                     | Medium | Use the approved two-class selector instead.                                 |
| npm or Netlify propagation delays verification            | Medium | Poll authoritative npm and hosted runtime state before declaring completion. |
| Development-only testing masks the regression again       | High   | Make production-bundle inspection an explicit release gate.                  |

## Open questions

None. The approved design fixes the addon and publishes a patch before updating
the consuming talk.
