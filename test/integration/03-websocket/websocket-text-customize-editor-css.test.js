const { waitForEditorWebSocket } = require("../helper")

describe("Websocket Text Custom Resource", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_customize_editor_css.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Styling editor style")
  })

  require("../_partials/text/nav-actions-text-undo-redo-test")
})