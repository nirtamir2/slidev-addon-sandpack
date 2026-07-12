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
    }: {
      children: ReactNode;
      customSetup: unknown;
      files: Record<string, { code: string }>;
      options: { activeFile: string };
      template: string;
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
    expect(screen.getByTestId("editor")).toHaveAttribute(
      "data-read-only",
      "true",
    );
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
