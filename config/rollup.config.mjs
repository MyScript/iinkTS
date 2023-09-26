import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import postcss from "rollup-plugin-postcss"
import dts from "rollup-plugin-dts"
import commonjs from "rollup-plugin-commonjs"
import svg from "rollup-plugin-svg-import"

export default [
  {
    input: "src/iink.ts",
    output: [
      {
        name: "iink",
        file: "dist/iink.min.js",
        format: "umd",
        exports: "named",
      },
      {
        file: "./dist/iink.esm.js",
        format: "esm",
      },
    ],
    plugins: [
      commonjs({
        include: ["node_modules/json-css/**", "node_modules/crypto-js/**"],
      }),
      resolve(),
      typescript(),
      terser({
        keep_fnames: true,
        compress: true,
      }),
      postcss(),
      svg({ stringify: true })
    ],
  },
  {
    input: "src/iink.ts",
    plugins: [
      dts(),
      postcss({
        inject: false
      }),
    ],
    output: {
      file: `dist/iink.d.ts`,
      format: "es",
    }
  }
]
