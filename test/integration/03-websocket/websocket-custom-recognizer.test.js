const { writeStrokes, waitForEditorWebSocket, waitEditorIdle, getDatasFromExportedEvent } = require("../helper")
const { h } = require("../strokesDatas")

describe("Websocket Custom recognizer", () => {
  beforeAll(async () => {
    await page.goto("/examples/dev/websocket_custom_recognizer.html")
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Websocket custom recognizer")
  })

  test("should have info in recognizer-info div", async () => {
    const url = await page.$eval("#recognizer-url", el => el.textContent)
    expect(url).toContain("connection established at")
    const sent = await page.$eval("#recognizer-sent", el => el.textContent)
    expect(sent).toContain("Message sent: {")
    const received = await page.$eval("#recognizer-received", el => el.textContent)
    expect(received).toContain("Message received: {")
  })

  test("should have info in recognizer-info div", async () => {
    await Promise.all([
      getDatasFromExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])
    const url = await page.$eval("#recognizer-url", el => el.textContent)
    expect(url).toContain("connection established at ")
    expect(url).toContain("/api/v4.0/iink/document?applicationKey=")
    const sent = await page.$eval("#recognizer-sent", el => el.textContent)
    expect(sent).toContain("Message sent: {\"type\":\"addStrokes\",\"strokes\"")
    const received = await page.$eval("#recognizer-received", el => el.textContent)
    expect(received).toContain("Message received: {\"type\":\"")
  })
})
