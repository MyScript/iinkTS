const { waitForEditorWebSocket, writeStrokes, waitForExportedEvent, waitEditorIdle, getEditorConfiguration, setEditorConfiguration } = require("../helper")
const { h } = require("../strokesDatas")

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

  test("should not recognize text", async () => {
    await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).not.toEqual("h")
  })

  test("should change configuration and recognize text", async () => {

    const config = await getEditorConfiguration(page)
    config.recognition.math.customGrammarContent = undefined
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
    let resultElement = page.locator("#result")
    resultText = await resultElement.textContent()
    expect(resultText).toEqual("h")
  })

  require("../_partials/math/nav-actions-math-undo-redo-test")
  require("../_partials/math/nav-actions-math-clear-test")
})
