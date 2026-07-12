declare module "markdown-it-container" {
  import type MarkdownIt from "markdown-it";

  interface ContainerOptions {
    marker?: string;
    validate?: (params: string) => boolean;
  }

  const markdownItContainer: (
    markdown: MarkdownIt,
    name: string,
    options?: ContainerOptions,
  ) => void;

  export default markdownItContainer;
}
