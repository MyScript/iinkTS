import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import postcss from "rollup-plugin-postcss"
import dts from "rollup-plugin-dts"
import commonjs from "rollup-plugin-commonjs"
import replace from "@rollup/plugin-replace"

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
      replace({
        preventAssignment: true,
        values: {
          __packageName__: process.env.npm_package_name,
          __buildVersion__: process.env.npm_package_version
        }
      })
    ],
  },
  {
    input: "src/iink.ts",
    plugins: [
      dts(),
      postcss({
        inject: false
      }),
      replace({
        preventAssignment: true,
        values: {
          __packageName__: process.env.npm_package_name,
          __buildVersion__: process.env.npm_package_version
        }
      })
    ],
    output: {
      file: `dist/iink.d.ts`,
      format: "es",
    },
  },
]
