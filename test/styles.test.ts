import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("sandpack layout styles", () => {
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
