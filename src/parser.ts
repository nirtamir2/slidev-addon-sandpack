import MarkdownIt from "markdown-it";
import { normalizeSandpackPath } from "./paths.js";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

const FENCE_NAME = "sandpack";
const MIN_OUTER_FENCE_LENGTH = 4;
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
    code: token.content,
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

function parseOuterFence(
  token: MarkdownToken,
  demoIndex: number,
  sourceLines: Array<string>,
): ParsedSandpackDemo {
  if (!token.map) throw parserError(demoIndex, 0, "Fence has no source map.");
  const [startLine, endLine] = token.map;
  if (token.markup[0] !== "`" || token.markup.length < MIN_OUTER_FENCE_LENGTH)
    throw parserError(
      demoIndex,
      startLine,
      "Open Sandpack demos with at least four backticks.",
    );

  const closingLine = sourceLines[endLine - 1]?.trimStart() ?? "";
  const closingFence = /^(`+)\s*$/.exec(closingLine)?.[1];
  if (!closingFence || closingFence.length < token.markup.length)
    throw parserError(
      demoIndex,
      startLine,
      `Demo is missing its closing ${token.markup} line.`,
    );

  const presetName = token.info.slice(FENCE_NAME.length).trim() || undefined;
  if (presetName && !PRESET_NAME.test(presetName))
    throw parserError(
      demoIndex,
      startLine,
      `Preset name ${JSON.stringify(presetName)} may contain only letters, digits, underscores, and hyphens.`,
    );

  const contentStartLine = startLine + 1;
  const tokens = new MarkdownIt({ html: true }).parse(token.content, {});
  for (const child of tokens) {
    if (child.map)
      child.map = child.map.map((line) => line + contentStartLine) as [
        number,
        number,
      ];
  }
  const steps = parseSteps({
    demoIndex,
    endIndex: tokens.length,
    fallbackLine: endLine - 1,
    startIndex: 0,
    tokens,
  });

  return {
    endLine,
    presetName,
    startLine,
    steps,
  };
}

export function parseSandpackDemos(source: string): Array<ParsedSandpackDemo> {
  const tokens = new MarkdownIt({ html: true }).parse(source, {});
  const sourceLines = source.split("\n");
  const demos: Array<ParsedSandpackDemo> = [];

  for (const token of tokens) {
    if (token.type !== "fence") continue;
    const fenceName = token.info.trim().split(/\s+/, 1)[0];
    if (fenceName !== FENCE_NAME) continue;
    demos.push(parseOuterFence(token, demos.length, sourceLines));
  }

  return demos;
}
