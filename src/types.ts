import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

export interface SandpackConfig {
  defaultPreset?: string;
  presets?: Record<string, SandpackPreset>;
}

export interface SandpackPreset {
  extends?: string;
  template?: SandpackPredefinedTemplate;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: Record<string, SandpackPresetFile>;
  entry?: string;
  layout?: SandpackLayoutOptions;
}

export interface SandpackLayoutOptions {
  editorSize?: number;
  previewSize?: number;
  defaultMode?: "edit" | "read";
  height?: string;
  minHeight?: string;
}

interface SandpackPresetFileMetadata {
  hidden?: boolean;
  readOnly?: boolean;
}

export type SandpackPresetFile =
  | string
  | (SandpackPresetFileMetadata & {
      code: string;
      source?: never;
    })
  | (SandpackPresetFileMetadata & {
      code?: never;
      source: string | URL;
    });

export interface SandpackDemoFile {
  code: string;
  hidden?: boolean;
  readOnly?: boolean;
  language?: string;
}

export interface SandpackDemoStep {
  files: Record<string, SandpackDemoFile>;
  activeFile: string;
}

export interface ResolvedSandpackLayout {
  editorSize: number;
  previewSize: number;
  defaultMode: "edit" | "read";
  height: string;
  minHeight: string;
}

export interface SandpackDemo {
  presetName: string;
  template: SandpackPredefinedTemplate;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  entry?: string;
  layout: ResolvedSandpackLayout;
  steps: Array<SandpackDemoStep>;
}

/**
 * Defines a typed deck-level Sandpack configuration without changing it.
 */
export function defineSandpackConfig<const Config extends SandpackConfig>(
  config: Config,
): Config {
  return config;
}

export type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
