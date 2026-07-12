import { readFile } from "node:fs/promises";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { parseSandpackDemos } from "../src/parser";

const fixtureUrl = new URL("fixtures/demo.md", import.meta.url);

describe("parseSandpackDemos", () => {
  it("parses named/default demos, steps, files, paths, and active files", async () => {
    const source = await readFile(fixtureUrl, "utf8");

    const demos = parseSandpackDemos(source);

    expect(demos).toHaveLength(2);
    expect(demos[0]).toMatchObject({
      presetName: "physics",
      startLine: 2,
      steps: [
        {
          activeFile: "/App.tsx",
          files: [
            {
              path: "/App.tsx",
              language: "tsx",
              code: expect.stringContaining("First"),
            },
          ],
        },
        {
          activeFile: "/components/Card component.tsx",
          files: [
            {
              path: "/components/Card component.tsx",
              language: "tsx",
            },
            {
              path: "/App.tsx",
              code: "@@@\n<!-- sandpack:step -->\n",
            },
          ],
        },
      ],
    });
    expect(demos[1]).toMatchObject({
      presetName: undefined,
      steps: [{ activeFile: "/index.ts", files: [{ path: "/index.ts" }] }],
    });
  });

  it("reports exact line ranges so replacement preserves surrounding Markdown", async () => {
    const source = await readFile(fixtureUrl, "utf8");
    const lines = source.split("\n");
    const demos = parseSandpackDemos(source);

    for (const [index, demo] of demos.toReversed().entries()) {
      lines.splice(
        demo.startLine,
        demo.endLine - demo.startLine,
        `DEMO_${demos.length - index - 1}`,
      );
    }

    expect(lines.join("\n")).toBe(
      "Before the demo.\n\nDEMO_0\n\nBetween demos.\n\nDEMO_1\n\nAfter the demos.\n",
    );
  });

  it("keeps the step comment stable through Slidev formatting", async () => {
    const source = `@@@\n\n\`\`\`tsx [App.tsx]\nexport default 1\n\`\`\`\n\n<!-- sandpack:step -->\n\n~~~tsx [App.tsx]\nexport default 2\n~~~\n\n@@@\n`;

    const formatted = await format(source, {
      parser: "slidev",
      plugins: ["prettier-plugin-slidev"],
    });

    expect(formatted).toContain("<!-- sandpack:step -->");
    expect(formatted).not.toContain("\n---\n");
    expect(
      await format(formatted, {
        parser: "slidev",
        plugins: ["prettier-plugin-slidev"],
      }),
    ).toBe(formatted);
  });

  it.each([
    ["unclosed container", "@@@\n\n```ts [a.ts]\na\n```\n"],
    ["nested container", "@@@\n\n@@@@ nested\n@@@@\n\n@@@\n"],
    ["empty demo", "@@@\n@@@\n"],
    [
      "empty first step",
      "@@@\n<!-- sandpack:step -->\n```ts [a.ts]\na\n```\n@@@\n",
    ],
    [
      "empty later step",
      "@@@\n```ts [a.ts]\na\n```\n<!-- sandpack:step -->\n@@@\n",
    ],
    ["missing filename", "@@@\n```ts\na\n```\n@@@\n"],
    [
      "duplicate canonical filename",
      "@@@\n```ts [a.ts]\na\n```\n```ts [/a.ts]\nb\n```\n@@@\n",
    ],
    ["unexpected prose", "@@@\nThis is not a file.\n@@@\n"],
    ["invalid preset name", "@@@ two words\n```ts [a.ts]\na\n```\n@@@\n"],
  ])("rejects %s", (_name, source) => {
    expect(() => parseSandpackDemos(source)).toThrow(
      /^\[slidev-addon-sandpack]/,
    );
  });
});
