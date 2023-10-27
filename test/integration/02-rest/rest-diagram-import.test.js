const {
  waitForEditorRest,
  write,
  getDatasFromExportedEvent,
  setEditorConfiguration,
  getEditorConfiguration,
  getExportsFromEditorModel,
} = require('../helper')
const { line } = require('../strokesDatas')

describe('Rest Diagram import', () => {

  beforeAll(async () => {
    await page.goto('/examples/rest/rest_diagram_iink_import.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Diagram Import')
  })

  test('should display application/vnd.myscript.jiix into result', async () => {
    const exportedDatas = await getDatasFromExportedEvent(page)
    const resultText = await page.locator('#result').textContent()
    const resultJson = JSON.parse(resultText)
    expect(resultJson).toEqual(exportedDatas)
    expect(Object.keys(resultJson['application/vnd.myscript.jiix'].elements).length).toEqual(12)
    const editorEl = await page.waitForSelector('#editor')
    const raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toEqual(40)
  })

  describe('Nav actions', () => {
    test('should clear', async () => {
      const promisesResult = await Promise.all([
        getDatasFromExportedEvent(page),
        page.click('#clear'),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getExportsFromEditorModel(page)).toBeNull()

      expect(await page.locator('#result').textContent()).toBe('{}')
    })

    test('should undo/redo', async () => {
      const editorEl = await page.waitForSelector('#editor')

      await Promise.all([getDatasFromExportedEvent(page), page.click('#clear')])
      expect(await page.locator('#result').textContent()).toBe('{}')
      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(0)

      await Promise.all([getDatasFromExportedEvent(page), page.click('#undo')])
      resultText = await page.locator('#result').textContent()
      resultJson = JSON.parse(resultText)
      expect(Object.keys(resultJson['application/vnd.myscript.jiix'].elements).length).toEqual(12)


      await Promise.all([getDatasFromExportedEvent(page), page.click('#redo')])
      expect(await page.locator('#result').textContent()).toBe('{}')
      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(0)
      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(0)
    })
  })
})
