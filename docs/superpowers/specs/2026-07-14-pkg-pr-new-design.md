# pkg.pr.new pull-request previews

## Context

Contributors need an installable build of `slidev-addon-sandpack` before a pull
request is merged and released to npm. Production npm publishing must remain
limited to GitHub releases and npm trusted publishing.

[`pkg.pr.new`](https://github.com/stackblitz-labs/pkg.pr.new) provides temporary,
npm-compatible package URLs without publishing versions to npm. Its GitHub App
can update a single pull-request comment with the current preview URL.

## Goals

- Publish a new preview package after every pull-request update.
- Publish only code that has passed the repository's complete CI suite.
- Give contributors a pnpm development-dependency install command in one
  continuously updated pull-request comment.
- Keep preview publishing isolated from the npm release workflow and npm
  credentials.
- Follow pkg.pr.new's lockfile-based CI setup.

## Non-goals

- Publishing previews for direct pushes to `main` or tags.
- Replacing npm releases, release tags, or trusted publishing.
- Generating pkg.pr.new StackBlitz templates; that feature is experimental and
  separate from the addon's own Sandpack presets.
- Publishing unbuilt TypeScript sources.

## Design

### Dependency

Add the current `pkg-pr-new` CLI as a development dependency and commit its
pnpm lockfile changes. CI will invoke it with `pnpm exec`; transient runners such
as `pnpx` or `pnpm dlx` will not be used.

### Workflow

Extend `.github/workflows/ci.yml` with one `preview` job that:

1. Runs only for the `pull_request` event.
2. Depends on both existing `validate` and `package` jobs, so all supported Node
   versions and React consumer combinations pass first.
3. Checks out the pull-request revision and installs the locked dependencies on
   Node.js 24.
4. Builds `dist` with the existing `build` script.
5. Runs `pnpm exec pkg-pr-new publish --commentWithDev --packageManager=pnpm`.

The command runs exactly once per workflow. The default `comment=update`
behavior keeps one comment current, and omitting `--commentWithSha` gives the PR
a stable URL that resolves to its latest successful preview. Compact URLs are
supported by the package's existing npm publication and exact GitHub repository
metadata.

The workflow retains read-only repository contents permission. pkg.pr.new's
GitHub App, rather than `GITHUB_TOKEN` or an npm token, handles preview status and
pull-request comments.

### Documentation

- Add the official pkg.pr.new repository badge to `README.md`.
- Explain in `CONTRIBUTING.md` that successful pull requests receive an updated
  preview install command.
- Record installation of the pkg.pr.new GitHub App as the one-time repository
  setup required to activate publishing.

## Failure behavior

- Failed validation or package tests prevent the preview job from running.
- A preview upload failure fails only the PR preview job; it cannot publish to
  npm or modify the production release workflow.
- Superseded workflow runs continue to use CI's existing concurrency
  cancellation, so stale PR commits do not finish publishing after newer ones.

## Verification

Before committing the implementation:

- Run Prettier on the changed Markdown, YAML, package manifest, and lockfile.
- Run the repository's complete `pnpm run check` suite.
- Run `pnpm run test:pack` to verify the packed consumer artifact.
- Inspect the workflow diff to confirm the CLI runs once and only on pull
  requests after both CI jobs.

After pushing the branch:

- Install the official pkg.pr.new GitHub App for
  `nirtamir2/slidev-addon-sandpack` if it is not already installed.
- Open or update a pull request and confirm the preview job succeeds.
- Confirm the app creates one comment containing a pnpm development-dependency
  install command and updates that comment on the next commit.
