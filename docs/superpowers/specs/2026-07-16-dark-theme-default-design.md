# Dark Sandpack theme default

## Context

Version 0.3.0 added deck-wide Sandpack theme configuration and shipped with
Sandpack's adaptive `"auto"` mode as the fallback. The desired product default
is now a consistently dark editor and preview shell. Version 0.3.0 is already
published to npm, so this behavior change will ship as the immutable
fix-forward release 0.3.1.

The consuming deck used for real-world verification is
`../talks/2025-12-15/src`. It currently depends on
`slidev-addon-sandpack@^0.2.1`, contains two stepped Sandpack demos, and does not
set a deck theme.

## Goals

- Resolve an omitted deck theme to Sandpack's native `"dark"` mode.
- Keep explicit `"auto"`, `"light"`, `"dark"`, and custom theme objects
  unchanged.
- Keep resolver output and the renderer's compatibility fallback consistent.
- Publish the behavior as `slidev-addon-sandpack@0.3.1`.
- Upgrade the real talks deck to 0.3.1 without adding an explicit theme, so it
  verifies the new addon default.
- Produce a screenshot of a rendered talks Sandpack slide as visual evidence.

## Non-goals

- Removing or redefining the explicit `"auto"` mode.
- Styling the code executed inside Sandpack's preview iframe.
- Adding a theme override only to the talks deck.
- Changing Sandpack's custom-theme schema or catalog support.

## Considered approaches

### Native resolver and renderer default

Change omitted-theme resolution and the renderer fallback from `"auto"` to
`"dark"`. This is the selected approach because compiled demos and older or
manually constructed demo values behave consistently.

### Resolver-only default

Changing only configuration resolution would cover normal Slidev compilation,
but direct `SandpackDemo` consumers would still fall back to `"auto"`. That
split behavior is avoidable and therefore rejected.

### Talks-only configuration or CSS override

Adding `theme: "dark"` to the talks deck would verify dark mode but would not
change the addon's default. A CSS override would also bypass Sandpack's native
theme contract. Both approaches are rejected.

## Behavior

The resolver will return `"dark"` when `SandpackConfig.theme` is omitted. The
renderer will pass `demo.theme ?? "dark"` to `SandpackProvider`. Explicit theme
values continue to pass through unchanged, including `"auto"` as the opt-in
adaptive mode.

No public type changes are required. Documentation will describe `"dark"` as
the default, and the changelog will record the 0.3.1 behavior change.

## Test-first implementation

1. Change the resolver test for an omitted theme to expect `"dark"` and run it
   to observe the expected failure against the 0.3.0 implementation.
2. Change the renderer compatibility-fallback test to expect `"dark"` and run
   it to observe the expected failure.
3. Make the two minimal production changes.
4. Run focused tests, then the full repository check, production audit, and
   isolated React 18 and React 19 package tests.

## Release and talks rollout

1. Set package metadata and the changelog to 0.3.1.
2. Review, commit, push, open a ready pull request, and merge only after CI is
   green.
3. Tag the exact `main` merge commit as `v0.3.1`, publish the GitHub release,
   and verify the trusted npm publication and provenance.
4. In `../talks`, update only `2025-12-15/src` to
   `slidev-addon-sandpack@^0.3.1` and refresh the workspace lockfile.
5. Build the talk and run its first Sandpack demo in a real browser.
6. Verify that Sandpack receives the dark theme, the editor is visibly dark,
   the preview renders, and the browser console has no new errors.
7. Capture a screenshot of that rendered slide, then review, commit, push, and
   merge the talks update.

## Success criteria

- Omitting `theme` produces `"dark"` in resolver and renderer tests.
- Explicit `"auto"` remains covered and unchanged.
- Addon CI and release publishing succeed for 0.3.1.
- npm reports 0.3.1 as `latest` with provenance.
- The talks deck builds against 0.3.1 and its real Sandpack slide visibly uses
  the dark shell in the captured screenshot.
