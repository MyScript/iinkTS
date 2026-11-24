import { readFileSync } from "fs"
import { resolve } from "path"

const PLACEHOLDER = "__IINK_VERSION__"

/**
 * Rollup plugin replacing `__IINK_VERSION__` with `package.json#version`.
 * The version lives in `package.json` only: CI writes it there, the bundle reads it from there.
 */
export default function injectVersion() {
  const { version } = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"))
  const literal = JSON.stringify(version)
  return {
    name: "inject-version",
    transform(code) {
      if (!code.includes(PLACEHOLDER)) return null
      // The replacement stays on its line, so the existing sourcemap is kept as is
      return { code: code.replaceAll(PLACEHOLDER, literal), map: null }
    }
  }
}
