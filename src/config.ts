import { createJiti } from "jiti";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { SandpackConfig } from "./types.js";

const ERROR_PREFIX = "[slidev-addon-sandpack]";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

/** Loads a fresh TypeScript Sandpack configuration for one Slidev run. */
export async function loadSandpackConfig(
  configFile: string,
): Promise<SandpackConfig> {
  const configUrl = pathToFileURL(configFile).href;
  const jiti = createJiti(configUrl, {
    fsCache: false,
    interopDefault: true,
    moduleCache: false,
  });

  try {
    const config = await jiti.import<unknown>(configFile, { default: true });
    if (!isObject(config))
      throw new TypeError(
        `${ERROR_PREFIX} ${path.basename(configFile)} must default-export an object.`,
      );
    return config as SandpackConfig;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(ERROR_PREFIX))
      throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${ERROR_PREFIX} Failed to load ${path.basename(configFile)}: ${message}`,
      { cause: error },
    );
  }
}
