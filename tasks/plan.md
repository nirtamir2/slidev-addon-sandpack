# Implementation Plan: pkg.pr.new pull-request previews

## Overview

Add lockfile-backed pkg.pr.new preview publishing to the existing pull-request
CI flow. A preview is published once per PR update only after all validation and
packed-consumer jobs pass. Contributor documentation will explain the resulting
install command and the one-time GitHub App setup.

## Architecture decisions

- Extend the existing CI workflow so preview publishing is gated by the same
  checks that protect `main`.
- Keep the CLI in `devDependencies` and execute it with `pnpm exec`, as required
  by pkg.pr.new's current CI guidance.
- Use one `preview` job after both CI job families; do not publish from a matrix
  job or invoke the command more than once.
- Preserve the default updating PR comment and PR-number URL while rendering a
  pnpm development-dependency command.
- Leave the npm release workflow unchanged.

## Task list

### Phase 1: Locked publishing tool

- [ ] Task 1: Add `pkg-pr-new` to `devDependencies` and update `pnpm-lock.yaml`.

### Phase 2: CI integration

- [ ] Task 2: Add a PR-only `preview` job that waits for `validate` and
      `package`, rebuilds the package, and publishes it once.

### Checkpoint: Integration

- [ ] Manifest and lockfile are formatted and frozen install succeeds.
- [ ] Workflow syntax is valid and the job dependency/event conditions match
      the design.
- [ ] The production npm release workflow is unchanged.

### Phase 3: Contributor guidance

- [ ] Task 3: Add the pkg.pr.new badge and document PR previews and GitHub App
      activation.

### Phase 4: Verification and activation

- [ ] Task 4: Run the complete local quality and package-consumer suites.
- [ ] Task 5: Push the branch, install or verify the pkg.pr.new GitHub App, and
      confirm a real PR preview comment and package URL.

### Checkpoint: Complete

- [ ] `pnpm run check` passes.
- [ ] `pnpm run test:pack` passes.
- [ ] `git diff --check` passes and the change contains no credentials.
- [ ] GitHub CI and the pkg.pr.new preview job pass on the pull request.
- [ ] The PR has one updated preview comment with a pnpm `-D` install command.

## Dependency order

```text
locked CLI dependency
        |
        v
gated CI preview job
        |
        +----> contributor documentation
        |
        v
local verification -> live PR/App verification
```

The work is intentionally sequential because the workflow depends on the
lockfile-backed CLI, and live verification depends on all committed changes.

## Risks and mitigations

| Risk                                        | Impact                            | Mitigation                                                           |
| ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| GitHub App is not installed                 | Preview upload fails              | Verify/install the official app before live PR validation            |
| Preview publishes before CI completes       | Consumers may test a broken build | Make `preview` depend on both `validate` and `package`               |
| Multiple jobs publish duplicate comments    | PR noise and ambiguous URLs       | Invoke `pkg-pr-new publish` once in a non-matrix job                 |
| Preview path affects npm publishing         | Release regression                | Do not change `.github/workflows/release.yml` or use npm credentials |
| Stale PR run completes after a newer commit | Comment points at old code        | Reuse the CI workflow's cancel-in-progress concurrency               |

## Open questions

None. The preview frequency and workflow design are approved.
