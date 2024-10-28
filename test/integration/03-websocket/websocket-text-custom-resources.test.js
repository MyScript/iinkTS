const { writeStrokes, getDatasFromExportedEvent, waitForEditorWebSocket, waitEditorIdle } = require("../helper")
const { abrausorus } = require("../strokesDatas")

describe("Websocket Text Custom Resource", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_resources.html")
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom pre-loaded resources")
  })

  test("should export application/vnd.myscript.jiix", async () => {
    const [exports] = await Promise.all([
      getDatasFromExportedEvent(page),
      writeStrokes(page, abrausorus.strokes),
    ])
    await waitEditorIdle(page)
    const jiixExpected = abrausorus.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })

  require("../_partials/text/nav-actions-text-undo-redo-test")
})
