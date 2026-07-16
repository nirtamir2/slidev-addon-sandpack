// @vitest-environment jsdom
import { useContext, useState } from "react";
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SandpackDemoRenderer } from "../src/renderer";
import type { SandpackDemo } from "../src/types";

vi.mock("@codesandbox/sandpack-react", async () => {
  const React = await import("react");
  interface MockContextValue {
    activeCode: string;
    files: Record<string, { code: string }>;
  }
  const MockContext = React.createContext<MockContextValue | undefined>(
    undefined,
  );

  return {
    SandpackProvider({
      children,
      customSetup,
      files,
      options,
      template,
      theme,
    }: {
      children: ReactNode;
      customSetup: unknown;
      files: Record<string, { code: string }>;
      options: { activeFile: string };
      template: string;
      theme: unknown;
    }) {
      const [activeCode, setActiveCode] = useState(
        files[options.activeFile]?.code ?? "",
      );
      return (
        <MockContext.Provider value={{ activeCode, files }}>
          <section
            data-testid="provider"
            data-custom-setup={JSON.stringify(customSetup)}
            data-files={JSON.stringify(files)}
            data-options={JSON.stringify(options)}
            data-template={template}
            data-theme={JSON.stringify(theme)}
          >
            <label>
              Mock active code
              <input
                aria-label="Mock active code"
                value={activeCode}
                onChange={(event) => setActiveCode(event.target.value)}
              />
            </label>
            {children}
          </section>
        </MockContext.Provider>
      );
    },
    SandpackLayout({ children }: { children: ReactNode }) {
      return <div data-testid="layout">{children}</div>;
    },
    SandpackCodeEditor({ readOnly }: { readOnly: boolean }) {
      return <div data-read-only={String(readOnly)} data-testid="editor" />;
    },
    SandpackPreview() {
      const context = useContext(MockContext);
      if (context?.activeCode.includes("THROW_RENDERER"))
        throw new Error("Mock preview failed");
      return <div data-testid="preview" />;
    },
  };
});

