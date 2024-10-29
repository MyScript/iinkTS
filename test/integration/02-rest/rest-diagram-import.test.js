const {
  waitForEditorRest,
  waitForExportedEvent,
  getExportsFromEditorModel,
} = require('../helper')

describe('Rest Diagram import', () => {

  beforeAll(async () => {
    await page.goto('/examples/rest/rest_diagram_iink_import.html')
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Diagram Import')
  })

  test('should display empty result', async () => {
    expect(await page.locator('#result').textContent()).toEqual("")
  })

  test('should import pointers', async () => {
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      page.locator('#import-btn').click(),
    ])
    const resultText = await page.locator('#result').textContent()
    const resultJson = JSON.parse(resultText)
    expect(resultJson).toEqual(exportedDatas)
    expect(Object.keys(resultJson['application/vnd.myscript.jiix'].elements).length).toEqual(12)
    const editorEl = await page.waitForSelector('#editor')
    const raw = await editorEl.evaluate((node) => node.editor.model.symbols)
    expect(raw.length).toEqual(40)
  })

  describe('Nav actions', () => {
    test('should clear', async () => {
      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click('#clear'),
      ])
      expect(promisesResult[0]).toBeFalsy()
      expect(await getExportsFromEditorModel(page)).toBeFalsy()
      expect(await page.locator('#result').textContent()).toBe('{}')
    })

    test('should undo/redo', async () => {
      const editorEl = await page.waitForSelector('#editor')

      await Promise.all([waitForExportedEvent(page), page.click('#undo')])
      resultText = await page.locator('#result').textContent()
      resultJson = JSON.parse(resultText)
      expect(Object.keys(resultJson['application/vnd.myscript.jiix'].elements).length).toEqual(12)

      await Promise.all([waitForExportedEvent(page), page.click('#redo')])
      expect(await page.locator('#result').textContent()).toBe('{}')
      raw = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(raw.length).toEqual(0)
      raw = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(raw.length).toEqual(0)
    })
  })
})
