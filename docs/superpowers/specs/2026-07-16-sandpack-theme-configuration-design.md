# Sandpack theme configuration

## Context

The renderer currently passes `theme="auto"` directly to `SandpackProvider`, so
decks cannot choose another Sandpack theme. Sandpack's native `theme` prop
accepts `"auto"`, `"light"`, `"dark"`, or a partial custom theme object. Theme
objects exported by `@codesandbox/sandpack-themes` use that same contract.

The addon already loads `sandpack.config.ts` once per deck, resolves its values
into plain demo data, and passes that data through the Vue bridge to the React
renderer. Theme configuration should use this existing path.

## Goals

- Let a deck configure the Sandpack interface theme once in
  `sandpack.config.ts`.
- Mirror Sandpack's native theme prop rather than introducing addon-specific
  theme names or shapes.
- Support built-in modes, partial custom objects, and theme objects imported
  from `@codesandbox/sandpack-themes`.
- Preserve the current `"auto"` behavior when no theme is configured.
- Report unsupported top-level theme values while the deck is compiled.

## Non-goals

- Choosing a different theme for each preset or Markdown fence.
- Adding or re-exporting the `@codesandbox/sandpack-themes` catalog.
- Styling the addon-owned step and edit controls with Sandpack theme tokens.
- Styling the application rendered inside Sandpack's preview iframe.
- Defining a new theme format or deeply revalidating Sandpack's custom theme
  schema.

## Public API

Add an optional deck-level `theme` field that uses Sandpack's native
`SandpackThemeProp` type:

```ts
import { amethyst } from "@codesandbox/sandpack-themes";
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  theme: amethyst,
});
```

The field also accepts a built-in mode:

```ts
export default defineSandpackConfig({
  theme: "dark",
});
```

Or a partial custom theme object:

```ts
export default defineSandpackConfig({
  theme: {
    colors: {
      accent: "rebeccapurple",
    },
    syntax: {
      tag: "#006400",
    },
  },
});
```

Sandpack uses `colors.surface1` to choose defaults for fields omitted from a
partial custom object: dark defaults when that color is detected as dark, and
light defaults otherwise.

`SandpackConfig.theme` will be typed as `SandpackThemeProp`, and the addon will
re-export that type from its package root so consumers do not need to import a
public configuration type through the addon's implementation dependency.

The exported `SandpackDemo` runtime contract will gain an optional `theme`
field. Keeping it optional preserves compatibility for consumers and tests that
construct demo objects directly.

## Resolution and rendering

For every parsed demo, the resolver will:

1. Read the deck-level `theme` value.
2. Resolve an omitted value to `"auto"`.
3. Store the resolved value in the plain `SandpackDemo` data placed in slide
   frontmatter.

The Vue bridge remains unchanged. The React renderer will pass
`demo.theme ?? "auto"` to `SandpackProvider`. The renderer-side fallback keeps
older or manually constructed `SandpackDemo` objects compatible even though
newly compiled demos always include the resolved theme.

Changing `sandpack.config.ts` already restarts the development server, so theme
changes require no additional watcher behavior.

## Validation and failure behavior

- `undefined` resolves to `"auto"`.
- String values must be `"auto"`, `"light"`, or `"dark"`.
- A custom theme must be a non-null, non-array object.

Other values fail during demo resolution with this error:

```text
[slidev-addon-sandpack] Sandpack theme must be "auto", "light", "dark", or a custom theme object.
```

TypeScript and Sandpack's own `SandpackThemeProp` contract remain responsible
for validating nested custom-theme fields. The addon will not duplicate that
version-sensitive schema at runtime.

Catalog themes remain opt-in. A deck that imports one must declare
`@codesandbox/sandpack-themes` in its own dependencies; this addon will not add
the catalog package for decks that only use built-in or inline themes.

## Documentation

- Extend the README configuration example with the native `theme` field.
- Document built-in, imported catalog, and inline custom theme usage in the
  preset guide while making clear that the field applies deck-wide.
- Note that imported catalog themes require `@codesandbox/sandpack-themes` in
  the consuming deck.
- Add a changelog entry describing the new backward-compatible configuration.

## Testing

- Type tests prove that built-in literals and partial custom objects are
  accepted, invalid string names are rejected, and `SandpackThemeProp` is
  exported from the package root.
- Resolver tests first demonstrate the missing behavior, then verify configured
  themes are retained, omission resolves to `"auto"`, and unsupported top-level
  values fail with an addon-prefixed build error.
- Renderer tests capture the mocked provider's `theme` prop and verify both a
  resolved custom object and the compatibility fallback reach Sandpack.
- The complete repository checks and packed-consumer test run before the
  implementation is considered complete.

## Compatibility

This is an additive public API change. Existing configurations continue to use
`"auto"`, and existing `SandpackDemo` values remain assignable because their new
field is optional. The feature does not alter preset inheritance, Markdown
syntax, source-file watching, or the visual treatment of addon-owned controls.
