import type { VitePluginsSetup } from "@slidev/types";
import type { Plugin, ViteDevServer } from "vite";
import { isWatchedFile, subscribeToWatchedFiles } from "./watch.js";

interface SandpackServerAdapter {
  add: (files: Array<string>) => void;
  on: (
    event: "change",
    handler: (file: string) => Promise<void> | void,
  ) => void;
  off: (
    event: "change",
    handler: (file: string) => Promise<void> | void,
  ) => void;
  restart: () => Promise<void>;
}

export function configureSandpackServer(
  server: SandpackServerAdapter,
): () => void {
  const state: { restart?: Promise<void> } = {};
  const handleChange = async (file: string): Promise<void> => {
    if (!isWatchedFile(file)) return;
    state.restart ??= server.restart().finally(() => {
      delete state.restart;
    });
    await state.restart;
  };
  const unsubscribe = subscribeToWatchedFiles((files) => server.add(files));
  server.on("change", handleChange);

  return () => {
    unsubscribe();
    server.off("change", handleChange);
  };
}

function adaptViteServer(server: ViteDevServer): SandpackServerAdapter {
  return {
    add: (files) => server.watcher.add(files),
    on: (event, handler) => server.watcher.on(event, handler),
    off: (event, handler) => server.watcher.off(event, handler),
    restart: () => server.restart(),
  };
}

export function createSandpackVitePlugin(): Plugin {
  return {
    name: "slidev-addon-sandpack",
    config: () => ({ resolve: { dedupe: ["react", "react-dom"] } }),
    configureServer(server) {
      const dispose = configureSandpackServer(adaptViteServer(server));
      server.httpServer?.once("close", dispose);
    },
  };
}

const setup: VitePluginsSetup = () => [createSandpackVitePlugin()];

export default setup;
