const { write, getDatasFromExportedEvent, waitForEditorWebSocket, waitEditorIdle } = require("../helper")
const { hello } = require("../strokesDatas")

describe("Websocket Text file export", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_file_export.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Word Export with iink")
  })

  test("should write and save to word file", async () => {
    await waitForEditorWebSocket(page)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, hello.strokes)
    ])
    const downloadPromise = page.waitForEvent('download');
    await page.locator("#exportContent").click()
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("myDocument.docx");
  })

  test("should write and save to html file", async () => {
    await waitForEditorWebSocket(page)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, hello.strokes)
    ])
    const downloadPromise = page.waitForEvent('download');
    await page.selectOption('#exportType', 'html'),
    await page.locator("#exportContent").click()
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("myDocument.html");
  })

  test("should write and save to png file", async () => {
    await waitForEditorWebSocket(page)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, hello.strokes)
    ])
    const downloadPromise = page.waitForEvent('download');
    await page.selectOption('#exportType', 'png'),
    await page.locator("#exportContent").click()
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("myDocument.png");
  })

  test("should write and save to jpg file", async () => {
    await waitForEditorWebSocket(page)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, hello.strokes)
    ])
    const downloadPromise = page.waitForEvent('download');
    await page.selectOption('#exportType', 'jpeg'),
    await page.locator("#exportContent").click()
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("myDocument.jpg");
  })

})
