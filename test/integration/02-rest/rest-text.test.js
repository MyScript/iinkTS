const {
  waitForEditorRest,
  writeStrokes,
  waitForExportedEvent,
  setEditorConfiguration,
  getEditorConfiguration,
  getExportsFromEditorModel,
} = require('../helper')
const { h, hello } = require('../strokesDatas')

describe('Rest Text', () => {

  beforeAll(async () => {
    await page.goto('/examples/rest/rest_text_iink.html')
  })

  beforeEach(async () => {
    await Promise.all([
      page.reload({ waitUntil: 'load' }),
      page.waitForResponse(req => req.url().includes('/api/v4.0/iink/availableLanguageList'))
    ])
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Text')
  })

  test('should display text/plain into result', async () => {
    const [exportedDatas] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])
    const resultText = await page.locator('#result').textContent()
    expect(resultText).toStrictEqual(exportedDatas['text/plain'])
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))
  })

  describe('Request sent', () => {
    let mimeTypeRequest = []
    const countMimeType = async (request) => {
      if (
        request.url().includes('api/v4.0/iink/batch') &&
        request.method() === 'POST'
      ) {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    }

    beforeEach(async () => {
      page.on('request', countMimeType)
      mimeTypeRequest = []
    })

    afterEach(async () => {
      await page.removeListener('request', countMimeType)
    })

    test('should only request text/plain by default', async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain('text/plain')
    })

    test('should only request application/vnd.myscript.jiix', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.text.mimeTypes = [
        'application/vnd.myscript.jiix',
      ]
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain('application/vnd.myscript.jiix')
    })

    test('should request application/vnd.myscript.jiix & text/plain', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.text.mimeTypes = [
        'application/vnd.myscript.jiix',
        'text/plain',
      ]
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(2)
      const allMimeTypesRequested = mimeTypeRequest.join(' ')
      expect(allMimeTypesRequested).toContain('application/vnd.myscript.jiix')
      expect(allMimeTypesRequested).toContain('text/plain')
    })
  })

  describe('Nav actions', () => {
    test('should clear', async () => {
      const [exportedDatas] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
      const resultText = await page.locator('#result').textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

      expect(await getExportsFromEditorModel(page)).toBeDefined()

      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click('#clear'),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getExportsFromEditorModel(page)).toBeFalsy()
      expect(await page.locator('#result').textContent()).toBe('')
    })

    test('should undo/redo', async () => {
      const editorEl = await page.waitForSelector('#editor')
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, hello.strokes)
      ])

      await page.waitForTimeout(1500)

      expect(await page.locator('#result').textContent()).toStrictEqual(hello.exports['text/plain'].at(-1))

      let strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(strokes.length).toStrictEqual(hello.strokes.length)

      await Promise.all([waitForExportedEvent(page), page.click('#undo')])
      expect(await page.locator('#result').textContent()).toStrictEqual(hello.exports['text/plain'].at(-2))

      strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(strokes.length).toStrictEqual(hello.strokes.length - 1)

      await Promise.all([waitForExportedEvent(page), page.click('#undo')])
      expect(await page.locator('#result').textContent()).toStrictEqual(hello.exports['text/plain'].at(-3))

      strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(strokes.length).toStrictEqual(hello.strokes.length - 2)

      await Promise.all([waitForExportedEvent(page), page.click('#redo')])
      expect(await page.locator('#result').textContent()).toStrictEqual(hello.exports['text/plain'].at(-2))

      strokes = await editorEl.evaluate((node) => node.editor.model.symbols)
      expect(strokes.length).toStrictEqual(hello.strokes.length - 1)
    })

    test('should change language', async () => {
      const [requestEn] = await Promise.all([
        page.waitForRequest(req => req.url().includes('/api/v4.0/iink/batch') && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const enPostData = (await requestEn).postDataJSON()
      expect(enPostData.configuration.lang).toEqual("en_US")

      await page.selectOption('#language', 'fr_FR')

      expect(await page.locator('#result').textContent()).toBe('')

      const [requestFr] = await Promise.all([
        page.waitForRequest(req => req.url().includes('/api/v4.0/iink/batch') && req.method() === "POST"),
        writeStrokes(page, h.strokes),
      ])
      const frPostData = (await requestFr).postDataJSON()
      expect(frPostData.configuration.lang).toEqual("fr_FR")
    })
  })
})
