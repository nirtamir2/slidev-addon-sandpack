# Dark default and customizable live code controls

## Context

Version 0.3.0 added deck-wide Sandpack theme configuration and shipped with
Sandpack's adaptive `"auto"` mode as the fallback. The desired product default
is now a consistently dark editor and preview shell.

The addon-owned live code controls also need a stable customization surface.
Consumers should be able to target semantic data attributes or empty CSS class
hooks without fighting the addon's bundled styles. The same controls should
support keyboard navigation without claiming Slidev's unmodified arrow keys or
interfering with editing.

Version 0.3.0 is already published to npm. These additive public styling and
keyboard capabilities, together with the default behavior change, will ship as
the immutable fix-forward release 0.4.0.

The consuming deck used for real-world verification is
`../talks/2025-12-15/src`. It currently depends on
`slidev-addon-sandpack@^0.2.1`, contains two stepped Sandpack demos, and does not
set a deck theme.

## Goals

- Resolve an omitted deck theme to Sandpack's native `"dark"` mode.
- Keep explicit `"auto"`, `"light"`, `"dark"`, and custom theme objects
  unchanged.
- Keep resolver output and the renderer's compatibility fallback consistent.
- Add stable, namespaced data attributes and empty CSS class hooks to the
  addon-owned live code controls.
- Make consumer class overrides win without requiring specificity escalation.
- Support modifier-arrow step navigation while focus is within those controls.
- Preserve native editor, input, preview, and Slidev keyboard behavior.
- Publish the behavior and public hooks as `slidev-addon-sandpack@0.4.0`.
- Upgrade the real talks deck to 0.4.0 without adding an explicit theme, so it
  verifies the new addon default.
- Produce a screenshot of a rendered talks Sandpack slide as visual evidence.

## Non-goals

- Removing or redefining the explicit `"auto"` mode.
- Styling the code executed inside Sandpack's preview iframe.
- Exposing hooks for Sandpack-owned editor or preview internals.
- Adding a theme override only to the talks deck.
- Changing Sandpack's custom-theme schema or catalog support.
- Providing a configurable shortcut map in this release.

## Considered approaches

### Theme resolution

The selected approach changes both omitted-theme resolution and the renderer
fallback from `"auto"` to `"dark"`. This keeps compiled demos and older or
manually constructed demo values consistent.

Changing only configuration resolution would leave direct `SandpackDemo`
consumers on `"auto"`. Adding `theme: "dark"` only to the talks deck or applying
a CSS override would not change the addon's default. Those alternatives are
rejected.

### Control customization

The selected approach exposes semantic, namespaced data attributes and empty
BEM-style class hooks. The bundled stylesheet uses only zero-specificity
`:where([data-*])` selectors, so a consumer's ordinary class selector wins by
the cascade. Data attributes provide a stable semantic contract for styling
and testing; empty classes provide an ergonomic override surface.

Reusing the current styled class selectors would make consumers match or beat
addon specificity. A JavaScript appearance object would add a larger public API
and duplicate normal CSS capabilities, so it is deferred.

### Keyboard navigation

The selected approach handles modifier-arrow keys only on the addon-owned
control group: Command+Left/Right on macOS and Control+Left/Right elsewhere.
The implementation accepts either Meta or Control so the shortcut remains
usable across platforms and keyboard environments.

Unmodified arrows are reserved for Slidev navigation. A root-level handler
could capture keys from the code editor, inputs, editable content, or the
preview, so it is rejected. Bracket-key shortcuts and a configurable shortcut
map are less discoverable or larger in scope and are deferred.

## Theme behavior

The resolver returns `"dark"` when `SandpackConfig.theme` is omitted. The
renderer passes `demo.theme ?? "dark"` to `SandpackProvider`. Explicit theme
values continue to pass through unchanged, including `"auto"` as the opt-in
adaptive mode.

No public theme type changes are required. Documentation describes `"dark"` as
the default.

## Control customization contract

The contract applies only to the addon's live code control bar:

