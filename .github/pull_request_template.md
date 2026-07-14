## Summary

Describe the user-visible outcome and why the change is needed.

## Verification

- [ ] `pnpm run format:check`
- [ ] `pnpm run lint`
- [ ] `pnpm run typecheck`
- [ ] `pnpm run test:run`
- [ ] `pnpm run build:example`
- [ ] `pnpm run test:pack` when packaging or runtime dependencies change

## Public contract

- [ ] Documentation and `CHANGELOG.md` are updated when the public API or authoring syntax changes.
- [ ] The change is backward compatible, or a migration and appropriate version bump are included.
