# Releasing

This package uses npm trusted publishing from GitHub Actions. The release workflow has no long-lived npm write token and publishes provenance automatically when the repository and package are public.

## One-time setup

1. Publish `0.1.0` from `packages/slidev-addon-sandpack` while signed in to npm. npm requires the package to exist before its trusted publisher can be configured.
2. In the `slidev-addon-sandpack` package settings on npm, add a GitHub Actions trusted publisher with:
   - Organization or user: `nirtamir2`
   - Repository: `talks`
   - Workflow filename: `slidev-addon-release.yml`
   - Allowed action: `npm publish`
3. After verifying trusted publishing, disallow token-based publishing for the package and revoke any automation token that is no longer needed.

The repository URL in `package.json` must continue to match `https://github.com/nirtamir2/talks` exactly for npm's OIDC validation.

## Release checklist

1. Update the version in `package.json` and add the release notes to `CHANGELOG.md`.
2. Run:

   ```bash
   pnpm --filter slidev-addon-sandpack format:check
   pnpm --filter slidev-addon-sandpack lint
   pnpm --filter slidev-addon-sandpack typecheck
   pnpm --filter slidev-addon-sandpack test:run
   pnpm --filter slidev-addon-sandpack build:example
   pnpm --filter slidev-addon-sandpack test:pack
   ```

3. Merge the release commit to the default branch.
4. Create and publish a GitHub release tagged `slidev-addon-sandpack-v<version>`, for example `slidev-addon-sandpack-v0.1.1`.
5. Confirm the `Publish Slidev addon` workflow succeeds and the npm page shows provenance.

## Slidev addon gallery

Slidev's **More Addons** gallery discovers packages from npm. The required discovery metadata is already present:

- The package name starts with `slidev-addon-`.
- The npm keywords include both `slidev` and `slidev-addon`.
- The package is public and has a description, repository, homepage, README, and MIT license.

Allow npm and the Slidev gallery index time to refresh after the first publish. A separate contribution is only needed if maintainers invite the package into the curated **Community Addons** section.
