# Implementation Plan: Sandpack theme configuration

## Overview

Expose Sandpack's native `theme` prop as one optional deck-level setting in
`sandpack.config.ts`. The resolver will validate and serialize that value into
each demo, and the renderer will pass it to `SandpackProvider` while preserving
`"auto"` as the compatibility default. Tests will establish the public type,
resolution, validation, and renderer behavior before documentation is updated.

## Architecture decisions

- Add `theme?: SandpackThemeProp` at the `SandpackConfig` root so built-in and
  custom presets share one deck-wide interface theme.
- Re-export `SandpackThemeProp` from the addon package root while keeping
  `@codesandbox/sandpack-themes` an optional consumer-owned dependency.
- Keep `SandpackDemo.theme` optional for source compatibility, but make newly
  resolved demos include `config.theme ?? "auto"`.
- Validate only the stable top-level contract: supported built-in strings or a
  non-null, non-array object. Sandpack's types own nested theme validation.
- Retain a renderer-side `"auto"` fallback for older or manually constructed
  demo objects.
- Implement each behavior test-first and commit only green, independently
  verifiable slices.

## Task list

### Phase 1: Public contract and resolution

- [x] Task 1: Add the typed theme configuration, build-time validation, and
      resolved demo data through a red-green test cycle.

### Phase 2: Renderer integration

- [x] Task 2: Pass configured theme values to `SandpackProvider` and preserve
      the compatibility fallback.

### Checkpoint: Runtime path

- [x] Focused resolver, type, and renderer checks pass.
- [x] The package builds and the full theme value reaches the provider without
      transformation.
- [x] Existing configurations and manually constructed demos still resolve to
      `"auto"`.

### Phase 3: Consumer guidance

- [ ] Task 3: Document built-in, inline custom, and optional catalog themes in
      the README, preset guide, example configuration, and changelog.

### Phase 4: Repository verification

- [ ] Task 4: Run the complete quality gate and packed-consumer verification,
      then inspect the final diff.

### Checkpoint: Complete

- [ ] `pnpm run check` passes.
- [ ] `pnpm run test:pack` passes.
- [ ] `git diff --check` passes and the change contains no credentials.
- [ ] Every design-spec acceptance point is covered by tests or documentation.
- [ ] The worktree contains only intentional Sandpack-theme changes.

## Dependency order

```text
public config type
        |
        v
theme validation and resolved demo data
        |
        v
SandpackProvider pass-through and fallback
        |
        +----> consumer documentation and example
        |
        v
full repository and packed-package verification
```

Tasks 1 and 2 are sequential because the renderer consumes the resolved demo
contract. Documentation follows the stable implementation so its examples are
verified against the final public types.

## Risks and mitigations

| Risk                                                    | Impact                                               | Mitigation                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| The addon narrows Sandpack's theme format               | Valid custom themes fail to compile                  | Reuse and re-export the upstream `SandpackThemeProp` type                      |
| Invalid raw JavaScript config fails only in the browser | Users get a late, unclear error                      | Validate supported strings and the custom-object boundary during resolution    |
| Adding a required demo field breaks consumers           | Existing fixtures or integrations stop type-checking | Keep `SandpackDemo.theme` optional and fall back in the renderer               |
| Catalog themes enlarge every installation               | Consumers pay for an unused package                  | Leave `@codesandbox/sandpack-themes` optional and document direct installation |
| Theme is mistaken for preview-app styling               | User expectations do not match behavior              | State that it themes Sandpack UI, not iframe content or addon controls         |

## Open questions

None. The deck-wide native pass-through API and scope are approved.
