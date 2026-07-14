import { describe, expect, it } from "vitest";
import { compileSandpackSlide } from "../src/compiler";

const source = `Before\n\n\`\`\`\`sandpack react-ts\n\n\`\`\`tsx [App.tsx]\nexport default () => <h1>One</h1>\n\`\`\`\n\n\`\`\`\`\n\nBetween\n\n\`\`\`\`sandpack vanilla\n\n\`\`\`js [index.js]\nconsole.log('two')\n\`\`\`\n\n\`\`\`\`\n\nAfter`;

describe("compileSandpackSlide", () => {
  it("stores resolved demos in frontmatter and replaces only source ranges", async () => {
    const frontmatter: Record<string, unknown> = { layout: "default" };

    const result = await compileSandpackSlide(source, frontmatter, {
      config: {},
      configFile: new URL("fixtures/sandpack.config.ts", import.meta.url),
    });

    expect(result.content).toBe(
      'Before\n\n<SandpackLiveDemo :demo="$frontmatter._sandpackDemos[0]" />\n\nBetween\n\n<SandpackLiveDemo :demo="$frontmatter._sandpackDemos[1]" />\n\nAfter',
    );
    expect(result.content).not.toContain("blocksContent");
    expect(result.content).not.toContain("&quot;");
    expect(frontmatter.layout).toBe("default");
    expect(frontmatter._sandpackDemos).toMatchObject([
      { presetName: "react-ts", steps: [{ activeFile: "/App.tsx" }] },
      { presetName: "vanilla", steps: [{ activeFile: "/index.js" }] },
    ]);
  });

  it("returns unchanged content and frontmatter when no demo exists", async () => {
    const frontmatter: Record<string, unknown> = { layout: "cover" };

    const result = await compileSandpackSlide("# Plain slide", frontmatter, {
      config: {},
      configFile: new URL("fixtures/sandpack.config.ts", import.meta.url),
    });

    expect(result).toEqual({ content: "# Plain slide", sourceFiles: [] });
    expect(frontmatter).toEqual({ layout: "cover" });
  });

  it("rejects a user-owned internal frontmatter key", async () => {
    const frontmatter = { _sandpackDemos: [] };

    await expect(
      compileSandpackSlide(source, frontmatter, {
        config: {},
        configFile: new URL("fixtures/sandpack.config.ts", import.meta.url),
      }),
    ).rejects.toThrow(
      "[slidev-addon-sandpack] Frontmatter key `_sandpackDemos` is reserved by the addon.",
    );
  });
});
