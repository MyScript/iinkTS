const { write, getExportedDatas, waitForEditorWebSocket } = require("../helper")
const { hello } = require("../strokesDatas")

describe("Websocket Text search", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_iink_search.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Text search")
  })

  test("should find text", async () => {
    await Promise.all([
        getExportedDatas(page),
        write(page, hello.strokes)
    ])

    const inputSearch = page.locator("#searchInput")
    await Promise.all([
        inputSearch.type("hello"),
        page.click("#searchBtn")
    ])

    //wait for css highlight
    await page.waitForTimeout(1000)
    const highlight = page.locator(".highlight")
    expect(highlight).toBeDefined()
  })

  test("should failed to find", async () => {
    await Promise.all([
        getExportedDatas(page),
        write(page, hello.strokes)
    ])

    page.locator("#searchInput").type("test")
    await page.click("#searchBtn")
    expect(await page.locator(".highlight").count()).toEqual(0)
  })
})