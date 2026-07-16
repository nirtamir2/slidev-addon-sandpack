# Sandpack preset guide

Presets keep presentation Markdown focused on the files that change while reusing dependencies, entry points, styles, and layout defaults.

## Configuration

`sandpack.config.ts` must default-export a configuration created with `defineSandpackConfig`:

```ts
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  defaultPreset: "react-ts",
  theme: "dark",
  presets: {},
});
```

The addon loads the file without a persistent module cache. In development it also watches the config and every source-backed file.

## Deck theme

The optional top-level `theme` field applies to every Sandpack demo in the
deck. It mirrors Sandpack's native
[`theme` prop](https://sandpack.codesandbox.io/docs/getting-started/themes) and
accepts `"auto"`, `"light"`, `"dark"`, or a partial custom theme object. The
default is `"dark"`; use `"auto"` explicitly to follow the environment's color
scheme.

```ts
import { defineSandpackConfig } from "slidev-addon-sandpack";

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

Sandpack uses `colors.surface1` to choose defaults for omitted fields: dark
defaults when that color is detected as dark, and light defaults otherwise. To
use a catalog theme, install the optional package in the consuming deck and pass
its exported object:

```bash
pnpm add @codesandbox/sandpack-themes
```

```ts
import { amethyst } from "@codesandbox/sandpack-themes";
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  theme: amethyst,
});
```

Catalog names such as `"amethyst"` are not string options. The catalog exports
theme objects compatible with the native prop. The deck theme styles
Sandpack's interface; it does not style the application inside the preview
iframe or the addon's step and edit controls. The addon controls have their own
[stable CSS and data hooks](../README.md#customize-addon-controls).

## Selection order

For each demo, the addon chooses:

1. The optional name following `sandpack` on the opening four-backtick fence.
2. `defaultPreset` from the deck config.
3. Sandpack's built-in `react-ts` template.

A selected name may be a custom preset or a Sandpack built-in template such as `vanilla`, `vanilla-ts`, `react`, `react-ts`, `vue`, `vue-ts`, or `node`.

## Preset fields

```ts
interface SandpackPreset {
  extends?: string;
  template?: SandpackPredefinedTemplate;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: Record<string, SandpackPresetFile>;
  entry?: string;
  layout?: {
    editorSize?: number;
    previewSize?: number;
    defaultMode?: "edit" | "read";
    height?: string;
    minHeight?: string;
  };
}
```

Panel sizes are percentages between 1 and 99. If only one size is provided, the other is its complement. If both are provided, they must total 100.

## Inheritance and merge rules

`extends` accepts one custom preset or a Sandpack built-in template. Cycles and unknown parents fail at build time.

- `dependencies`, `devDependencies`, and `files` merge by key; the child wins.
- A child file replaces the complete parent descriptor at the same path.
- Layout fields merge one level deep.
- Scalar fields such as `template` and `entry` replace the parent value.
- An authored Markdown fence replaces the complete preset file descriptor and makes that file visible and editable.

## Inline and source-backed files

Preset files accept shorthand inline code:

```ts
files: {
  "/styles.css": "body { margin: 0 }",
}
```

Or an object with exactly one of `code` and `source`:

```ts
files: {
  "/index.tsx": {
    source: "./sandpack/index.tsx",
    hidden: true,
  },
  "/styles.css": {
    code: "body { margin: 0 }",
    readOnly: true,
  },
}
```

A string source resolves relative to the consuming deck's `sandpack.config.ts`. Only local files are supported.

## Shareable preset packages

A separate npm package can export a plain typed preset. Use `new URL(..., import.meta.url)` so its files resolve from the preset package rather than the consuming deck:

```ts
import type { SandpackPreset } from "slidev-addon-sandpack";

export const companyReactPreset = {
  template: "react-ts",
  entry: "/index.tsx",
  files: {
    "/index.tsx": {
      source: new URL("./templates/index.tsx", import.meta.url),
      hidden: true,
    },
  },
} satisfies SandpackPreset;
```

The consuming deck can extend it after importing it:

```ts
import { companyReactPreset } from "@company/sandpack-presets";
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  defaultPreset: "company",
  presets: {
    company: companyReactPreset,
    companyWithPhysics: {
      extends: "company",
      dependencies: {
        "@react-three/rapier": "^2.1.0",
      },
    },
  },
});
```

## React Three Fiber example

```ts
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  defaultPreset: "r3f",
  presets: {
    r3f: {
      template: "react-ts",
      dependencies: {
        three: "^0.176.0",
        "@react-three/drei": "^10.0.7",
        "@react-three/fiber": "^9.1.2",
      },
      devDependencies: {
        "@types/three": "^0.176.0",
      },
      entry: "/index.tsx",
      files: {
        "/index.tsx": {
          source: "./sandpack/r3f/index.tsx",
          hidden: true,
        },
        "/styles.css": {
          source: "./sandpack/r3f/styles.css",
          hidden: true,
        },
      },
    },
    physics: {
      extends: "r3f",
      dependencies: {
        "@react-three/rapier": "^2.1.0",
      },
    },
  },
});
```

Use an opening four-backtick `sandpack` fence for the R3F default, or append
`physics` after `sandpack` for the Rapier extension.
