// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DefineComponent } from "vue";
import SandpackLiveDemo from "../components/SandpackLiveDemo.vue";
import type { SandpackDemo } from "../src/types";

const TypedSandpackLiveDemo = SandpackLiveDemo as unknown as DefineComponent<{
  demo: SandpackDemo;
}>;

const rootMocks = vi.hoisted(() => ({
  createRoot: vi.fn(),
  render: vi.fn(),
  unmount: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: rootMocks.createRoot,
}));

function createDemo(code: string): SandpackDemo {
  return {
    dependencies: {},
    devDependencies: {},
    layout: {
      defaultMode: "edit",
      editorSize: 65,
      height: "100%",
      minHeight: "360px",
      previewSize: 35,
    },
    presetName: "react-ts",
    steps: [
      {
        activeFile: "/App.tsx",
        files: { "/App.tsx": { code } },
      },
    ],
    template: "react-ts",
  };
}

afterEach(() => {
  rootMocks.createRoot.mockReset();
  rootMocks.render.mockReset();
  rootMocks.unmount.mockReset();
});

describe("sandpack Vue bridge", () => {
  it("mounts, updates, and unmounts one React root", async () => {
    rootMocks.createRoot.mockReturnValue({
      render: rootMocks.render,
      unmount: rootMocks.unmount,
    });
    const firstDemo = createDemo("first");
    const wrapper = mount(TypedSandpackLiveDemo, {
      props: { demo: firstDemo },
    });

    expect(rootMocks.createRoot).toHaveBeenCalledOnce();
    expect(rootMocks.render).toHaveBeenCalledOnce();
    expect(rootMocks.render.mock.calls[0]?.[0]).toMatchObject({
      props: { demo: firstDemo },
    });

    const secondDemo = createDemo("second");
    await wrapper.setProps({ demo: secondDemo });
    expect(rootMocks.createRoot).toHaveBeenCalledOnce();
    expect(rootMocks.render).toHaveBeenCalledTimes(2);
    expect(rootMocks.render.mock.calls[1]?.[0]).toMatchObject({
      props: { demo: secondDemo },
    });

    wrapper.unmount();
    expect(rootMocks.unmount).toHaveBeenCalledOnce();
  });
});
