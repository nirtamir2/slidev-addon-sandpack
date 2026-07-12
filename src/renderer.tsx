import { Component, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions -- The section only stops events after its native controls and CodeMirror handle them. */
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import "../styles/sandpack.css";
import type { SandpackDemo } from "./types.js";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class SandpackErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError)
      return (
        <div className="slidev-sandpack__error" role="alert">
          This live demo could not be rendered.
        </div>
      );
    return this.props.children;
  }
}

function stopKeyboardPropagation(event: KeyboardEvent<HTMLElement>): void {
  event.stopPropagation();
}

function SandpackDemoContent({ demo }: { demo: SandpackDemo }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(
    demo.layout.defaultMode === "edit",
  );
  const lastStepIndex = demo.steps.length - 1;
  const currentStepIndex = Math.min(stepIndex, lastStepIndex);
  const step = demo.steps[currentStepIndex];
  if (!step) throw new Error("Sandpack demos require at least one step.");

  const visibleFiles = Object.entries(step.files)
    .filter(([, file]) => !file.hidden)
    .map(([path]) => path);
  const customSetup = {
    dependencies: demo.dependencies,
    devDependencies: demo.devDependencies,
    ...(demo.entry === undefined ? {} : { entry: demo.entry }),
  };
  const style = {
    "--slidev-sandpack-editor-size": String(demo.layout.editorSize),
    "--slidev-sandpack-preview-size": String(demo.layout.previewSize),
    height: demo.layout.height,
    minHeight: demo.layout.minHeight,
  } as CSSProperties;

  const goBack = (): void => {
    setStepIndex((current) => Math.max(0, current - 1));
  };
  const goNext = (): void => {
    setStepIndex((current) => Math.min(lastStepIndex, current + 1));
  };
  const toggleEditing = (): void => {
    setIsEditing((current) => !current);
  };

  return (
    <section
      aria-label="Live code demo"
      className="slidev-sandpack"
      style={style}
      onKeyDown={stopKeyboardPropagation}
      onKeyUp={stopKeyboardPropagation}
    >
      <div
        aria-label="Live code controls"
        className="slidev-sandpack__controls"
        role="group"
      >
        <button
          aria-label="Previous step"
          disabled={currentStepIndex === 0}
          type="button"
          onClick={goBack}
        >
          Previous
        </button>
        <span aria-atomic="true" aria-live="polite" role="status">
          Step {currentStepIndex + 1} of {demo.steps.length}
        </span>
        <button
          aria-label="Next step"
          disabled={currentStepIndex === lastStepIndex}
          type="button"
          onClick={goNext}
        >
          Next
        </button>
        <button
          aria-label={isEditing ? "Use read-only mode" : "Enable editing"}
          aria-pressed={isEditing}
          type="button"
          onClick={toggleEditing}
        >
          {isEditing ? "Editing" : "Read only"}
        </button>
      </div>

      <SandpackProvider
        key={currentStepIndex}
        customSetup={customSetup}
        files={step.files}
        options={{
          activeFile: step.activeFile,
          initMode: "user-visible",
          visibleFiles,
        }}
        template={demo.template}
        theme="auto"
      >
        <SandpackLayout className="slidev-sandpack__workspace">
          <SandpackCodeEditor
            readOnly={!isEditing}
            showInlineErrors
            showLineNumbers
            showReadOnly
            showTabs
            wrapContent
          />
          <SandpackPreview
            className="slidev-sandpack__preview"
            showOpenInCodeSandbox={false}
            showRefreshButton
            showSandpackErrorOverlay
          />
        </SandpackLayout>
      </SandpackProvider>
    </section>
  );
}

export function SandpackDemoRenderer({ demo }: { demo: SandpackDemo }) {
  return (
    <SandpackErrorBoundary>
      <SandpackDemoContent demo={demo} />
    </SandpackErrorBoundary>
  );
}

/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
