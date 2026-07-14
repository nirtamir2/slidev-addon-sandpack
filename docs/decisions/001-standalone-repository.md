# ADR-001: Maintain the addon in a standalone repository

## Status

Accepted

## Date

2026-07-14

## Context

`slidev-addon-sandpack` was developed and released from a talks monorepo. That
was useful while proving the API against a real presentation, but the addon now
has independent users, releases, issues, dependencies, and contribution needs.

## Decision

Maintain the addon in `nirtamir2/slidev-addon-sandpack`. The repository owns its
pnpm lockfile, ESLint and Prettier configuration, tests, example, CI, release
workflow, issue templates, and contributor documentation. The talks repository
consumes the published npm package like any other Slidev project.

The published `0.1.0` package tree is preserved as `v0.1.0`. Repository metadata
and infrastructure are released as `0.1.1` without changing the addon API.

## Alternatives considered

### Continue in the talks monorepo

This keeps the original integration close, but couples releases and contributor
workflows to unrelated presentations and personal infrastructure.

### Publish from the monorepo and mirror source elsewhere

This gives the addon a visible repository but creates two sources of truth and
unclear release provenance.

## Consequences

- Contributors can clone, validate, and release the addon independently.
- npm provenance points directly to the package's repository.
- The real talk remains an integration consumer without controlling addon tooling.
- Cross-repository integration changes may require coordinated pull requests.
