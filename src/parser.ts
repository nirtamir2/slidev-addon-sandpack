import MarkdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import { normalizeSandpackPath } from "./paths.js";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

const CONTAINER_NAME = "sandpack";
const CONTAINER_OPEN = `container_${CONTAINER_NAME}_open`;
const CONTAINER_CLOSE = `container_${CONTAINER_NAME}_close`;
const DELIMITER = "@@@";
const STEP_MARKER = "<!-- sandpack:step -->";
const ERROR_PREFIX = "[slidev-addon-sandpack]";
const PRESET_NAME = /^[a-z\d][\w-]*$/i;
const FENCE_INFO = /^(?:(\S+)\s+)?\[([^\]\r\n]+)]\s*$/;

export interface ParsedSandpackFile {
  path: string;
  code: string;
  language: string | undefined;
}

export interface ParsedSandpackStep {
  files: Array<ParsedSandpackFile>;
  activeFile: string;
}

export interface ParsedSandpackDemo {
  presetName: string | undefined;
  steps: Array<ParsedSandpackStep>;
  startLine: number;
  endLine: number;
}

function parserError(demoIndex: number, line: number, message: string): Error {
  return new Error(
    `${ERROR_PREFIX} Demo ${demoIndex + 1}, line ${line + 1}: ${message}`,
  );
}

function createMarkdownParser(): MarkdownIt {
  return new MarkdownIt({ html: true }).use(
    markdownItContainer,
    CONTAINER_NAME,
    {
      marker: "@",
      // Parse every candidate and validate it with contextual errors ourselves.
      validate: () => true,
    },
  );
}

function findUnusedSentinel(source: string): string {
  for (let codePoint = 0xe000; codePoint <= 0xf8ff; codePoint += 1) {
    const candidate = String.fromCodePoint(codePoint);
    if (!source.includes(candidate)) return candidate;
  }

  throw new Error(
    `${ERROR_PREFIX} The slide contains every private-use character, so fenced code cannot be parsed safely.`,
  );
}

/**
 * markdown-it-container scans for its closing marker before tokenizing its
 * children. A first Markdown-it pass gives us the real fence ranges so an
 * `@@@` line inside code cannot terminate the surrounding demo.
 */
function maskFencedCode(source: string): {
  maskedSource: string;
  sentinel: string;
} {
  const sentinel = findUnusedSentinel(source);
  const lines = source.split("\n");
  const baseTokens = new MarkdownIt({ html: true }).parse(source, {});

  for (const token of baseTokens) {
    if (token.type !== "fence" || !token.map) continue;

    const [startLine, endLine] = token.map;
    for (let line = startLine + 1; line < endLine; line += 1) {
      const value = lines[line];
      if (value?.includes("@")) lines[line] = value.replaceAll("@", sentinel);
    }
  }

  return { maskedSource: lines.join("\n"), sentinel };
}

function findContainerClose(
  tokens: Array<MarkdownToken>,
  openIndex: number,
  demoIndex: number,
): number {
  for (let index = openIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (token.type === CONTAINER_OPEN)
      throw parserError(
        demoIndex,
        token.map?.[0] ?? 0,
        "Nested Sandpack containers are not supported.",
      );
    if (token.type === CONTAINER_CLOSE) return index;
  }

  const open = tokens[openIndex];
  throw parserError(
    demoIndex,
    open?.map?.[0] ?? 0,
    `Container is missing its closing ${DELIMITER} line.`,
  );
}

