import livereload from "rollup-plugin-livereload"
import serve from "rollup-plugin-serve"

import config from "./rollup.config.mjs"
import generateDevEnv from "./rollup-plugin-dev-env.mjs"

const [bundle] = config
// The examples load the bundle, nothing reads the declaration file or needs it minified,
// so a rebuild skips both
const plugins = bundle.plugins.filter((plugin) => plugin.name !== "terser")
plugins.push(
  generateDevEnv(),
  serve({
    open: true,
    openPage: "/examples/index.html",
    verbose: true,
    contentBase: "",
    host: "localhost",
    port: 8000,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  }),
  livereload({
    watch: [
      "dist",
      "examples"
    ]
  })
)

export default {
  ...bundle,
  plugins,
  watch: {
    include: "src/**"
  }
}
