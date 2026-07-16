import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("sandpack layout styles", () => {
  it("styles controls through low-specificity data hooks", async () => {
    const styles = await readFile(
      new URL("../styles/sandpack.css", import.meta.url),
      "utf8",
    );

    expect(styles).toContain(':where([data-slidev-sandpack-part="controls"])');
    expect(styles).toContain(
      'button:where([data-slidev-sandpack-part="control-button"])',
    );
    expect(styles).toContain(
      'svg:where([data-slidev-sandpack-part="control-icon"])',
    );
    expect(styles).toContain(
      ':where([data-slidev-sandpack-part="step-status"])',
    );
    expect(styles).not.toContain(".slidev-sandpack__controls");
    expect(styles).not.toContain(".slidev-sandpack__control-button");
    expect(styles).not.toContain(".slidev-sandpack__control-icon");
    expect(styles).not.toContain(".slidev-sandpack__step-status");
  });

  it("gives icon controls reliable square dimensions and padding", async () => {
    const styles = await readFile(
      new URL("../styles/sandpack.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /button:where\(\[data-slidev-sandpack-part="control-button"\]\)\s*{[^}]*display:\s*inline-grid[^}]*width:\s*1\.875rem[^}]*height:\s*1\.875rem[^}]*padding:\s*0\.375rem/,
    );
    expect(styles).toMatch(
      /svg:where\(\[data-slidev-sandpack-part="control-icon"\]\)\s*{[^}]*width:\s*1rem[^}]*height:\s*1rem[^}]*pointer-events:\s*none/,
    );
  });

  it("fills the available slide height", async () => {
    const styles = await readFile(
      new URL("../styles/sandpack.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.slidev-sandpack\s*>\s*\.sp-wrapper\s*{[^}]*display:\s*flex[^}]*min-height:\s*0[^}]*flex:\s*1/,
    );
    expect(styles).toMatch(
      /\.slidev-sandpack__workspace\s*>\s*\.sp-editor,\s*\.slidev-sandpack__workspace\s*>\s*\.sp-preview\s*{[^}]*height:\s*auto\s*!important/,
    );
  });

  it("keeps the editor and preview side by side on slide canvases", async () => {
    const styles = await readFile(
      new URL("../styles/sandpack.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.slidev-sandpack__workspace\s*{[^}]*flex-wrap:\s*nowrap/,
    );
    expect(styles).toMatch(
      /\.slidev-sandpack__workspace\s*>\s*\.sp-editor[^}]*width:\s*0/,
    );
    expect(styles).toMatch(
      /\.slidev-sandpack__workspace\s*>\s*\.sp-preview[^}]*width:\s*0/,
    );
  });
});
