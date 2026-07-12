import { describe, expect, it } from "vitest";
import { normalizeSandpackFileMap, normalizeSandpackPath } from "../src/paths";

describe("normalizeSandpackPath", () => {
  it.each([
    ["App.tsx", "/App.tsx"],
    ["/App.tsx", "/App.tsx"],
    ["./App.tsx", "/App.tsx"],
    ["//src///Card component.tsx", "/src/Card component.tsx"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeSandpackPath(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    ".",
    "./",
    "../App.tsx",
    "src/../App.tsx",
    "src/./App.tsx",
    String.raw`src\App.tsx`,
    "App.tsx?raw",
    "App.tsx#demo",
    "App\0.tsx",
  ])("rejects unsafe or ambiguous path %j", (input) => {
    expect(() => normalizeSandpackPath(input)).toThrow(
      /^\[slidev-addon-sandpack]/,
    );
  });
});

describe("normalizeSandpackFileMap", () => {
  it("normalizes keys without changing values", () => {
    expect(
      normalizeSandpackFileMap({
        "./App.tsx": { code: "app" },
        "src//Card.tsx": { code: "card" },
      }),
    ).toEqual({
      "/App.tsx": { code: "app" },
      "/src/Card.tsx": { code: "card" },
    });
  });

  it("rejects duplicate aliases after normalization", () => {
    expect(() =>
      normalizeSandpackFileMap({
        "App.tsx": "first",
        "/App.tsx": "second",
      }),
    ).toThrow(
      '[slidev-addon-sandpack] Duplicate file path "/App.tsx" after normalization.',
    );
  });
});
