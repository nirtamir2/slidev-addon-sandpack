import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("published runtime dependencies", () => {
  it("does not load Slidev's type-only tooling at runtime", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const emittedSetups = await Promise.all(
      ["preparser.js", "vite-plugin.js"].map((file) =>
        readFile(new URL(`../dist/${file}`, import.meta.url), "utf8"),
      ),
    );

    expect(packageJson.dependencies).not.toHaveProperty("@slidev/types");
    expect(packageJson.devDependencies).toHaveProperty("@slidev/types");
    expect(emittedSetups.join("\n")).not.toContain("@slidev/types");
  });
});
