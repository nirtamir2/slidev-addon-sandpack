import { describe, expect, expectTypeOf, it } from "vitest";
import { defineSandpackConfig } from "../src/index";
import type { SandpackPresetFile } from "../src/index";

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
