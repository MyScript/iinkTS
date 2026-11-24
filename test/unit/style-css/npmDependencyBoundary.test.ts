import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

/**
 * `json-css` is the library's only runtime npm dependency, and `src/style-css/` is the only place
 * allowed to reach for it. Everything else must stay installable with no dependencies at all, which
 * is what lets the client run in Node and what keeps the modern canvases free of a CSS parser they
 * never use.
 *
 * This is asserted here rather than with an eslint rule on purpose. Five folders already declare
 * their own `no-restricted-imports` block, and in flat config a later block matching the same file
 * replaces the rule rather than adding to it — so a broad `src/**` ban would silently disable the
 * layer boundaries of `core`, `dom`, `ui`, `symbol`, `model`, `renderer` and the canvas. A
 * filesystem assertion has no such semantics to get wrong.
 */
const SRC = join(__dirname, "..", "..", "..", "src")
const ALLOWED = join("style-css", "StyleHelper.ts")
/** The ambient module declaration, which is what makes the import typecheck at all. */
const AMBIENT = "modules.d.ts"

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? sourceFiles(full) : full.endsWith(".ts") ? [full] : []
  })
}

describe("runtime npm dependency boundary", () => {
  const importers = sourceFiles(SRC)
    .filter((file) => /^\s*import\s.*"json-css"/m.test(readFileSync(file, "utf-8")))
    .map((file) => relative(SRC, file))

  test("should keep json-css confined to src/style-css", () => {
    // Named rather than counted: a failure has to say which file reached for the parser.
    expect(importers.filter((file) => file !== ALLOWED && file !== AMBIENT)).toEqual([])
  })

  test("should still have the one importer it is allowed", () => {
    // Guards the guard: if `StyleHelper` stopped importing it, this test would pass vacuously and
    // stop protecting anything.
    expect(importers).toContain(ALLOWED)
  })

  test("should declare no other runtime dependency in package.json", () => {
    const manifest = JSON.parse(
      readFileSync(join(__dirname, "..", "..", "..", "package.json"), "utf-8")
    ) as { dependencies?: Record<string, string> }
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(["json-css"])
  })

  test("should not reach for it from any folder above style-css", () => {
    const above = importers.filter((file) => file.split(sep)[0] !== "style-css" && file !== AMBIENT)
    expect(above).toEqual([])
  })
})
