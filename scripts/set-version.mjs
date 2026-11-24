#!/usr/bin/env node
/**
 * Writes a version into a package.json, and nothing else.
 *
 * - `set-version.mjs <version>`: `package.json#version`. CI calls it before building, uncommitted,
 *   with the computed version or its pre-release (`-beta.<build>`, `-dev.<target>.<build>`,
 *   `-rc.<n>`). The release calls it again for the release commit on master.
 * - `set-version.mjs --examples <version>`: the exact `iink-ts` dependency of the tldraw and
 *   excalidraw examples. The release calls it once that version is on npm, never before: their
 *   lockfiles have to resolve it.
 */
import { readFileSync, writeFileSync } from "fs"
import process from "process"
import { URL } from "url"

const VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/
const EXAMPLES = [
  "../examples/custom-rendering/tldraw-websocket-client/package.json",
  "../examples/custom-rendering/excalidraw-websocket-client/package.json",
]

function update(relativePath, edit) {
  const path = new URL(relativePath, import.meta.url)
  const pkg = JSON.parse(readFileSync(path, "utf-8"))
  edit(pkg)
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
}

const args = process.argv.slice(2)
const examples = args[0] === "--examples"
const version = examples ? args[1] : args[0]
if (!VERSION.test(version ?? "")) {
  process.stderr.write(`Not a version: "${version}"\n`)
  process.exit(1)
}
if (examples) {
  EXAMPLES.forEach((path) => update(path, (pkg) => (pkg.dependencies["iink-ts"] = version)))
} else {
  update("../package.json", (pkg) => (pkg.version = version))
}
