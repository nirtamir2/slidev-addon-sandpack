import { SANDBOX_TEMPLATES } from "@codesandbox/sandpack-react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ParsedSandpackDemo } from "./parser.js";
import { normalizeSandpackFileMap, normalizeSandpackPath } from "./paths.js";
import type {
  ResolvedSandpackLayout,
  SandpackConfig,
  SandpackDemo,
  SandpackDemoFile,
  SandpackLayoutOptions,
  SandpackPredefinedTemplate,
  SandpackPreset,
  SandpackPresetFile,
} from "./types.js";

const ERROR_PREFIX = "[slidev-addon-sandpack]";
const DEFAULT_TEMPLATE: SandpackPredefinedTemplate = "react-ts";
const CSS_LENGTH = /^(?:0|\d+(?:\.\d+)?(?:%|ch|em|ex|px|rem|vh|vmax|vmin|vw))$/;

interface MergedPreset {
  template: SandpackPredefinedTemplate;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  files: Record<string, SandpackPresetFile>;
  entry: string | undefined;
  layout: SandpackLayoutOptions;
}

export interface ResolveSandpackOptions {
  configFile: string | URL;
}

export interface ResolvedSandpackDemo {
  demo: SandpackDemo;
  sourceFiles: Array<string>;
}

function presetError(message: string): Error {
  return new Error(`${ERROR_PREFIX} ${message}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isBuiltinTemplate(name: string): name is SandpackPredefinedTemplate {
  return Object.hasOwn(SANDBOX_TEMPLATES, name);
}

function emptyPreset(template: SandpackPredefinedTemplate): MergedPreset {
  return {
    dependencies: {},
    devDependencies: {},
    entry: undefined,
    files: {},
    layout: {},
    template,
  };
}

function mergeStringMap(
  parent: Record<string, string>,
  value: unknown,
  label: string,
): Record<string, string> {
  if (value === undefined) return { ...parent };
  if (!isObject(value)) throw presetError(`${label} must be an object.`);

  const entries = Object.entries(value).map(([name, version]) => {
    if (!name.trim() || typeof version !== "string" || !version.trim())
      throw presetError(
        `${label === "dependencies" ? "Dependency" : "Dev dependency"} ${JSON.stringify(name)} must have a non-empty version.`,
      );
    return [name, version] as const;
  });
  return Object.fromEntries([...Object.entries(parent), ...entries]);
}

function mergeFiles(
  parent: Record<string, SandpackPresetFile>,
  value: unknown,
): Record<string, SandpackPresetFile> {
  if (value === undefined) return { ...parent };
  if (!isObject(value)) throw presetError("Preset files must be an object.");

  try {
    return {
      ...parent,
      ...normalizeSandpackFileMap(value as Record<string, SandpackPresetFile>),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw presetError(message.replace(`${ERROR_PREFIX} `, ""));
  }
}

function mergeLayout(
  parent: SandpackLayoutOptions,
  value: unknown,
): SandpackLayoutOptions {
  if (value === undefined) return { ...parent };
  if (!isObject(value)) throw presetError("Preset layout must be an object.");
  return { ...parent, ...(value as SandpackLayoutOptions) };
}

function mergePreset(
  parent: MergedPreset,
  preset: SandpackPreset,
): MergedPreset {
  const {
    dependencies: parentDependencies,
    devDependencies: parentDevDependencies,
    files: parentFiles,
    layout: parentLayout,
  } = parent;
  const {
    dependencies,
    devDependencies,
    entry: presetEntry,
    files,
    layout,
    template: presetTemplate,
  } = preset;
  let { template } = parent;
  if (presetTemplate !== undefined) {
    if (!isBuiltinTemplate(presetTemplate))
      throw presetError(
        `Unknown Sandpack template ${JSON.stringify(presetTemplate)}.`,
      );
    template = presetTemplate;
  }

  let { entry } = parent;
  if (presetEntry !== undefined) {
    if (typeof presetEntry !== "string")
      throw presetError("Preset entry must be a string.");
    entry = normalizeSandpackPath(presetEntry);
  }

  return {
    dependencies: mergeStringMap(
      parentDependencies,
      dependencies,
      "dependencies",
    ),
    devDependencies: mergeStringMap(
      parentDevDependencies,
      devDependencies,
      "devDependencies",
    ),
    entry,
    files: mergeFiles(parentFiles, files),
    layout: mergeLayout(parentLayout, layout),
    template,
  };
}

function getCustomPreset(config: SandpackConfig, name: string): SandpackPreset {
  const { presets } = config;
  if (presets !== undefined && !isObject(presets))
    throw presetError("`presets` must be an object.");
  const preset: unknown = presets?.[name];
  if (!isObject(preset))
    throw presetError(`Unknown preset ${JSON.stringify(name)}.`);
  return preset as SandpackPreset;
}

function resolvePreset(
  name: string,
  config: SandpackConfig,
  chain: Array<string> = [],
): MergedPreset {
  if (isBuiltinTemplate(name)) return emptyPreset(name);
  if (chain.includes(name))
    throw presetError(
      `Cyclic preset inheritance: ${[...chain, name].join(" -> ")}.`,
    );

  const preset = getCustomPreset(config, name);
  if (preset.extends !== undefined && typeof preset.extends !== "string")
    throw presetError(
      `Preset ${JSON.stringify(name)} has a non-string parent.`,
    );
  const nextChain = [...chain, name];
  const parent = preset.extends
    ? resolvePreset(preset.extends, config, nextChain)
    : emptyPreset(DEFAULT_TEMPLATE);
  return mergePreset(parent, preset);
}

function resolveLayout(layout: SandpackLayoutOptions): ResolvedSandpackLayout {
  const editorSize =
    layout.editorSize ??
    (layout.previewSize === undefined ? 65 : 100 - layout.previewSize);
  const previewSize = layout.previewSize ?? 100 - editorSize;

  if (
    !Number.isFinite(editorSize) ||
    !Number.isFinite(previewSize) ||
    editorSize <= 0 ||
    previewSize <= 0 ||
    editorSize >= 100 ||
    previewSize >= 100
  )
    throw presetError("Panel sizes must be numbers between 1 and 99.");
  if (Math.abs(editorSize + previewSize - 100) > Number.EPSILON)
    throw presetError("Editor and preview panel sizes must total 100.");

  const defaultMode = layout.defaultMode ?? "edit";
  if (defaultMode !== "edit" && defaultMode !== "read")
    throw presetError('Layout defaultMode must be either "edit" or "read".');
  const height = layout.height ?? "100%";
  const minHeight = layout.minHeight ?? "360px";
  if (typeof height !== "string" || !CSS_LENGTH.test(height))
    throw presetError(
      `Layout height ${JSON.stringify(height)} is not a valid CSS length.`,
    );
  if (typeof minHeight !== "string" || !CSS_LENGTH.test(minHeight))
    throw presetError(
      `Layout minHeight ${JSON.stringify(minHeight)} is not a valid CSS length.`,
    );

  return { defaultMode, editorSize, height, minHeight, previewSize };
}

function toConfigUrl(configFile: string | URL): URL {
  if (configFile instanceof URL) return configFile;
  return pathToFileURL(path.resolve(configFile));
}

function validateFileMetadata(descriptor: Record<string, unknown>): void {
  if (descriptor.hidden !== undefined && typeof descriptor.hidden !== "boolean")
    throw presetError("Preset file `hidden` must be a boolean.");
  if (
    descriptor.readOnly !== undefined &&
    typeof descriptor.readOnly !== "boolean"
  )
    throw presetError("Preset file `readOnly` must be a boolean.");
}

async function readPresetSource(
  source: unknown,
  configUrl: URL,
  sourceFiles: Set<string>,
): Promise<string> {
  if (typeof source !== "string" && !(source instanceof URL))
    throw presetError("Preset file `source` must be a path string or URL.");
  if (typeof source === "string" && !source.trim())
    throw presetError("Preset file `source` cannot be empty.");
  const sourceUrl = source instanceof URL ? source : new URL(source, configUrl);
  if (sourceUrl.protocol !== "file:")
    throw presetError("Only file: URLs are supported for preset sources.");

  const sourceFile = fileURLToPath(sourceUrl);
  try {
    const code = await readFile(sourceFile, "utf8");
    sourceFiles.add(sourceFile);
    return code;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw presetError(
      `Unable to read preset source ${JSON.stringify(sourceFile)}: ${message}`,
    );
  }
}

function readInlineCode(descriptor: Record<string, unknown>): string {
  const { code } = descriptor;
  if (typeof code !== "string")
    throw presetError("Preset file `code` must be a string.");
  return code;
}

async function resolvePresetFile(
  descriptor: SandpackPresetFile,
  configUrl: URL,
  sourceFiles: Set<string>,
): Promise<SandpackDemoFile> {
  if (typeof descriptor === "string") return { code: descriptor };
  if (!isObject(descriptor))
    throw presetError("Preset file descriptors must be objects or strings.");

  const hasCode = Object.hasOwn(descriptor, "code");
  const hasSource = Object.hasOwn(descriptor, "source");
  if (hasCode === hasSource)
    throw presetError(
      "A preset file must define exactly one of `code` and `source`.",
    );
  validateFileMetadata(descriptor);
  const code = hasCode
    ? readInlineCode(descriptor)
    : await readPresetSource(descriptor.source, configUrl, sourceFiles);

  return {
    code,
    ...(descriptor.hidden === undefined ? {} : { hidden: descriptor.hidden }),
    ...(descriptor.readOnly === undefined
      ? {}
      : { readOnly: descriptor.readOnly }),
  };
}

async function resolvePresetFiles(
  files: Record<string, SandpackPresetFile>,
  configUrl: URL,
  sourceFiles: Set<string>,
): Promise<Record<string, SandpackDemoFile>> {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([path, descriptor]) => [
        path,
        await resolvePresetFile(descriptor, configUrl, sourceFiles),
      ]),
    ),
  );
}

export async function resolveSandpackDemo(
  parsed: ParsedSandpackDemo,
  config: SandpackConfig,
  options: ResolveSandpackOptions,
): Promise<ResolvedSandpackDemo> {
  if (!isObject(config))
    throw presetError("Sandpack configuration must be an object.");
  if (
    config.defaultPreset !== undefined &&
    typeof config.defaultPreset !== "string"
  )
    throw presetError("`defaultPreset` must be a string.");

  const presetName =
    parsed.presetName ?? config.defaultPreset ?? DEFAULT_TEMPLATE;
  const preset = resolvePreset(presetName, config);
  const sourceFiles = new Set<string>();
  const configUrl = toConfigUrl(options.configFile);
  const presetFiles = await resolvePresetFiles(
    preset.files,
    configUrl,
    sourceFiles,
  );
  let inheritedFiles = presetFiles;
  const steps = parsed.steps.map((step, index) => {
    const files: Record<string, SandpackDemoFile> = { ...inheritedFiles };
    for (const authored of step.files) {
      files[authored.path] = {
        code: authored.code,
        ...(authored.language === undefined
          ? {}
          : { language: authored.language }),
      };
    }
    if (preset.entry && !Object.hasOwn(files, preset.entry))
      throw presetError(
        `Entry file ${JSON.stringify(preset.entry)} is missing from step ${index + 1}.`,
      );
    inheritedFiles = files;
    return { activeFile: step.activeFile, files };
  });

  return {
    demo: {
      dependencies: preset.dependencies,
      devDependencies: preset.devDependencies,
      ...(preset.entry === undefined ? {} : { entry: preset.entry }),
      layout: resolveLayout(preset.layout),
      presetName,
      steps,
      template: preset.template,
    },
    sourceFiles: [...sourceFiles],
  };
}
