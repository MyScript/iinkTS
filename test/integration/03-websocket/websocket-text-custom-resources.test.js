const { write, getExportedDatas, waitForEditorWebSocket } = require("../helper")
const { abrausorus } = require("../strokesDatas")

describe("Websocket Text Custom Resource", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_resources.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom pre-loaded resources")
  })

  test("should export application/vnd.myscript.jiix", async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, abrausorus.strokes),
    ])
    await page.waitForTimeout(500)
    const jiixExpected = abrausorus.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })
})
