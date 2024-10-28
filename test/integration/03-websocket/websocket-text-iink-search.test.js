const { writeStrokes, getDatasFromExportedEvent, waitForEditorWebSocket } = require("../helper")
const { hello } = require("../strokesDatas")

describe("Websocket Text search", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_iink_search.html")
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Text search")
  })

  test("should write hello", async () => {
    const [exported] = await Promise.all([
      getDatasFromExportedEvent(page),
      writeStrokes(page, hello.strokes)
    ])

    expect(exported).toBeDefined()
  })

  test("should find text", async () => {
    await Promise.all([
      page.locator("#searchInput").type("hello"),
      page.click("#searchBtn")
    ])

    //wait for css highlight
    await page.waitForTimeout(1000)
    const highlight = page.locator(".highlight")
    expect(highlight).toBeDefined()
  })

  test("should failed to find", async () => {
    await Promise.all([
      page.locator("#searchInput").type("test"),
      page.click("#searchBtn")
    ])
    //wait for css highlight
    await page.waitForTimeout(1000)
    expect(await page.locator(".highlight").count()).toEqual(0)
  })
})
