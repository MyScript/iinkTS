const { waitEditorIdle, waitForEditorOffscreen, writeStrokes, sendAndGetExportsTypeFromEditorModel } = require("../helper")

const { helloOneStroke} = require("../strokesDatas")

describe("Offscreen Get Started", () => {
  beforeAll(async () => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorOffscreen(page)
    await waitEditorIdle(page)
  })

  describe("write", () => {
    beforeAll(async () => {
      await writeStrokes(page, helloOneStroke.strokes)
    })

    test("should have stroke into model.symbols", async () => {
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].pointers).toHaveLength(helloOneStroke.strokes[0].pointers.length)
    })

    test("should display stroke", async () => {
      const symbols = await page.evaluate("editor.model.symbols")
      const strokeEl = await page.waitForSelector(`#${symbols[0].id}`)
      const strokeSVG = await strokeEl.innerHTML()

      expect(strokeSVG).toContain("stroke-width=\"2\"")
      expect(strokeSVG).toContain("opacity=\"1\"")
      expect(strokeSVG).toContain("d=\"M 335 229 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0")
      expect(strokeSVG).toContain("M 336.414 230.414 L 338.723 227.723")
      expect(strokeSVG).toContain("L 336.277 225.277 L 333.586 227.586")
    })

    test("should have the same text result before and after convert", async () => {
      const jiixBeforeConvert = await sendAndGetExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
      expect(jiixBeforeConvert).toBeDefined()
      expect(jiixBeforeConvert.elements).toBeDefined()
      expect(jiixBeforeConvert.elements).toHaveLength(1)
      expect(jiixBeforeConvert.elements[0].type).toStrictEqual("Text")
      const textBeforeConvert = jiixBeforeConvert.elements[0].label
      expect(textBeforeConvert).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)

      /******better use the convert button instead of the function editor.convert() cf. IIC-1217*/
      //const convertBtn = await page.locator("#ms-menu-action-convert")
      //expect(await convertBtn.isVisible()).toBe(true)
      await page.evaluate('editor.convert()')  
      const symbols = await page.evaluate("editor.model.symbols")
      const textId = symbols[0].id
      const textEl = await page.waitForSelector(`#${textId}`)
      expect(await textEl.textContent()).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label) 
    })
  })
})
