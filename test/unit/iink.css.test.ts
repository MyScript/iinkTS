import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The stylesheet is asserted as text: jsdom computes no paint, so what a rule does to the GPU can
 * only be guarded by what the rule declares.
 */
const CSS = readFileSync(join(__dirname, "..", "..", "src", "iink.css"), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "")

type TRule = { selector: string; body: string }

function rules(): TRule[] {
  return [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }))
}

function rulesFor(className: string): TRule[] {
  return rules().filter((r) => r.selector.includes(`.${className}`))
}

describe("iink.css", () => {
  test("should not paint selected or erased symbols with a CSS filter", () => {
    // Chrome rasterizes a filtered SVG element on the GPU; on some drivers that left a ghost, broken
    // copy of the ink next to a selection, gone once hardware acceleration was turned off
    const painted = [...rulesFor("ms-selected"), ...rulesFor("ms-deleting")]
    expect(painted.length).toBeGreaterThan(0)
    painted.forEach((rule) => expect(rule.body).not.toMatch(/(^|[;\s])filter\s*:/))
  })

  test("should outline a selected stroke with a stroke painted under its fill", () => {
    const outline = rulesFor("ms-selected").find((r) => r.selector.includes('[type="stroke"]'))
    expect(outline?.body).toMatch(/stroke\s*:\s*var\(--ms-ink-selection-color\)/)
    expect(outline?.body).toMatch(/paint-order\s*:\s*stroke/)
  })

  test("should colour the halo the renderer draws under a selected shape or edge", () => {
    const halo = rulesFor("ms-selection-halo")
    expect(halo.some((r) => /stroke\s*:\s*var\(--ms-ink-selection-color\)/.test(r.body))).toBe(true)
    halo.forEach((rule) => expect(rule.body).not.toMatch(/(^|[;\s])filter\s*:/))
  })

  test("should fade an erased symbol with opacity", () => {
    const fade = rulesFor("ms-deleting")
    expect(fade.some((r) => /(^|[;\s])opacity\s*:\s*0?\.25/.test(r.body))).toBe(true)
  })
})
