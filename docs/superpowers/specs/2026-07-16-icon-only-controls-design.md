# Icon-Only Controls Design

## Goal

Make the addon-owned Sandpack header compact and visual without weakening its
accessibility or customization contract.

The header will use inline SVG icons for every button, remove the unsuccessful
step keyboard shortcuts, and keep the existing step status as its only visible
text.

## Chosen design

- Previous and next buttons render left and right arrow icons.
- The mode button communicates the action it performs:
  - While editing, it renders a lock icon because activating it enables
    read-only mode.
  - While read-only, it renders a pencil icon because activating it enables
    editing.
- Buttons contain no visible text.
- Existing accessible names remain action-oriented: `Previous step`,
  `Next step`, `Use read-only mode`, and `Enable editing`.
- Native `title` attributes mirror the accessible names to provide mouse
  tooltips without adding permanent header text.
- SVGs are decorative, inherit `currentColor`, and use `aria-hidden="true"` and
  `focusable="false"`.
- No icon package is added.

## Component structure

The renderer will use small private icon components for the four glyphs. They
share the same 24-by-24 view box, stroke treatment, and icon class while keeping
their paths explicit and easy to inspect.

The existing button classes, modifier classes, data attributes, disabled
states, `aria-pressed` state, and click handlers remain unchanged. Consumer CSS
and automation therefore retain their current hooks.

The mode state and data flow remain unchanged:

1. `layout.defaultMode` initializes editing state.
2. Activating the mode button toggles editing state.
3. The button icon, accessible name, pressed state, data state, and Sandpack
   editor read-only state update together.

## Keyboard behavior

Remove the Command/Control plus arrow feature completely:

- Remove the controls' shortcut handler.
- Remove `aria-keyshortcuts` from step buttons.
- Remove shortcut-specific tests and documentation.

The existing outer keyboard isolation remains. It prevents editor keystrokes
from bubbling into Slidev navigation but does not claim an addon step shortcut.
Keyboard users can still reach each native button and activate it with Enter or
Space.

## Styling

Control buttons become compact squares with centered SVGs. The default button
selector will include the `button` element alongside the zero-specificity data
hook so it outranks Slidev's generic reset while remaining easier to override
with the public consumer class.

The button will receive an explicit square size and compact padding. The icon
will have a fixed visual size and `pointer-events: none`. Hover, focus-visible,
disabled, data attributes, and public class behavior remain unchanged.

The step status (`Step 1 of 5`) remains visible and centered between the arrow
buttons. No other button text appears in the header.

## Error handling

No runtime error path changes. The existing Sandpack error boundary and
disabled boundary controls remain the source of truth.

## Verification

Automated tests will verify:

- Every header button has an accessible name but no visible text node.
- Previous and next buttons render the correct arrow icons.
- The mode icon swaps between pencil and lock with the edit state.
- Modifier-arrow events no longer change steps or advertise shortcuts.
- Public classes, data attributes, disabled states, and edit-mode behavior stay
  intact.
- Default CSS supplies square dimensions and icon sizing without using public
  classes as bundled style selectors.

The full check suite and packed-package compatibility checks will run on Node 24. A real Slidev talk will then be inspected at desktop size to confirm icon
alignment, dark-theme rendering, focus styling, state changes, and the absence
of visible button labels.

## Out of scope

- A replacement keyboard shortcut.
- Removing read-only mode.
- Changing the step status text.
- Styling Sandpack-owned tabs, editor controls, or preview controls.
- Adding an icon dependency or a public icon customization API.
