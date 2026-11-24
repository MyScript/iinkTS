import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * One rule for how library code reaches other library code, see .local/barrel-imports/PLAN.md.
 *
 * - across folders of `src/`: only the folder barrel `@/x`
 * - inside a folder: relative paths only, and a relative path never leaves the folder
 * - `src/constants` is a leaf: it imports nothing else from `src/`
 * - unit tests reach the library only through `@/iink`
 *
 * One rule rather than more `no-restricted-imports` blocks: in a flat config a later block setting
 * the same rule replaces the earlier options for the files both match, so a `src/**` block here
 * would silently erase the layer boundaries declared per folder.
 */

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src")
const LEAF_FOLDERS = ["constants"]

function isModule(srcDir, inner) {
  const target = path.join(srcDir, inner)
  return fs.existsSync(`${target}.ts`) || fs.existsSync(path.join(target, "index.ts"))
}

function topFolder(srcDir, file) {
  const parts = path.relative(srcDir, file).split(path.sep)
  return parts.length > 1 ? parts[0] : undefined
}

function checkSrc(srcDir, file, spec) {
  const own = topFolder(srcDir, file)
  if (spec.startsWith("@/")) {
    const inner = spec.slice(2)
    const folder = inner.split("/")[0]
    if (own && LEAF_FOLDERS.includes(own)) return `\`${own}\` is a leaf and must not import from anywhere else in src/`
    if (!isModule(srcDir, inner)) return undefined // asset, stylesheet
    if (folder === own) return `inside \`${own}\`, import with a relative path, not \`${spec}\``
    if (inner.includes("/")) return `import \`@/${folder}\`, not the deep path \`${spec}\``
    return undefined
  }
  if (spec.startsWith(".") && own) {
    const target = path.relative(srcDir, path.resolve(path.dirname(file), spec)).split(path.sep)[0]
    if (target !== own) return `\`${spec}\` leaves \`${own}\`: import \`@/${target}\` instead`
  }
  return undefined
}

function checkTest(srcDir, _file, spec) {
  if (!spec.startsWith("@/") || spec === "@/iink") return undefined
  return isModule(srcDir, spec.slice(2)) ? `unit tests import the library only through \`@/iink\`, not \`${spec}\`` : undefined
}

const rule = {
  meta: {
    type: "problem",
    docs: { description: "Cross-folder imports go through the folder barrel; unit tests only through @/iink" },
    schema: [{ type: "object", properties: { mode: { enum: ["src", "test"] } }, additionalProperties: false }],
  },
  create(context) {
    const check = context.options[0]?.mode === "test" ? checkTest : checkSrc
    const visit = (node) => {
      if (!node.source) return
      const message = check(SRC_DIR, context.filename, node.source.value)
      if (message) context.report({ node: node.source, message })
    }
    return { ImportDeclaration: visit, ExportNamedDeclaration: visit, ExportAllDeclaration: visit }
  },
}

export default { rules: { "barrel-imports": rule } }
