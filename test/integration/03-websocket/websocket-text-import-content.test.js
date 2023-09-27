const { waitForEditorWebSocket, write, getDatasFromExportedEvent, waitEditorIdle } = require('../helper')
const { h } = require('../strokesDatas')

describe('Websocket Text Import Content', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_import_content.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Import')
  })

  test('should export application/vnd.myscript.jiix', async () => {
    const [exports] = await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, h.strokes),
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = exports['application/vnd.myscript.jiix']
    expect(jiixReceived).toEqual(jiixExpected)
  })

  test('should import text hello', async () => {
    await Promise.all([
        page.locator("#importContentField").fill("hello"),
        page.locator("#importContent").click(),
        getDatasFromExportedEvent(page),
    ])

    const prompterText = await page.waitForSelector('.prompter-text')
    const textContent = await prompterText.evaluate((node) => node.textContent)
    expect(textContent).toEqual("hello")
  })

  test('should import text pony', async () => {
    await Promise.all([
        page.locator("#importContentField").fill("pony"),
        page.locator("#importContent").click(),
        getDatasFromExportedEvent(page),
    ])

    const prompterText = await page.waitForSelector('.prompter-text')
    const textContent = await prompterText.evaluate((node) => node.textContent)
    expect(textContent).toEqual("pony")
  })
})
