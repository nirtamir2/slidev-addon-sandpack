import { describe, expect, it } from "vitest";
import { parseSandpackDemos } from "../src/parser";
import { resolveSandpackDemo } from "../src/presets";
import type { SandpackConfig } from "../src/types";

const configFile = new URL("fixtures/sandpack.config.ts", import.meta.url);

function parseDemo(preset = "physics") {
  const [demo] = parseSandpackDemos(
    `\`\`\`\`sandpack ${preset}\n\n\`\`\`tsx [App.tsx]\nexport default function App() { return <main>one</main> }\n\`\`\`\n\n<!-- sandpack:step -->\n\n\`\`\`tsx [Card.tsx]\nexport const Card = () => <article>card</article>\n\`\`\`\n\n\`\`\`tsx [App.tsx]\nimport { Card } from './Card'\nexport default function App() { return <Card /> }\n\`\`\`\n\n\`\`\`\`\n`,
  );
  if (!demo) throw new Error("Expected a parsed demo fixture.");
  return demo;
}

describe("resolveSandpackDemo", () => {
  it("resolves inheritance, source files, layout, and inherited authored steps", async () => {
    const config = {
      defaultPreset: "base",
      presets: {
        base: {
          template: "react-ts",
          dependencies: { three: "^0.176.0" },
          devDependencies: { "@types/three": "^0.176.0" },
          entry: "/setup.tsx",
          files: {
            "/setup.tsx": {
              source: new URL("fixtures/setup.tsx", import.meta.url),
              hidden: true,
            },
            "/styles.css": {
              source: "./preset.css",
              hidden: true,
              readOnly: true,
            },
            "/App.tsx": { code: "preset app", hidden: true, readOnly: true },
          },
          layout: { editorSize: 65, minHeight: "24rem" },
        },
        physics: {
          extends: "base",
          dependencies: { "@react-three/rapier": "^2.1.0" },
          layout: { defaultMode: "read" },
        },
      },
    } satisfies SandpackConfig;

    const { demo, sourceFiles } = await resolveSandpackDemo(
      parseDemo(),
      config,
      { configFile },
    );

    expect(demo).toMatchObject({
      presetName: "physics",
      template: "react-ts",
      dependencies: {
        three: "^0.176.0",
        "@react-three/rapier": "^2.1.0",
      },
      devDependencies: { "@types/three": "^0.176.0" },
      entry: "/setup.tsx",
      layout: {
        editorSize: 65,
        previewSize: 35,
        defaultMode: "read",
        height: "100%",
        minHeight: "24rem",
      },
    });
    expect(demo.steps[0]?.files["/styles.css"]).toMatchObject({
      code: expect.stringContaining("#root"),
      hidden: true,
      readOnly: true,
    });
    expect(demo.steps[0]?.files["/App.tsx"]).toEqual({
      code: expect.stringContaining("one"),
      language: "tsx",
    });
    expect(demo.steps[1]?.files["/Card.tsx"]).toMatchObject({
      code: expect.stringContaining("card"),
    });
    expect(demo.steps[1]?.files["/styles.css"]).toEqual(
      demo.steps[0]?.files["/styles.css"],
    );
    expect(sourceFiles).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/preset\.css$/),
        expect.stringMatching(/setup\.tsx$/),
      ]),
    );
  });

  it("allows a Sandpack built-in template as the selected preset", async () => {
    const { demo } = await resolveSandpackDemo(
      parseDemo("vanilla-ts"),
      {},
      {
        configFile,
      },
    );

    expect(demo.presetName).toBe("vanilla-ts");
    expect(demo.template).toBe("vanilla-ts");
  });

  it("retains a deck-level custom theme in the resolved demo", async () => {
    const theme = {
      colors: { accent: "rebeccapurple" },
      syntax: { tag: "#006400" },
    };

    const { demo } = await resolveSandpackDemo(
      parseDemo("react-ts"),
      { theme } satisfies SandpackConfig,
      { configFile },
    );

    expect(demo.theme).toEqual(theme);
  });

  it("defaults the resolved theme to auto", async () => {
    const { demo } = await resolveSandpackDemo(
      parseDemo("react-ts"),
      {},
      { configFile },
    );

    expect(demo.theme).toBe("auto");
  });

  it.each([
    {
      name: "unknown theme string",
      parsed: parseDemo("react-ts"),
      config: { theme: "amethyst" },
      message:
        /^\[slidev-addon-sandpack] Sandpack theme must be "auto", "light", "dark", or a custom theme object\.$/,
    },
    {
      name: "array theme",
      parsed: parseDemo("react-ts"),
      config: { theme: [] },
      message:
        /^\[slidev-addon-sandpack] Sandpack theme must be "auto", "light", "dark", or a custom theme object\.$/,
    },
    {
      name: "unknown preset",
      parsed: parseDemo("missing"),
      config: {},
      message: /Unknown preset "missing"/,
    },
    {
      name: "cyclic inheritance",
      parsed: parseDemo("a"),
      config: { presets: { a: { extends: "b" }, b: { extends: "a" } } },
      message: /Cyclic preset inheritance: a -> b -> a/,
    },
    {
      name: "invalid dependency",
      parsed: parseDemo("bad"),
      config: { presets: { bad: { dependencies: { react: "" } } } },
      message: /Dependency "react" must have a non-empty version/,
    },
    {
      name: "invalid panel total",
      parsed: parseDemo("bad"),
      config: {
        presets: { bad: { layout: { editorSize: 70, previewSize: 40 } } },
      },
      message: /must total 100/,
    },
    {
      name: "invalid CSS length",
      parsed: parseDemo("bad"),
      config: {
        presets: { bad: { layout: { height: "calc(100%); color: red" } } },
      },
      message: /valid CSS length/,
    },
    {
      name: "missing custom entry",
      parsed: parseDemo("bad"),
      config: { presets: { bad: { entry: "/missing.tsx" } } },
      message: /Entry file "\/missing\.tsx" is missing from step 1/,
    },
    {
      name: "ambiguous file descriptor",
      parsed: parseDemo("bad"),
      config: {
        presets: {
          bad: { files: { "/x.ts": { code: "x", source: "./x.ts" } } },
        },
      },
      message: /exactly one of `code` and `source`/,
    },
    {
      name: "remote source URL",
      parsed: parseDemo("bad"),
      config: {
        presets: {
          bad: {
            files: { "/x.ts": { source: new URL("https://example.com/x") } },
          },
        },
      },
      message: /Only file: URLs are supported/,
    },
  ])("rejects $name", async ({ parsed, config, message }) => {
    await expect(
      resolveSandpackDemo(parsed, config as SandpackConfig, { configFile }),
    ).rejects.toThrow(message);
  });
});
