const {
  write,
  getExportedDatas,
  getEditor,
  setEditorConfiguration,
  getEditorConfiguration,
  waitEditorLoaded,
  getEditorModelExports,
} = require('../helper')
const { h, hello } = require('../strokesDatas')

describe('Rest Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/rest/rest_text_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Text iink')
  })

  test('should display text/plain into result', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(exportedDatas['text/plain'])
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))
  })

  describe('Request sent', () => {
    test('should only request text/plain by default', async () => {
      const mimeTypeRequest = []
      page.on('request', async (request) => {
        if (
          request.url().includes('api/v4.0/iink/batch') &&
          request.method() === 'POST'
        ) {
          const headers = await request.allHeaders()
          mimeTypeRequest.push(headers.accept)
        }
      })
      await Promise.all([
        getExportedDatas(page),
        write(page, h.strokes),
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

      const mimeTypeRequest = []
      page.on('request', async (request) => {
        if (
          request.url().includes('api/v4.0/iink/batch') &&
          request.method() === 'POST'
        ) {
          const headers = await request.allHeaders()
          mimeTypeRequest.push(headers.accept)
        }
      })

      await Promise.all([
        getExportedDatas(page),
        write(page, h.strokes),
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

      const mimeTypeRequest = []
      page.on('request', async (request) => {
        if (
          request.url().includes('api/v4.0/iink/batch') &&
          request.method() === 'POST'
        ) {
          const headers = await request.allHeaders()
          mimeTypeRequest.push(headers.accept)
        }
      })

      await Promise.all([
        getExportedDatas(page),
        write(page, h.strokes),
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
        getExportedDatas(page),
        write(page, h.strokes),
      ])
      let resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

      expect(await getEditorModelExports(page)).toBeDefined()

      const promisesResult = await Promise.all([
        getExportedDatas(page),
        page.click('#clear'),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorModelExports(page)).toBeUndefined()

      resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toBe('')
    })

    test('should undo/redo', async () => {
      const editorEl = await page.waitForSelector('#editor')
      await Promise.all([getExportedDatas(page), write(page, hello.strokes)])

      //TODO remove this
      await page.waitForTimeout(1500)

      let resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(hello.exports['text/plain'].at(-1)).toStrictEqual(resultText)

      let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toStrictEqual(hello.strokes.length)

      await Promise.all([getExportedDatas(page), page.click('#undo')])
      resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-2))

      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toStrictEqual(hello.strokes.length - 1)

      await Promise.all([getExportedDatas(page), page.click('#undo')])
      resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-3))

      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toStrictEqual(hello.strokes.length - 2)

      await Promise.all([getExportedDatas(page), page.click('#redo')])
      resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-2))

      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toStrictEqual(hello.strokes.length - 1)
    })

    test('should change language', async () => {
      const [exportedDatas] = await Promise.all([
        getExportedDatas(page),
        write(page, h.strokes),
      ])
      let resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

      await Promise.all([
        waitEditorLoaded(page),
        page.selectOption('#language', 'fr_FR'),
      ])

      resultElement = page.locator('#result')
      resultText = await resultElement.textContent()
      expect(resultText).toBe('')
    })
  })
})
