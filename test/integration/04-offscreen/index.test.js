const { write, waitEditorIdle, waitForEditorOffscreen, writePointers } = require("../helper")

const helloPointers = require("../strokes/hello-pointers.json")

describe("Offscreen Get Started", () => {
  beforeAll(async () => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorOffscreen(page)
    await waitEditorIdle(page)
  })

  describe("write", () => {
    beforeAll(async () => {
      await writePointers(page, helloPointers)
    })

    test("should have stroke into model.symbols", async () => {
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].pointers).toHaveLength(helloPointers.length)
    })

    test("should display stroke", async () => {
      const symbols = await page.evaluate("editor.model.symbols")
      const strokeEl = await page.waitForSelector(`#${symbols[0].id}`)
      const strokeSVG = await strokeEl.innerHTML()

      expect(strokeSVG).toContain("stroke-width=\"2\"")
      expect(strokeSVG).toContain("opacity=\"1\"")
      expect(strokeSVG).toContain("d=\"M 217 350 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0")
      expect(strokeSVG).toContain("M 218.897 349.368 L 218.227 347.924")
      expect(strokeSVG).toContain("L 316.018 331.098 L 315.43 330.71")
    })
  })


})
