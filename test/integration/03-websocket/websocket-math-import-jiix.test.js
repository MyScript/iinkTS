
const { waitForEditorWebSocket, waitEditorIdle, getExportsTypeFromEditorModel, haveSameLabels } = require('../helper')

describe('Websocket Math Import JIIX', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_import_jiix.html')
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Import math with JIIX')
  })

  test('should import JIIX', async () => {
    await page.click('#import')
    await waitEditorIdle(page)

    const jiix = await getExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
    const jiixTextToImport = await page.locator("#jiix").textContent()
    const jiixToImport = JSON.parse(jiixTextToImport)
    expect(haveSameLabels(jiix, jiixToImport)).toEqual(true)
  })

})
