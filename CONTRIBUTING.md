# Contributing

Thanks for contributing to `slidev-addon-sandpack`.

## Development setup

This repository requires Node.js 20.19 or newer and uses the pnpm version declared
in `package.json`.

```bash
corepack enable
pnpm install
pnpm run check
```

Run the example deck during addon development with:

```bash
pnpm exec slidev example/slides.md
```

## Pull requests

- Keep changes focused and include tests for behavior changes.
- Preserve readable Markdown authoring and actionable build-time errors.
- Update the README, preset guide, and changelog when a public contract changes.
- Run `pnpm run test:pack` when dependencies, exports, or packaged files change.
- Use a semantic version that reflects consumer impact.

Formatting is enforced by the repository's Prettier configuration. TypeScript,
Vue, and React code is linted by the repository's ESLint flat configuration.
CI runs the same checks on every pull request and push to `main`.

### Preview packages

After all pull-request checks pass, CI publishes the built addon to
[pkg.pr.new](https://pkg.pr.new/) without publishing it to npm. The pkg.pr.new
app creates one PR comment with a pnpm development-dependency command and
updates that comment after each successful PR update. This lets maintainers and
reviewers test the exact proposed package in a Slidev project before merging.

Repository maintainers must install the official
[pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new) for this repository
once before previews can be published. The integration does not require an npm
token and does not change the release process.

## Reporting security issues

Do not open a public issue for a suspected vulnerability. Follow
[SECURITY.md](./SECURITY.md) instead.
