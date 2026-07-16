import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "slidev-addon-sandpack-pack-"),
);
const consumerDirectory = path.join(temporaryDirectory, "consumer");
const requiredFiles = [
  "package/CHANGELOG.md",
  "package/LICENSE",
  "package/README.md",
  "package/components/SandpackLiveDemo.vue",
  "package/dist/index.d.ts",
  "package/dist/index.js",
  "package/dist/renderer.js",
  "package/docs/presets.md",
  "package/setup/preparser.ts",
  "package/setup/vite-plugins.ts",
  "package/styles/sandpack.css",
];
const forbiddenPrefixes = [
  "package/example/",
  "package/example-dist/",
  "package/src/",
  "package/test/",
];

function run(command, arguments_, options = {}) {
  return execFileSync(command, arguments_, {
    cwd: options.cwd ?? packageDirectory,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
}

try {
  run("pnpm", ["run", "build"]);
  const packOutput = run(
    "npm",
    ["pack", "--json", "--pack-destination", temporaryDirectory],
    { capture: true },
  );
  const [packResult] = JSON.parse(packOutput);
  if (!packResult?.filename)
    throw new Error("npm pack did not return a tarball.");
  const packedFiles = new Set(
    packResult.files.map(({ path: file }) => `package/${file}`),
  );

  for (const file of requiredFiles) {
    if (!packedFiles.has(file))
      throw new Error(`Packed artifact is missing ${file}.`);
  }
  for (const file of packedFiles) {
    if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))
      throw new Error(`Packed artifact contains forbidden file ${file}.`);
  }

  const tarball = path.join(temporaryDirectory, packResult.filename);
  const slidevVersion = process.env.SLIDEV_VERSION ?? "52.1.0";
  const reactVersion = process.env.REACT_VERSION ?? "19.2.1";
  writeFileSync(
    path.join(temporaryDirectory, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@slidev/cli": slidevVersion,
          "@slidev/theme-default": "^0.25.0",
          react: reactVersion,
          "react-dom": reactVersion,
          "slidev-addon-sandpack": `file:${tarball}`,
          vue: "^3.5.22",
        },
      },
      null,
      2,
    ),
  );
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: temporaryDirectory,
  });

  const slides = `---
theme: default
addons:
  - slidev-addon-sandpack
---

# Packed addon smoke test

\`\`\`\`sandpack

\`\`\`tsx [App.tsx]
export default function App() {
  return <h1>Packed addon works</h1>;
}
\`\`\`

\`\`\`\`
`;
  writeFileSync(path.join(temporaryDirectory, "slides.md"), slides);
  run(
    path.join(temporaryDirectory, "node_modules", ".bin", "slidev"),
    ["build", "slides.md", "--out", consumerDirectory],
    { cwd: temporaryDirectory },
  );

  const builtHtml = readFileSync(
    path.join(consumerDirectory, "index.html"),
    "utf8",
  );
  if (!builtHtml.includes("<!DOCTYPE html>"))
    throw new Error(
      "The isolated Slidev build did not produce its entry HTML.",
    );

  console.log(
    `Packed ${packedFiles.size} files and built an isolated Slidev ${slidevVersion} / React ${reactVersion} consumer.`,
  );
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
