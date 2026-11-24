import terser from "@rollup/plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import alias from "@rollup/plugin-alias"
import swc from "@rollup/plugin-swc"
import postcss from "rollup-plugin-postcss"
import dts from "rollup-plugin-dts"
import commonjs from "@rollup/plugin-commonjs"
import svg from "rollup-plugin-svg-import"
import webWorkerLoader from "rollup-plugin-web-worker-loader"
import injectVersion from "./rollup-plugin-version.mjs"
import { fileURLToPath } from "url"
import path from "path"

const configDir = path.dirname(fileURLToPath(import.meta.url))

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
      alias({
        entries: [
          { find: "@", replacement: path.resolve(configDir, "../src") }
        ]
      }),
      // Transpile only: types are checked by `yarn typecheck`, with TypeScript 7.
      // The plugin defaults to legacy decorators and loose mode: legacy decorators drop the class
      // fields that have no initializer, which TypeScript keeps for an ESNext target.
      swc({
        include: ["src/**/*.ts"],
        swc: {
          jsc: {
            parser: { syntax: "typescript", decorators: false },
            target: "esnext",
            loose: false,
            transform: { legacyDecorator: false, decoratorMetadata: false },
          },
        },
      }),
      injectVersion(),
      resolve({ browser: true, extensions: [".ts", ".mjs", ".js", ".json"] }),
      commonjs({
        include: ["node_modules/json-css/**"],
        defaultIsModuleExports: true
      }),
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
      alias({
        entries: [
          { find: "@", replacement: path.resolve(configDir, "../src") }
        ]
      }),
      dts({
        respectExternal: false,
      }),
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
