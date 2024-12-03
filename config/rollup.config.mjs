import terser from '@rollup/plugin-terser'
import resolve from "@rollup/plugin-node-resolve"
import typescript from "rollup-plugin-typescript2"
import postcss from "rollup-plugin-postcss"
import dts from "rollup-plugin-dts"
import commonjs from "rollup-plugin-commonjs"
import svg from "rollup-plugin-svg-import"
import webWorkerLoader from 'rollup-plugin-web-worker-loader'

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
        include: ["node_modules/json-css/**"],
      }),
      resolve({ browser: true }),
      typescript(),
      terser({
        keep_fnames: true,
        compress: true,
      }),
      postcss({
        minimize: true,
        inject: false
      }),
      svg({
        stringify: true
      }),
      webWorkerLoader({ extensions: [".worker.ts"] })
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