function parseFenceInfo(
  token: MarkdownToken,
  demoIndex: number,
): { path: string; language: string | undefined } {
  const match = FENCE_INFO.exec(token.info.trim());
  if (!match)
    throw parserError(
      demoIndex,
      token.map?.[0] ?? 0,
      "Every code fence must use `[filename]`, for example `tsx [App.tsx]`.",
    );

  const rawPath = match[2]?.trim();
  if (!rawPath)
    throw parserError(
      demoIndex,
      token.map?.[0] ?? 0,
      "Code-fence filenames cannot be empty.",
    );

  try {
    return {
      language: match[1],
      path: normalizeSandpackPath(rawPath),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw parserError(
      demoIndex,
      token.map?.[0] ?? 0,
      message.replace(`${ERROR_PREFIX} `, ""),
    );
  }
}

interface ValidatedContainer {
  presetName: string | undefined;
  startLine: number;
  closeLine: number;
}

function validateContainer(
  open: MarkdownToken | undefined,
  close: MarkdownToken | undefined,
  demoIndex: number,
): ValidatedContainer {
  if (!open?.map)
    throw parserError(demoIndex, 0, "Container has no source map.");
  if (open.markup !== DELIMITER)
    throw parserError(
      demoIndex,
      open.map[0],
      `Use exactly ${DELIMITER} to open a Sandpack demo.`,
    );
  if (!close?.markup)
    throw parserError(
      demoIndex,
      open.map[0],
      `Container is missing its closing ${DELIMITER} line.`,
    );
  if (close.markup !== DELIMITER)
    throw parserError(
      demoIndex,
      open.map[1],
      `Use exactly ${DELIMITER} to close a Sandpack demo.`,
    );

  const presetName = open.info.trim() || undefined;
  if (presetName && !PRESET_NAME.test(presetName))
    throw parserError(
      demoIndex,
      open.map[0],
      `Preset name ${JSON.stringify(presetName)} may contain only letters, digits, underscores, and hyphens.`,
    );

  return {
    closeLine: open.map[1],
    presetName,
    startLine: open.map[0],
  };
}

interface StepState {
  steps: Array<ParsedSandpackStep>;
  files: Array<ParsedSandpackFile>;
  filePaths: Set<string>;
}

function finishStep(state: StepState, demoIndex: number, line: number): void {
  const activeFile = state.files[0]?.path;
  if (!activeFile)
    throw parserError(
      demoIndex,
      line,
      "Every step must contain at least one code fence.",
    );
  state.steps.push({ activeFile, files: state.files });
  state.files = [];
  state.filePaths = new Set<string>();
}

interface ContentTokenContext {
  demoIndex: number;
  fallbackLine: number;
  sentinel: string;
}

function addFence(
  state: StepState,
  token: MarkdownToken,
  context: ContentTokenContext,
): void {
  const { language, path } = parseFenceInfo(token, context.demoIndex);
  if (state.filePaths.has(path))
    throw parserError(
      context.demoIndex,
      token.map?.[0] ?? context.fallbackLine,
      `Duplicate file path ${JSON.stringify(path)} in one step.`,
    );
  state.filePaths.add(path);
  state.files.push({
    code: token.content.replaceAll(context.sentinel, "@"),
    language,
    path,
  });
}

function handleHtmlBlock(
  state: StepState,
  token: MarkdownToken,
  context: ContentTokenContext,
): boolean {
  if (token.type !== "html_block") return false;

  const content = token.content.trim();
  if (content === STEP_MARKER) {
    finishStep(
      state,
      context.demoIndex,
      token.map?.[0] ?? context.fallbackLine,
    );
    return true;
  }

  return content.startsWith("<!--") && content.endsWith("-->");
}

interface ParseStepsOptions extends ContentTokenContext {
  tokens: Array<MarkdownToken>;
  startIndex: number;
  endIndex: number;
}

function parseSteps(options: ParseStepsOptions): Array<ParsedSandpackStep> {
  const state: StepState = {
    filePaths: new Set<string>(),
    files: [],
    steps: [],
  };

  for (let index = options.startIndex; index < options.endIndex; index += 1) {
    const token = options.tokens[index];
    if (!token) continue;

    if (token.type === "fence") {
      addFence(state, token, options);
      continue;
    }
    if (handleHtmlBlock(state, token, options)) continue;

    throw parserError(
      options.demoIndex,
      token.map?.[0] ?? options.fallbackLine,
      "Only fenced files, blank lines, and Markdown comments are allowed inside a Sandpack demo.",
    );
  }

  finishStep(state, options.demoIndex, options.fallbackLine);
  return state.steps;
}

interface ParseContainerOptions {
  tokens: Array<MarkdownToken>;
  openIndex: number;
  closeIndex: number;
  demoIndex: number;
  sentinel: string;
}

function parseContainer(options: ParseContainerOptions): ParsedSandpackDemo {
  const open = options.tokens[options.openIndex];
  const close = options.tokens[options.closeIndex];
  const { closeLine, presetName, startLine } = validateContainer(
    open,
    close,
    options.demoIndex,
  );
  const steps = parseSteps({
    demoIndex: options.demoIndex,
    endIndex: options.closeIndex,
    fallbackLine: closeLine,
    sentinel: options.sentinel,
    startIndex: options.openIndex + 1,
    tokens: options.tokens,
  });

  return {
    endLine: closeLine + 1,
    presetName,
    startLine,
    steps,
  };
}

export function parseSandpackDemos(source: string): Array<ParsedSandpackDemo> {
  const { maskedSource, sentinel } = maskFencedCode(source);
  const tokens = createMarkdownParser().parse(maskedSource, {});
  const demos: Array<ParsedSandpackDemo> = [];

  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token?.type !== CONTAINER_OPEN) {
      index += 1;
      continue;
    }

    const closeIndex = findContainerClose(tokens, index, demos.length);
    demos.push(
      parseContainer({
        closeIndex,
        demoIndex: demos.length,
        openIndex: index,
        sentinel,
        tokens,
      }),
    );
    index = closeIndex + 1;
  }

  return demos;
}
