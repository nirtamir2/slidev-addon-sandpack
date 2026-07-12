import { describe, expect, it, vi } from "vitest";
import {
  configureSandpackServer,
  createSandpackVitePlugin,
} from "../src/vite-plugin";
import { registerWatchedFiles, resetWatchedFiles } from "../src/watch";

describe("sandpack Vite integration", () => {
  it("deduplicates the consumer's React runtime", () => {
    const plugin = createSandpackVitePlugin();

    expect(plugin.config).toEqual(expect.any(Function));
    expect((plugin.config as () => unknown)()).toEqual({
      resolve: { dedupe: ["react", "react-dom"] },
    });
  });

  it("adds newly discovered files and restarts only for watched changes", async () => {
    const handlers = new Map<string, (file: string) => Promise<void> | void>();
    const add = vi.fn();
    const restart = vi.fn(() => Promise.resolve());
    resetWatchedFiles(["/deck/sandpack.config.ts"]);

    configureSandpackServer({
      add,
      on(event, handler) {
        handlers.set(event, handler);
      },
      off: vi.fn(),
      restart,
    });

    expect(add).toHaveBeenCalledWith(["/deck/sandpack.config.ts"]);
    registerWatchedFiles(["/deck/template.tsx"]);
    expect(add).toHaveBeenCalledWith(["/deck/template.tsx"]);

    await handlers.get("change")?.("/deck/unrelated.ts");
    expect(restart).not.toHaveBeenCalled();
    await handlers.get("change")?.("/deck/template.tsx");
    expect(restart).toHaveBeenCalledOnce();
  });
});
