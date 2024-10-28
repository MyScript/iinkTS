const { waitEditorIdle, waitForEditorOffscreen, writePointers, writeStrokes, sendAndGetExportsTypeFromEditorModel, getExportsTypeFromEditorModel } = require("../helper")

const { helloOneStroke, laLecon, helloStrikeStroke, helloOneSurrounded } = require("../strokesDatas")

describe("Offscreen Get Started", () => {
  beforeAll(async () => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorOffscreen(page)
    await waitEditorIdle(page)
  })

  describe("write", () => {
    const colors = [
      {"color":"blue", "rgb":"0000ff"},
      {"color":"green", "rgb":"00ff00"},
      {"color":"red", "rgb":"ff0000"},
      {"color":"black", "rgb":"000000"},
    ]
    colors.forEach(async (color) => {
      describe(`color: `+ color.color + ` rgb: ` + color.rgb, () => {
        test("should have the correct color", async () => {
          //clear the editor before changing the color
          await page.evaluate("editor.clear()")
          const symbols = await page.evaluate("editor.model.symbols")
          expect(symbols).toHaveLength(0)

          const colorsBtn = await page.locator("#ms-menu-style-color")
          expect(await colorsBtn.isVisible()).toBe(true)
          await colorsBtn.click()

          const selectedColorBtn = await page.locator("#ms-menu-style-color-" + color.rgb + "-btn")
          expect(await selectedColorBtn.isVisible()).toBe(true)
          await selectedColorBtn.click()
          
          await writeStrokes(page, helloOneStroke.strokes)

          const symbolsAfterColor = await page.evaluate("editor.model.symbols")
          const styleEl = symbolsAfterColor[0].style 
          expect(styleEl.color).toStrictEqual("#" + color.rgb)
          expect(styleEl.width).toStrictEqual(2)
          expect(styleEl.opacity).toStrictEqual(1)
          expect(styleEl.fill).toStrictEqual("transparent")
        })
      })
    })

    const thicknesses = [
      {"size":"S", "width":1},
      {"size":"M", "width":2},
      {"size":"L", "width":4},
      {"size":"XL", "width":8}
    ]
    thicknesses.forEach(async (thickness) => {
      describe(`thickness size: `+ thickness.size + ` width: ` + thickness.width, () => {
        test("should have the correct thickness" , async () => {
          //clear the editor before changing the thickness
          await page.evaluate("editor.clear()")
          const symbols = await page.evaluate("editor.model.symbols")
          expect(symbols).toHaveLength(0)

          const thicknessBtn = await page.locator("#ms-menu-style-thickness")
          expect(await thicknessBtn.isVisible()).toBe(true)
          await thicknessBtn.click()

          let ThicknessSelected = await page.locator("#ms-menu-style-thickness-" + thickness.size + "-btn")
          expect(await ThicknessSelected.isVisible()).toBe(true)
          await ThicknessSelected.click()
          
          await writeStrokes(page, helloOneStroke.strokes)

          const symbolsAfterColor = await page.evaluate("editor.model.symbols")
          const styleEl = symbolsAfterColor[0].style 
          expect(styleEl.color).toStrictEqual("#000000")
          expect(styleEl.width).toStrictEqual(thickness.width)
          expect(styleEl.opacity).toStrictEqual(1)
          expect(styleEl.fill).toStrictEqual("transparent")

          //reinit the thickness for the next tests
          ThicknessSelected = await page.locator("#ms-menu-style-thickness-M-btn")
          expect(await ThicknessSelected.isVisible()).toBe(true)
          await ThicknessSelected.click()
        })
      })
    })

    const fontSizes = [
      //{"size":"Auto", "pixels":34},
      {"size":"S", "pixels":25},
      {"size":"M", "pixels":37.5},
      {"size":"L", "pixels":50}
    ]
    fontSizes.forEach(async (fontSize) => {
      describe(`font size: `+ fontSize.size, () => {
        test("should have the correct Font size", async () => {
          //clear the editor before changing the font size
          await page.evaluate("editor.clear()")
          const symbols = await page.evaluate("editor.model.symbols")
          expect(symbols).toHaveLength(0)

          const fontSizeBtn = await page.locator("#ms-menu-style-font-size")
          expect(await fontSizeBtn.isVisible()).toBe(true)
          await fontSizeBtn.click()

          const fontSizeSelected = await page.locator("#ms-menu-style-font-size-" + fontSize.size + "-btn")
          expect(await fontSizeSelected.isVisible()).toBe(true)
          await fontSizeSelected.click()
          
          await writeStrokes(page, helloOneStroke.strokes)
          await page.evaluate('editor.convert()')  

          const symbolsAfterConvert = await page.evaluate("editor.model.symbols")
          const chars = symbolsAfterConvert[0].chars 
          expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
          for(const char of chars){
            expect(char.fontSize).toStrictEqual(fontSize.pixels)
            const charLocator = await page.locator(`#${char.id}`)
            const charFontSize = await charLocator.getAttribute("font-size")
            expect(charFontSize).toStrictEqual(fontSize.pixels.toString() + "px")
          }
        })
      })
    })

    test("should have a correct text converted size with fontSize Auto", async () => {
      //clear the editor before changing the font size
      await page.evaluate("editor.clear()")
      const fontSizeBtn = await page.locator("#ms-menu-style-font-size")
      expect(await fontSizeBtn.isVisible()).toBe(true)
      await fontSizeBtn.click()

      const fontSizeSelected = await page.locator("#ms-menu-style-font-size-Auto-btn")
      expect(await fontSizeSelected.isVisible()).toBe(true)
      await fontSizeSelected.click()
      
      await writeStrokes(page, helloOneStroke.strokes)
      await page.evaluate('editor.convert()')  

      let maxX = 0
      let maxY = 0
      let minX = 10000
      let minY = 10000
      helloOneStroke.strokes[0].pointers.map(pointer => {
        maxX = Math.max(maxX, pointer.x)
        minX = Math.min(minX, pointer.x)
        maxY = Math.max(maxY, pointer.y)
        minY = Math.min(minY, pointer.y)
      })
      const strokesHeight = maxY - minY
      const symbolsAfterConvert = await page.evaluate("editor.model.symbols")
      const boundsHeight = symbolsAfterConvert[0].bounds.height
      const chars = symbolsAfterConvert[0].chars
      expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
      // Allow 20% of difference between the height of the strokes and the height of the bounds
      expect(boundsHeight).toBeLessThanOrEqual(1.2*strokesHeight)
      expect(boundsHeight).toBeGreaterThanOrEqual(0.7*strokesHeight)
      for(const char of chars){
        expect(Math.round(char.bounds.height)).toStrictEqual(Math.round(boundsHeight))
        expect(char.fontSize).toBeLessThan(boundsHeight)
      }
      //verify place is correct
      const startXGap =Math.abs(minX - symbolsAfterConvert[0].bounds.x)
      const startYGap = Math.abs(minY - symbolsAfterConvert[0].bounds.y)
      expect(startXGap).toBeLessThanOrEqual(20)
      expect(startYGap).toBeLessThanOrEqual(30)
    })

    test("should have a correct font weight", async () => {
      //clear the editor before changing the font size
      await page.evaluate("editor.clear()")
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      const fontWeightBtn = await page.locator("#ms-menu-style-font-weight")
      expect(await fontWeightBtn.isVisible()).toBe(true)
      await fontWeightBtn.click()

      let fontWeightSelected = await page.locator("#ms-menu-style-font-weight-Bold-btn")
      expect(await fontWeightSelected.isVisible()).toBe(true)
      await fontWeightSelected.click()
      
      await writeStrokes(page, helloOneStroke.strokes)
      await page.evaluate('editor.convert()')  

      let symbolsAfterConvert = await page.evaluate("editor.model.symbols")
      let chars = symbolsAfterConvert[0].chars 
      expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
      for(const char of chars){
        expect(char.fontWeight).toStrictEqual("bold")
        const charLocator = await page.locator(`#${char.id}`)
        const charFontWeight = await charLocator.getAttribute("font-weight")
        expect(charFontWeight).toStrictEqual("bold")
      }

      await page.evaluate("editor.clear()")
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      fontWeightSelected = await page.locator("#ms-menu-style-font-weight-Normal-btn")
      expect(await fontWeightSelected.isVisible()).toBe(true)
      await fontWeightSelected.click()

      await writeStrokes(page, helloOneStroke.strokes)
      await page.evaluate('editor.convert()')  

      symbolsAfterConvert = await page.evaluate("editor.model.symbols")
      chars = symbolsAfterConvert[0].chars 
      expect(chars.length).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label.length)
      for(const char of chars){
        expect(char.fontWeight).toStrictEqual("normal")
        const charLocator = await page.locator(`#${char.id}`)
        const charFontWeight = await charLocator.getAttribute("font-weight")
        expect(charFontWeight).toStrictEqual("normal")
      }

      //reinit the thickness and fonts size and weight for the next tests
      const ThicknessBtn = await page.locator("#ms-menu-style-thickness-M-btn")
      expect(await ThicknessBtn.isVisible()).toBe(true)
      await ThicknessBtn.click()

      const fontSizeSelected = await page.locator("#ms-menu-style-font-size-Auto-btn")
      expect(await fontSizeSelected.isVisible()).toBe(true)
      await fontSizeSelected.click()

      fontWeightSelected = await page.locator("#ms-menu-style-font-weight-Normal-btn")
      expect(await fontWeightSelected.isVisible()).toBe(true)
      await fontWeightSelected.click()
      

    })

    test("should have the correct opacity", async () => {
      //clear the editor before changing the opacity
      await page.evaluate("editor.clear()")
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      const opacityBtn = await page.locator("#ms-menu-style-opacity")
      expect(await opacityBtn.isVisible()).toBe(true)
      await opacityBtn.click()

      const opacitySelected = await page.locator("#ms-menu-style-opacity-input")
      await opacitySelected.fill("50")
      
      await writeStrokes(page, helloOneStroke.strokes)

      const symbolsAfterColor = await page.evaluate("editor.model.symbols")
      const styleEl = symbolsAfterColor[0].style 
      expect(styleEl.color).toStrictEqual("#000000")
      expect(styleEl.width).toStrictEqual(2)
      expect(styleEl.opacity).toStrictEqual(0.5)
      expect(styleEl.fill).toStrictEqual("transparent")
    })
  })
})
