import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { SandpackDemoRenderer } from "./renderer.js";
import type { SandpackDemo } from "./types.js";

export interface MountedSandpackRenderer {
  render: (demo: SandpackDemo) => void;
  unmount: () => void;
}

/** Mounts the addon-owned React tree inside a Vue-managed DOM element. */
export function mountSandpackRenderer(
  element: HTMLElement,
): MountedSandpackRenderer {
  const root = createRoot(element);
  const state = { isUnmounted: false, version: 0 };

  return {
    render(demo) {
      if (state.isUnmounted)
        throw new Error("Cannot render an unmounted Sandpack demo.");
      state.version += 1;
      root.render(
        createElement(SandpackDemoRenderer, {
          demo,
          key: state.version,
        }),
      );
    },
    unmount() {
      if (state.isUnmounted) return;
      state.isUnmounted = true;
      root.unmount();
    },
  };
}