| Element         | Empty CSS hooks                                                             | Stable data attributes                                                                                        |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Control group   | `slidev-sandpack__controls`                                                 | `data-slidev-sandpack-part="controls"`; state is `read-only` or `editing`                                     |
| Previous button | `slidev-sandpack__control-button slidev-sandpack__control-button--previous` | part `control-button`; action `previous-step`; state `enabled` or `disabled`                                  |
| Next button     | `slidev-sandpack__control-button slidev-sandpack__control-button--next`     | part `control-button`; action `next-step`; state `enabled` or `disabled`                                      |
| Mode button     | `slidev-sandpack__control-button slidev-sandpack__control-button--mode`     | part `control-button`; action `toggle-edit`; state `read-only` or `editing`                                   |
| Step status     | `slidev-sandpack__step-status`                                              | `data-slidev-sandpack-part="step-status"`, `data-slidev-sandpack-step`, and `data-slidev-sandpack-step-count` |

Native `disabled` and ARIA attributes remain the behavioral and accessibility
source of truth. Mirrored data states exist for CSS and tests. Existing control
group markup and accessibility semantics remain intact. Step and step-count
data values use the same 1-based numbering shown in the visible status text.

The addon stylesheet does not target the empty class hooks. Its control styles
use `:where(...)` around the data contract, which gives every bundled selector
zero specificity. Consumers can therefore override defaults with a single
class selector, while still having data attributes for state-dependent styles.

## Keyboard behavior

The control group handles Left and Right Arrow only when exactly one supported
primary modifier is active (`metaKey` or `ctrlKey`) and neither Shift nor Alt is
active. Left moves to the previous step and Right moves to the next step,
clamped at the same boundaries as the buttons. A recognized shortcut calls
`preventDefault()` so the browser does not also perform its native action.

The previous and next buttons expose both platform forms through
`aria-keyshortcuts`: `Meta+ArrowLeft Control+ArrowLeft` and
`Meta+ArrowRight Control+ArrowRight`. The key handler is attached to the
control group rather than the Sandpack root. Consequently, focus in the editor,
an input, editable content, or the preview does not invoke addon navigation.
Existing event isolation continues to prevent a handled control shortcut from
also navigating Slidev.

## Test-first implementation

1. Change the resolver test for an omitted theme to expect `"dark"` and run it
   to observe the expected failure against the 0.3.0 implementation.
2. Change the renderer compatibility-fallback test to expect `"dark"` and run
   it to observe the expected failure.
3. Add renderer tests for every class and data hook, including state and step
   values, and observe the failures.
4. Add keyboard tests for previous, next, boundaries, unsupported modifiers,
   and events outside the control group, and observe the failures.
5. Add a stylesheet contract test that bundled control styles use
   zero-specificity data selectors rather than the empty class hooks.
6. Make the minimal production and stylesheet changes.
7. Run focused tests, then the full repository check, production audit, and
   isolated React 18 and React 19 package tests.

## Release and talks rollout

1. Set package metadata and the changelog to 0.4.0 and document the theme,
   styling hooks, data attributes, and shortcuts.
2. Review, commit, push, open a ready pull request, and merge only after CI is
   green.
3. Tag the exact `main` merge commit as `v0.4.0`, publish the GitHub release,
   and verify the trusted npm publication and provenance.
4. In `../talks`, update only `2025-12-15/src` to
   `slidev-addon-sandpack@^0.4.0` and refresh the workspace lockfile.
5. Build the talk and run its first Sandpack demo in a real browser.
6. Verify that Sandpack receives the dark theme, the editor is visibly dark,
   the preview renders, the new control hooks are present, the keyboard
   shortcuts change steps, and the browser console has no new errors.
7. Capture a screenshot of that rendered slide, then review, commit, push, and
   merge the talks update.

## Success criteria

- Omitting `theme` produces `"dark"` in resolver and renderer tests.
- Explicit `"auto"` remains covered and unchanged.
- Every addon-owned control exposes the documented class and data hooks.
- Consumer class selectors override bundled styles without specificity hacks.
- Modifier-arrow navigation works only from the control group and respects
  step boundaries.
- Addon CI and release publishing succeed for 0.4.0.
- npm reports 0.4.0 as `latest` with provenance.
- The talks deck builds against 0.4.0 and its real Sandpack slide visibly uses
  the dark shell in the captured screenshot.
