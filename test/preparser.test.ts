import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import preparser from "../src/preparser";
import { getWatchedFiles } from "../src/watch";

describe("sandpack Slidev preparser", () => {
  it("uses Slidev's async transformSlide contract and registers its config", async () => {
    const slidesFile = fileURLToPath(
      new URL("fixtures/slides.md", import.meta.url),
    );
    const [extension] = await preparser({
      filepath: slidesFile,
      headmatter: {},
      mode: "build",
    });
    const frontmatter: Record<string, unknown> = {};
    const content = `@@@\n\n\`\`\`tsx [App.tsx]\nexport default 1\n\`\`\`\n\n@@@`;

    expect(extension?.name).toBe("slidev-addon-sandpack");
    expect(await extension?.transformSlide?.(content, frontmatter)).toContain(
      "SandpackLiveDemo",
    );
    expect(frontmatter._sandpackDemos).toHaveLength(1);
    expect(getWatchedFiles()).toContain(
      path.join(path.dirname(slidesFile), "sandpack.config.ts"),
    );
  });
});
