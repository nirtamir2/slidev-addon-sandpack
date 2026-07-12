import { parseSandpackDemos } from "./parser.js";
import { resolveSandpackDemo } from "./presets.js";
import type { ResolveSandpackOptions } from "./presets.js";
import type { SandpackConfig, SandpackDemo } from "./types.js";

const ERROR_PREFIX = "[slidev-addon-sandpack]";
const FRONTMATTER_KEY = "_sandpackDemos";
const LESS_THAN = String.fromCodePoint(60);

export interface CompiledSandpackSlide {
  content: string;
  sourceFiles: Array<string>;
}

function componentReference(index: number): string {
  return `${LESS_THAN}SandpackLiveDemo :demo="$frontmatter.${FRONTMATTER_KEY}[${index}]" />`;
}

interface CompileSandpackOptions extends ResolveSandpackOptions {
  config: SandpackConfig;
}

export async function compileSandpackSlide(
  content: string,
  frontmatter: Record<string, unknown>,
  options: CompileSandpackOptions,
): Promise<CompiledSandpackSlide> {
  const parsedDemos = parseSandpackDemos(content);
  if (parsedDemos.length === 0) return { content, sourceFiles: [] };
  if (Object.hasOwn(frontmatter, FRONTMATTER_KEY))
    throw new Error(
      `${ERROR_PREFIX} Frontmatter key \`${FRONTMATTER_KEY}\` is reserved by the addon.`,
    );

  const resolved = await Promise.all(
    parsedDemos.map((parsed) =>
      resolveSandpackDemo(parsed, options.config, options),
    ),
  );
  const demos: Array<SandpackDemo> = resolved.map(({ demo }) => demo);
  frontmatter[FRONTMATTER_KEY] = demos;

  const lines = content.split("\n");
  const ranges = parsedDemos
    .map((demo, index) => ({ demo, index }))
    .toReversed();
  for (const { demo, index } of ranges) {
    lines.splice(
      demo.startLine,
      demo.endLine - demo.startLine,
      componentReference(index),
    );
  }

  return {
    content: lines.join("\n"),
    sourceFiles: [
      ...new Set(resolved.flatMap(({ sourceFiles }) => sourceFiles)),
    ],
  };
}
