import { describe, expect, expectTypeOf, it } from "vitest";
import { defineSandpackConfig } from "../src/index";
import type { SandpackPresetFile, SandpackThemeProp } from "../src/index";

describe("defineSandpackConfig", () => {
  it("preserves literal preset inference and returns the same object", () => {
    const config = defineSandpackConfig({
      defaultPreset: "r3f",
      presets: {
        r3f: {
          template: "react-ts",
          dependencies: { three: "^0.176.0" },
          files: {
            "/index.tsx": {
              source: new URL("fixture.tsx", import.meta.url),
              hidden: true,
            },
          },
        },
      },
    });

    expect(config.defaultPreset).toBe("r3f");
    expectTypeOf(config.presets.r3f.template).toEqualTypeOf<"react-ts">();
    expectTypeOf(
      config.presets.r3f.dependencies.three,
    ).toEqualTypeOf<"^0.176.0">();
  });

  it("models inline, source-backed, and shorthand files", () => {
    const files = [
      "export default 1",
      { code: "export default 2", readOnly: true },
      { source: "./App.tsx", hidden: true },
      { source: new URL("App.tsx", import.meta.url) },
    ] satisfies Array<SandpackPresetFile>;

    expect(files).toHaveLength(4);
  });

  it("models built-in and partial custom Sandpack themes", () => {
    const customTheme = {
      colors: { accent: "rebeccapurple" },
      syntax: { tag: "#006400" },
    } satisfies SandpackThemeProp;
    const builtIn = defineSandpackConfig({ theme: "dark" });
    const custom = defineSandpackConfig({ theme: customTheme });

    expectTypeOf(builtIn.theme).toEqualTypeOf<"dark">();
    expect(custom.theme).toBe(customTheme);
  });
});

// @ts-expect-error A preset file must choose code or source, never both.
const invalidFile: SandpackPresetFile = { code: "x", source: "./x.ts" };
void invalidFile;

defineSandpackConfig({
  presets: {
    invalid: {
      // @ts-expect-error Sandpack template names are a closed public union.
      template: "not-a-sandpack-template",
    },
  },
});

defineSandpackConfig({
  // @ts-expect-error Sandpack theme strings are a closed public union.
  theme: "amethyst",
});
