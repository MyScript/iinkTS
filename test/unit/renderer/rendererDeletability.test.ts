import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Each canvas variant must own its renderer, so that deleting the variant is deleting one folder.
 *
 * `InkCanvasDeprecated` and `InteractiveInkSSRCanvas` cannot be removed yet — that is a product
 * decision, not a technical one — so the next best thing is to make their removal mechanical rather
 * than an archaeology exercise. `renderer/canvas/` goes with the deprecated variant,
 * `renderer/ssr/` with the SSR one, and `renderer/svg/` plus `renderer/base/` are what the two
 * modern canvases share.
 *
 * What this catches is the direction that would break it: a shared renderer reaching into a
 * variant-specific one. The other direction is fine — `ssr/` may use `base/`, and does not.
 */
const RENDERER = join(__dirname, "..", "..", "..", "src", "renderer")

/** Folders every variant shares, and which therefore may not depend on any single variant's. */
const SHARED = ["svg", "base"]
/** Folders that die with exactly one variant. */
const VARIANT_ONLY = ["canvas", "ssr"]

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? filesIn(full) : full.endsWith(".ts") ? [full] : []
  })
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf-8")
  return [...text.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1])
}

describe("renderer deletability", () => {
  test.each(SHARED)("the shared %s renderer should not depend on a variant-only one", (shared) => {
    const offenders = filesIn(join(RENDERER, shared)).flatMap((file) =>
      importsOf(file)
        .filter((spec) => VARIANT_ONLY.some((v) => spec.includes(`renderer/${v}`) || spec.startsWith(`../${v}/`)))
        .map((spec) => `${relative(RENDERER, file)} -> ${spec}`)
    )
    // Named, not counted: a failure has to say which file reached where.
    expect(offenders).toEqual([])
  })

  test("the two variant-only folders should not depend on each other", () => {
    const offenders = VARIANT_ONLY.flatMap((from) =>
      filesIn(join(RENDERER, from)).flatMap((file) =>
        importsOf(file)
          .filter((spec) =>
            VARIANT_ONLY.filter((v) => v !== from).some(
              (other) => spec.includes(`renderer/${other}`) || spec.startsWith(`../${other}/`)
            )
          )
          .map((spec) => `${relative(RENDERER, file)} -> ${spec}`)
      )
    )
    expect(offenders).toEqual([])
  })

  test("both variant-only folders should still exist", () => {
    // Guards the guard: if a folder disappeared, every assertion above would pass over nothing.
    VARIANT_ONLY.forEach((v) => expect(filesIn(join(RENDERER, v)).length).toBeGreaterThan(0))
  })
})
