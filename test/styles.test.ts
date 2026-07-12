import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("sandpack layout styles", () => {
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
