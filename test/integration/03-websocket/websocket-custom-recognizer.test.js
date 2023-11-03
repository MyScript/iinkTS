const { assert } = require("console")
const { write, waitForEditorWebSocket, waitEditorIdle } = require("../helper")
const { hello } = require("../strokesDatas")

describe("Websocket Custom recognizer", () => {
  beforeAll(async () => {
    await page.goto("/examples/dev/websocket_custom_recognizer.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Websocket custom recognizer")
  })

  test("should have info in recognizer-info div", async () => {
    const recognizerInfo = await page.$eval(".recognizer-info", el => el.textContent) 
    assert(recognizerInfo.includes("connection established at ws://"))
    assert(recognizerInfo.includes("Message sent: {"))
    assert(recognizerInfo.includes("Message received: {"))
  })

  test("should have info in recognizer-info div", async () => {
    await write(page, hello.strokes)
    const recognizerInfo = await page.$eval(".recognizer-info", el => el.textContent) 
    assert(recognizerInfo.includes("connection established at ws://"))
    assert(recognizerInfo.includes("Message sent: {\"type\":\"addStrokes\",\"strokes\""))
    assert(recognizerInfo.includes("Message received: {\"type\":\"svgPatch\",\"updates\""))
  })
})