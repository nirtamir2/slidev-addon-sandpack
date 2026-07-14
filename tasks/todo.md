# pkg.pr.new preview checklist

## Task 1: Lock the publishing CLI

**Description:** Add the current `pkg-pr-new` CLI as a development dependency
and commit the pnpm resolution used by CI.

**Acceptance criteria:**

- [ ] `package.json` contains `pkg-pr-new` in `devDependencies`.
- [ ] `pnpm-lock.yaml` resolves the declared CLI version.
- [ ] `pnpm install --frozen-lockfile` succeeds.

**Verification:**

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm exec pkg-pr-new --help` outside CI only if the CLI supports a
      local help command without publishing.

**Dependencies:** None.

**Files likely touched:** `package.json`, `pnpm-lock.yaml`.

**Estimated scope:** Small.

## Task 2: Publish a gated PR preview

**Description:** Extend CI with one pull-request-only preview job that waits for
all existing checks, rebuilds the package, and publishes through pkg.pr.new.

**Acceptance criteria:**

- [ ] The job runs only for `pull_request` events.
- [ ] The job depends on both `validate` and `package`.
- [ ] The job has no `GITHUB_TOKEN` permissions.
- [ ] The locked CLI publishes exactly once with pnpm dev-install comment
      formatting.

**Verification:**

- [ ] Run Prettier against `.github/workflows/ci.yml`.
- [ ] Inspect the parsed YAML structure and workflow diff.
- [ ] Confirm `.github/workflows/release.yml` is unchanged.

**Dependencies:** Task 1.

**Files likely touched:** `.github/workflows/ci.yml`.

**Estimated scope:** Small.

## Task 3: Document preview packages

**Description:** Make preview availability discoverable to users and explain the
contributor and maintainer setup.

**Acceptance criteria:**

- [ ] README displays the official repository badge.
- [ ] Contributing guidance describes the updated PR comment and preview use.
- [ ] One-time GitHub App activation is documented.

**Verification:**

- [ ] Run Prettier against both Markdown files.
- [ ] Check all pkg.pr.new links and repository identifiers.

**Dependencies:** Task 2.

**Files likely touched:** `README.md`, `CONTRIBUTING.md`.

**Estimated scope:** Small.

## Task 4: Verify locally

**Description:** Exercise the repository's full quality gate and isolated packed
consumer after all implementation changes.

**Acceptance criteria:**

- [ ] Formatting, linting, type checking, unit tests, and example build pass.
- [ ] Isolated package-consumer test passes.
- [ ] Diff is clean, scoped, and credential-free.

**Verification:**

- [ ] Run `pnpm run check`.
- [ ] Run `pnpm run test:pack`.
- [ ] Run `git diff --check` and inspect `git diff`.

**Dependencies:** Tasks 1-3.

**Files likely touched:** None beyond intentional implementation files.

**Estimated scope:** Small.

## Task 5: Verify the live PR integration

**Description:** Activate the repository GitHub App integration and prove the
workflow produces an installable PR package.

**Acceptance criteria:**

- [ ] The official pkg.pr.new GitHub App is installed for this repository.
- [ ] The preview job succeeds on the implementation PR.
- [ ] One app comment contains a working pnpm development install command.

**Verification:**

- [ ] Inspect the GitHub Actions run and PR comment.
- [ ] Confirm the preview URL resolves and reflects the PR revision.

**Dependencies:** Task 4 and a pushed pull request.

**Files likely touched:** None.

**Estimated scope:** Small.
