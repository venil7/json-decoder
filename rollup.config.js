import ts from "rollup-plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    format: "cjs",
    file: "build/bundle.js",
    sourcemap: true
  },
  plugins: [ts()]
};