function createDemo(overrides: Partial<SandpackDemo> = {}): SandpackDemo {
  return {
    dependencies: { react: "^19.0.0" },
    devDependencies: { "@types/react": "^19.0.0" },
    entry: "/index.tsx",
    layout: {
      defaultMode: "read",
      editorSize: 65,
      height: "100%",
      minHeight: "360px",
      previewSize: 35,
    },
    presetName: "react-ts",
    steps: [
      {
        activeFile: "/App.tsx",
        files: {
          "/App.tsx": { code: "step one", language: "tsx" },
          "/index.tsx": { code: "entry", hidden: true },
        },
      },
      {
        activeFile: "/App.tsx",
        files: {
          "/App.tsx": { code: "step two", language: "tsx" },
          "/index.tsx": { code: "entry", hidden: true },
        },
      },
    ],
    template: "react-ts",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("sandpack demo renderer", () => {
  it("passes the resolved project contract to Sandpack", () => {
    render(<SandpackDemoRenderer demo={createDemo()} />);

    const provider = screen.getByTestId("provider");
    expect(
      JSON.parse(
        provider.attributes.getNamedItem("data-custom-setup")?.value ?? "{}",
      ),
    ).toEqual({
      dependencies: { react: "^19.0.0" },
      devDependencies: { "@types/react": "^19.0.0" },
      entry: "/index.tsx",
    });
    expect(
      JSON.parse(
        provider.attributes.getNamedItem("data-options")?.value ?? "{}",
      ),
    ).toMatchObject({
      activeFile: "/App.tsx",
      visibleFiles: ["/App.tsx"],
    });
    expect(provider).toHaveAttribute("data-template", "react-ts");
    expect(
      JSON.parse(provider.attributes.getNamedItem("data-theme")?.value ?? ""),
    ).toBe("dark");
    expect(screen.getByTestId("editor")).toHaveAttribute(
      "data-read-only",
      "true",
    );
  });

  it("passes a custom theme object to Sandpack unchanged", () => {
    const theme = {
      colors: { accent: "rebeccapurple" },
      syntax: { tag: "#006400" },
    };

    render(<SandpackDemoRenderer demo={createDemo({ theme })} />);

    const provider = screen.getByTestId("provider");
    expect(
      JSON.parse(provider.attributes.getNamedItem("data-theme")?.value ?? ""),
    ).toEqual(theme);
  });

  it("exposes stable hooks and mirrored state on addon-owned controls", async () => {
    const user = userEvent.setup();
    render(<SandpackDemoRenderer demo={createDemo()} />);

    const controls = screen.getByRole("group", {
      name: "Live code controls",
    });
    const previous = screen.getByRole("button", { name: "Previous step" });
    const next = screen.getByRole("button", { name: "Next step" });
    const mode = screen.getByRole("button", { name: "Enable editing" });
    const status = screen.getByRole("status");

    expect(controls).toHaveClass("slidev-sandpack__controls");
    expect(controls).toHaveAttribute("data-slidev-sandpack-part", "controls");
    expect(controls).toHaveAttribute("data-slidev-sandpack-state", "read-only");
    expect(previous).toHaveClass(
      "slidev-sandpack__control-button",
      "slidev-sandpack__control-button--previous",
    );
    expect(previous).toHaveAttribute(
      "data-slidev-sandpack-part",
      "control-button",
    );
    expect(previous).toHaveAttribute(
      "data-slidev-sandpack-action",
      "previous-step",
    );
    expect(previous).toHaveAttribute("data-slidev-sandpack-state", "disabled");
    expect(next).toHaveClass(
      "slidev-sandpack__control-button",
      "slidev-sandpack__control-button--next",
    );
    expect(next).toHaveAttribute("data-slidev-sandpack-action", "next-step");
    expect(next).toHaveAttribute("data-slidev-sandpack-state", "enabled");
    expect(mode).toHaveClass(
      "slidev-sandpack__control-button",
      "slidev-sandpack__control-button--mode",
    );
    expect(mode).toHaveAttribute("data-slidev-sandpack-action", "toggle-edit");
    expect(mode).toHaveAttribute("data-slidev-sandpack-state", "read-only");
    expect(status).toHaveClass("slidev-sandpack__step-status");
    expect(status).toHaveAttribute("data-slidev-sandpack-part", "step-status");
    expect(status).toHaveAttribute("data-slidev-sandpack-step", "1");
    expect(status).toHaveAttribute("data-slidev-sandpack-step-count", "2");

    await user.click(next);
    expect(previous).toHaveAttribute("data-slidev-sandpack-state", "enabled");
    expect(next).toHaveAttribute("data-slidev-sandpack-state", "disabled");
    expect(status).toHaveAttribute("data-slidev-sandpack-step", "2");

    await user.click(mode);
    expect(controls).toHaveAttribute("data-slidev-sandpack-state", "editing");
    expect(mode).toHaveAttribute("data-slidev-sandpack-state", "editing");
  });

  it("navigates within boundaries and restores canonical step snapshots", async () => {
    const user = userEvent.setup();
    render(<SandpackDemoRenderer demo={createDemo()} />);

    const previous = screen.getByRole("button", { name: "Previous step" });
    const next = screen.getByRole("button", { name: "Next step" });
    expect(previous).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Step 1 of 2");

    await user.clear(screen.getByRole("textbox", { name: "Mock active code" }));
    await user.type(
      screen.getByRole("textbox", { name: "Mock active code" }),
      "live edit",
    );
    await user.click(next);
    expect(
      screen.getByRole("textbox", { name: "Mock active code" }),
    ).toHaveValue("step two");
    expect(next).toBeDisabled();

    await user.click(previous);
    expect(
      screen.getByRole("textbox", { name: "Mock active code" }),
    ).toHaveValue("step one");
  });

  it("navigates steps with scoped modifier-arrow shortcuts", () => {
    const parentKeyDown = vi.fn();
    render(<SandpackDemoRenderer demo={createDemo()} />);
    document.body.addEventListener("keydown", parentKeyDown);

    const previous = screen.getByRole("button", { name: "Previous step" });
    const next = screen.getByRole("button", { name: "Next step" });
    const mode = screen.getByRole("button", { name: "Enable editing" });
    const status = screen.getByRole("status");
    expect(previous).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+ArrowLeft Control+ArrowLeft",
    );
    expect(next).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+ArrowRight Control+ArrowRight",
    );

    const nextEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
      metaKey: true,
    });
    fireEvent(mode, nextEvent);
    expect(nextEvent).toHaveProperty("defaultPrevented", true);
    expect(status).toHaveTextContent("Step 2 of 2");

    const previousEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: "ArrowLeft",
    });
    fireEvent(mode, previousEvent);
    expect(previousEvent).toHaveProperty("defaultPrevented", true);
    expect(status).toHaveTextContent("Step 1 of 2");

    const boundaryEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowLeft",
      metaKey: true,
    });
    fireEvent(mode, boundaryEvent);
    expect(boundaryEvent).toHaveProperty("defaultPrevented", true);
    expect(status).toHaveTextContent("Step 1 of 2");
    expect(parentKeyDown).not.toHaveBeenCalled();
    document.body.removeEventListener("keydown", parentKeyDown);
  });

  it("ignores unmodified, ambiguous, and out-of-scope arrow keys", () => {
    render(<SandpackDemoRenderer demo={createDemo()} />);

    const mode = screen.getByRole("button", { name: "Enable editing" });
    const status = screen.getByRole("status");
    for (const eventInit of [
      { key: "ArrowRight" },
      { key: "ArrowRight", metaKey: true, shiftKey: true },
      { altKey: true, ctrlKey: true, key: "ArrowRight" },
      { ctrlKey: true, key: "ArrowRight", metaKey: true },
    ]) {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...eventInit,
      });
      fireEvent(mode, event);
      expect(event).toHaveProperty("defaultPrevented", false);
      expect(status).toHaveTextContent("Step 1 of 2");
    }

    const editorEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
      metaKey: true,
    });
    fireEvent(screen.getByTestId("editor"), editorEvent);
    expect(editorEvent).toHaveProperty("defaultPrevented", false);
    expect(status).toHaveTextContent("Step 1 of 2");
  });

  it("toggles edit mode and isolates keyboard events from Slidev", async () => {
    const user = userEvent.setup();
    const parentKeyDown = vi.fn();
    render(<SandpackDemoRenderer demo={createDemo()} />);
    document.body.addEventListener("keydown", parentKeyDown);

    await user.click(screen.getByRole("button", { name: "Enable editing" }));
    expect(screen.getByTestId("editor")).toHaveAttribute(
      "data-read-only",
      "false",
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Next step" }), {
      key: "ArrowRight",
    });
    expect(parentKeyDown).not.toHaveBeenCalled();
    document.body.removeEventListener("keydown", parentKeyDown);
  });

  it("contains renderer failures without breaking the slide", () => {
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    const demo = createDemo({
      steps: [
        {
          activeFile: "/App.tsx",
          files: { "/App.tsx": { code: "THROW_RENDERER" } },
        },
      ],
    });

    render(<SandpackDemoRenderer demo={demo} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This live demo could not be rendered.",
    );
  });
});
