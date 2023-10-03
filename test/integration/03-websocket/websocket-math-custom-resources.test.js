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
  require("../_partials/math/nav-actions-math-undo-redo-test")
  require("../_partials/math/nav-actions-math-clear-test")
})
