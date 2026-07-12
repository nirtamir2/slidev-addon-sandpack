import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSandpackConfig } from "../src/config";

const temporaryDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("loadSandpackConfig", () => {
  it("loads a TypeScript default export without retaining a module cache", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "slidev-sandpack-"));
    temporaryDirectories.push(directory);
    const configFile = path.join(directory, "sandpack.config.ts");
    await writeFile(configFile, 'export default { defaultPreset: "react" }');

    expect(await loadSandpackConfig(configFile)).toEqual({
      defaultPreset: "react",
    });

    await writeFile(configFile, 'export default { defaultPreset: "vue" }');

    expect(await loadSandpackConfig(configFile)).toEqual({
      defaultPreset: "vue",
    });
  });

  it("rejects a non-object default export with an addon-prefixed error", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "slidev-sandpack-"));
    temporaryDirectories.push(directory);
    const configFile = path.join(directory, "sandpack.config.ts");
    await writeFile(configFile, "export default 'invalid'");

    await expect(loadSandpackConfig(configFile)).rejects.toThrow(
      /^\[slidev-addon-sandpack] sandpack\.config\.ts must default-export an object\./,
    );
  });
});
