import type { PreparserSetup } from "@slidev/types";
import { existsSync } from "node:fs";
import path from "node:path";
import { compileSandpackSlide } from "./compiler.js";
import { loadSandpackConfig } from "./config.js";
import type { SandpackConfig } from "./types.js";
import { registerWatchedFiles, resetWatchedFiles } from "./watch.js";

const CONFIG_FILENAME = "sandpack.config.ts";

const setup: PreparserSetup = async ({ filepath }) => {
  const configFile = path.join(path.dirname(filepath), CONFIG_FILENAME);
  resetWatchedFiles([configFile]);
  const config: SandpackConfig = existsSync(configFile)
    ? await loadSandpackConfig(configFile)
    : {};

  return [
    {
      name: "slidev-addon-sandpack",
      async transformSlide(content, frontmatter) {
        const compiled = await compileSandpackSlide(content, frontmatter, {
          config,
          configFile,
        });
        registerWatchedFiles(compiled.sourceFiles);
        return compiled.content;
      },
    },
  ];
};

export default setup;
