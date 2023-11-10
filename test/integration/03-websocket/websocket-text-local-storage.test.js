const { waitForEditorWebSocket, write, getDatasFromExportedEvent, getExportsTypeFromEditorModel, waitEditorIdle } = require("../helper")
const { helloOneStroke } = require("../strokesDatas")

describe("Websocket Text local storage", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_local_storage_text.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "load" })
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("WEBSOCKET Text iink")
  })

  test("should export text/plain", async () => {
    const [exports] = await Promise.all([getDatasFromExportedEvent(page), write(page, helloOneStroke.strokes)])
    //add delay to save text in localstorage
    await page.waitForTimeout(400)
    const jiixExpected = helloOneStroke.exports["text/plain"][0]
    const jiixReceived = exports["text/plain"]
    await page.locator("#clear-storage").click()
    expect(jiixReceived).toStrictEqual(jiixExpected)
  })

  test("should get hello in localstorage", async () => {
    await page.click("#clear-storage")
    await Promise.all([getDatasFromExportedEvent(page), write(page, helloOneStroke.strokes)])

    await page.reload({ waitUntil: "load" })
    await waitForEditorWebSocket(page)

    const exports = await page.locator(".added-word").textContent()
    expect(exports).toEqual("hello")
    await page.click("#clear-storage")
  })

  require("../_partials/text/nav-actions-text-undo-redo-test")
})
