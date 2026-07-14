# Releasing

This package uses npm trusted publishing from GitHub Actions. The release workflow has no long-lived npm write token and publishes provenance automatically when the repository and package are public.

## One-time setup

The package already exists on npm. Configure its GitHub Actions trusted
publisher with:

```bash
npm trust github slidev-addon-sandpack \
  --file release.yml \
  --repo nirtamir2/slidev-addon-sandpack \
  --allow-publish \
  --yes
```

The equivalent npm package settings are:

- Organization or user: `nirtamir2`
- Repository: `slidev-addon-sandpack`
- Workflow filename: `release.yml`
- Allowed action: `npm publish`

After verifying trusted publishing, disallow token-based publishing for the
package and revoke any automation token that is no longer needed.

The repository URL in `package.json` must continue to match
`https://github.com/nirtamir2/slidev-addon-sandpack` exactly for npm's OIDC
validation.

## Release checklist

1. Update the version in `package.json` and add the release notes to `CHANGELOG.md`.
2. Run:

   ```bash
   pnpm run check
   pnpm run test:pack
   pnpm run audit:prod
   ```

3. Merge the release commit to the default branch.
4. Create and publish a GitHub release tagged `v<version>`, for example
   `v0.1.1`.
5. Confirm the `Publish` workflow succeeds and the npm page shows provenance.

## Slidev addon gallery

Slidev's **More Addons** gallery discovers packages from npm. The required discovery metadata is already present:

- The package name starts with `slidev-addon-`.
- The npm keywords include both `slidev` and `slidev-addon`.
- The package is public and has a description, repository, homepage, README, and MIT license.

Allow npm and the Slidev gallery index time to refresh after the first publish. A separate contribution is only needed if maintainers invite the package into the curated **Community Addons** section.
