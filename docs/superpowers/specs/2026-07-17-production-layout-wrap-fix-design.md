# Production Sandpack layout wrap fix

## Problem

The React Three Fiber talk renders its Sandpack editor and preview side by side
under `slidev dev`, but the deployed production bundle places the preview below
the editor and clips most of it.

The talk and dependency version are identical in both environments. The
difference is stylesheet order:

- Development injects Sandpack's generated `.sp-c-ikJbEZ { flex-wrap: wrap; }`
  rule before the addon's `.slidev-sandpack__workspace { flex-wrap: nowrap; }`
  rule, so the addon wins.
- Production extracts the addon CSS into an early stylesheet and injects
  Sandpack's generated rule later at runtime. Both selectors have one class of
  specificity, so Sandpack wins.

The workspace also has a one-pixel gap. Its editor and preview flex bases total
100%, so `flex-wrap: wrap` moves the preview to a second row. The fixed-height,
overflow-hidden workspace then clips that row.

## Goals

- Keep the editor and preview on one horizontal flex line in development and
  production builds.
- Make the result independent of stylesheet injection order.
- Preserve the configured editor/preview percentage split.
- Avoid `!important` when ordinary selector specificity is sufficient.
- Guard both the CSS contract and the production-bundle behavior against
  regression.

## Non-goals

- Change responsive behavior outside the addon-owned live demo workspace.
- Change the configured editor or preview sizes.
- Change Sandpack's internal styles or dependency version.
- Add a talk-specific CSS workaround.

## Approaches considered

### Strengthen the addon selector (chosen)

Use the stable classes already present on the same element:

```css
.slidev-sandpack__workspace.sp-layout {
  flex-wrap: nowrap;
}
```

This selector has two class components, so it outranks Sandpack's generated
single-class selector even when Sandpack injects its rule later. The addon
already relies on Sandpack's stable `.sp-layout`, `.sp-editor`, and `.sp-preview`
classes for layout integration.

### Add `!important`

`flex-wrap: nowrap !important` would also win, but it would force consumers to
use `!important` when intentionally overriding the workspace layout. The
stronger selector is sufficient and leaves the cascade more usable.

### Adjust the flex bases around the gap

Reducing the 70% and 30% bases by fractions of a pixel could keep the items on
one line while wrapping remains enabled. This treats the one-pixel symptom,
depends on the current gap, and leaves production behavior vulnerable to other
Sandpack layout changes.

## Implementation

Change only the workspace selector in `styles/sandpack.css`; keep its existing
declarations and all child sizing rules unchanged.

Add a style-contract regression test that requires the combined
`.slidev-sandpack__workspace.sp-layout` selector to own `flex-wrap: nowrap`.
The test must fail against version 0.5.0's single-class selector before the CSS
change is applied.

## Verification

1. Run the targeted style test in its failing state.
2. Apply the selector change and rerun the targeted test.
3. Run formatting, lint, type checking, all tests, the example production
   build, both React package-consumer checks, and the production audit on Node 24.
4. Serve the built production example and inspect the live workspace. Its
   computed `flex-wrap` must be `nowrap`; editor and preview must have the same
   vertical position and retain their configured horizontal split.
5. After publishing the patch, build and inspect the real R3F talk in
   `../talks` and confirm the hosted slide remains side by side.

## Release and rollback

Publish the fix as `slidev-addon-sandpack@0.5.1`, then upgrade the R3F talk to
`^0.5.1`. The change is a backward-compatible production layout correction.

Rollback is the previous `0.5.0` release and talks dependency. If the stronger
selector creates an unexpected consumer conflict, revert the selector commit,
publish a new patch, and restore the last verified talks version.

## Success criteria

- Development and production compute `flex-wrap: nowrap` for the addon
  workspace.
- Editor and preview render side by side on the production example and the
  hosted R3F slide.
- The full addon and talks verification gates pass.
- npm reports `0.5.1` as `latest`, and both repositories are clean on `main`.
