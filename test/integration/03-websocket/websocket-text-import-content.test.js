const { waitForEditorWebSocket, write, getDatasFromExportedEvent, waitEditorIdle } = require('../helper')
const { h } = require('../strokesDatas')

describe('Websocket Text Import Content', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_import_content.html')
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Import')
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

  require("../_partials/text/nav-actions-text-undo-redo-test")
})
