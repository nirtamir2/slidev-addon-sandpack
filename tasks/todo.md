# Sandpack theme configuration checklist

## Task 1: Define and resolve the native theme contract

**Description:** Use a red-green cycle to establish the public theme type and
resolver behavior. Add failing type and resolver assertions first, confirm they
fail for the missing feature, then implement the smallest type, validation, and
resolved-data changes that make them pass.

**Acceptance criteria:**

- [x] `SandpackConfig.theme` accepts `"auto"`, `"light"`, `"dark"`, and partial
      custom theme objects while rejecting unsupported strings.
- [x] `SandpackThemeProp` is exported from the addon package root, and
      `SandpackDemo.theme` remains optional.
- [x] Resolution retains a configured theme, defaults omission to `"auto"`, and
      rejects invalid top-level values with the specified addon-prefixed error.

**Verification:**

- [x] Observe the new focused assertions fail before production code changes.
- [x] Run `pnpm exec vitest run test/presets.test.ts`.
- [x] Run `pnpm run typecheck`.

**Dependencies:** None.

**Files likely touched:** `src/types.ts`, `src/index.ts`, `src/presets.ts`,
`test/types.test.ts`, `test/presets.test.ts`.

**Estimated scope:** Medium.

## Task 2: Pass the resolved theme to Sandpack

**Description:** Add renderer assertions before replacing the hard-coded theme.
Prove that a custom object reaches `SandpackProvider` unchanged and that a demo
without the optional field still receives `"auto"`.

**Acceptance criteria:**

- [x] The renderer passes `demo.theme` to `SandpackProvider` without reshaping
      custom objects.
- [x] Missing `demo.theme` values continue to pass `"auto"`.
- [x] Existing renderer controls, step navigation, and error behavior remain
      unchanged.

**Verification:**

- [x] Observe the provider-theme assertion fail against the hard-coded value.
- [x] Run `pnpm exec vitest run test/renderer.test.tsx`.
- [x] Run `pnpm run typecheck` after the green implementation.

**Dependencies:** Task 1.

**Files likely touched:** `src/renderer.tsx`, `test/renderer.test.tsx`.

**Estimated scope:** Small.

## Checkpoint: Verify the runtime path

- [x] Run the focused resolver and renderer tests together.
- [x] Confirm the public package build emits the new theme types.
- [x] Inspect the source diff for unrelated preset or control changes.

## Task 3: Document deck-level theme configuration

**Description:** Explain the new setting using examples that match Sandpack's
official API. Cover built-in modes, partial custom objects, and catalog themes
without making the catalog package a dependency of this addon.

**Acceptance criteria:**

- [x] README and preset guide show a deck-level `theme` configuration.
- [x] Documentation distinguishes imported catalog objects from supported
      built-in string values and mentions the catalog installation requirement.
- [x] The example config exercises a theme value, and the changelog records the
      additive feature.

**Verification:**

- [x] Run Prettier on the changed Markdown and example TypeScript files.
- [x] Run `pnpm run build:example` so the public consumer example compiles.
- [x] Inspect all theme examples against the official Sandpack contract.

**Dependencies:** Tasks 1 and 2.

**Files likely touched:** `README.md`, `docs/presets.md`,
`example/sandpack.config.ts`, `CHANGELOG.md`.

**Estimated scope:** Medium.

## Task 4: Run final verification

**Description:** Exercise the repository-wide definition of done and inspect the
complete change before handoff.

**Acceptance criteria:**

- [x] Formatting, linting, type checking, unit tests, and example build pass.
- [x] The isolated packed-package consumer test passes.
- [x] The final diff is scoped, whitespace-clean, and credential-free.

**Verification:**

- [x] Run `pnpm run check`.
- [x] Run `pnpm run test:pack`.
- [x] Run `git diff --check` and inspect `git diff --stat` plus the full diff.

**Dependencies:** Tasks 1-3.

**Files likely touched:** None beyond intentional implementation and checklist
updates.

**Estimated scope:** Small.
