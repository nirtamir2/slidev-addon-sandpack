/** @satisfies {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-slidev"],
  overrides: [
    {
      files: ["example/slides.md"],
      options: {
        parser: "slidev",
      },
    },
  ],
};
