const { writeStrokes, waitForExportedEvent, waitEditorIdle } = require("../../helper")
const { sumSimple } = require("../../strokesDatas")

describe('Nav actions math clear', () => {
  beforeAll(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitEditorIdle(page)
  })

  test("should clear", async () => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, sumSimple.strokes)
    ])

    let resultText = await page.locator("#result").textContent()
    expect(resultText).toBeDefined()

    const [clearExport] = await Promise.all([
      waitForExportedEvent(page),
      page.click("#clear")
    ])

    const emptyLatex = ""
    const LatexReceived = clearExport["application/x-latex"]
    expect(LatexReceived).toEqual(emptyLatex)

    resultText = await page.locator("#result").textContent()
    expect(resultText).toBe("")
  })
})
