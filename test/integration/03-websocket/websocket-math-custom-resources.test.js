const { waitForEditorWebSocket, writePointers, write, getDatasFromExportedEvent, getExportsTypeFromEditorModel, waitEditorIdle, getEditorConfiguration, setEditorConfiguration } = require("../helper")
const { sumSimple, h } = require("../strokesDatas")

describe("Websocket Math", function () {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_math_custom_resources.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom resources math")
  })

  test("should only export latex by default", async () => {
    for (const s of sumSimple.strokes) {
      await Promise.all([getDatasFromExportedEvent(page), writePointers(page, [s], 100, 100)])
    }
    const jiix = await getExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
    expect(jiix).toBeUndefined()
    const latex = await getExportsTypeFromEditorModel(page, "application/x-latex")
    expect(latex).toBeDefined()
    const mathml = await getExportsTypeFromEditorModel(page, "application/mathml+xml")
    expect(mathml).toBeUndefined()
  })

  test("should undo/redo", async () => {
    const editorEl = await page.waitForSelector("#editor")
    for (const s of sumSimple.strokes) {
      await Promise.all([getDatasFromExportedEvent(page), writePointers(page, [s])])
    }

    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(sumSimple.exports["LATEX"].at(-1))
    let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(sumSimple.strokes.length)

    await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")])
    resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(sumSimple.exports["LATEX"].at(-2))
    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(sumSimple.strokes.length - 1)
  })

  test("should clear", async () => {
    await Promise.all([getDatasFromExportedEvent(page), writePointers(page, sumSimple.strokes)])
    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).toBeDefined()

    const [clearExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#clear")])
    const emptyLatex = ""
    const LatexReceived = clearExport["application/x-latex"]
    expect(LatexReceived).toEqual(emptyLatex)

    const modelExportLatex = await getExportsTypeFromEditorModel(page, "application/x-latex")
    expect(modelExportLatex).toEqual(LatexReceived)
    resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).toBe("")
  })

  test("should not recognize text", async () => {
    await Promise.all([getDatasFromExportedEvent(page), write(page, h.strokes)])
    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).not.toEqual("h")
  })

  test("should change configuration and recognize text", async () => {

    const config = await getEditorConfiguration(page)
    config.recognition.math.customGrammarContent = undefined
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    const [exportedDatas] = await Promise.all([getDatasFromExportedEvent(page), write(page, h.strokes)])
    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    const latexReceived = exportedDatas["application/x-latex"]
    expect(resultText).toEqual("h")
  })
})
