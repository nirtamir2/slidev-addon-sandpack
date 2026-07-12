// eslint-disable-next-line workspaces/no-absolute-imports -- The example verifies the package's public consumer import.
import { defineSandpackConfig } from "slidev-addon-sandpack";

export default defineSandpackConfig({
  defaultPreset: "react-ts",
  presets: {
    starter: {
      template: "react-ts",
      dependencies: {
        clsx: "^2.1.1",
      },
      entry: "/index.tsx",
      files: {
        "/index.tsx": {
          source: "./templates/index.tsx",
          hidden: true,
        },
        "/styles.css": {
          source: new URL("templates/styles.css", import.meta.url),
          hidden: true,
          readOnly: true,
        },
      },
      layout: {
        editorSize: 60,
        height: "28rem",
        minHeight: "22rem",
      },
    },
  },
});
