import ts from "rollup-plugin-typescript";

export default {
  input: "src/decoder.ts",
  output: {
    format: "cjs",
    file: "dist/decoder.js",
    sourcemap: true
  },
  plugins: [ts()]
};
