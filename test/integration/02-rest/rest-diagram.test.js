const {
  waitForEditorRest,
  write,
  getExportedDatas,
  setEditorConfiguration,
  getEditorConfiguration,
  getEditorModelExports,
} = require('../helper')
const { rectangle, line } = require('../strokesDatas')

describe('Rest Diagram', () => {

  beforeAll(async () => {
    await page.goto('/examples/rest/rest_diagram_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Diagram')
  })

  test('should display application/vnd.myscript.jiix into result', async () => {
    const [lineExportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, [rectangle.strokes[0]]),
    ])
    const lineResultText = await page.locator('#result').textContent()
    const lineResultJson = JSON.parse(lineResultText)
    expect(lineResultJson).toEqual(lineExportedDatas)
    expect(lineExportedDatas['application/vnd.myscript.jiix']).toMatchObject(rectangle.exports[0]['application/vnd.myscript.jiix'])

    const [rectExportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, [rectangle.strokes[1]]),
    ])
    const rectResultText = await page.locator('#result').textContent()
    const rectResultJson = JSON.parse(rectResultText)
    expect(rectResultJson).toEqual(rectExportedDatas)
    expect(rectExportedDatas['application/vnd.myscript.jiix']).toMatchObject(rectangle.exports[1]['application/vnd.myscript.jiix'])
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

    test('should only request application/vnd.myscript.jiix by default', async () => {
      await Promise.all([
        getExportedDatas(page),
        write(page, line.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain('application/vnd.myscript.jiix')
    })

    test('should only request application/vnd.openxmlformats-officedocument.presentationml.presentation', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.diagram.mimeTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ]
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        getExportedDatas(page),
        write(page, line.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    })

    test('should request application/vnd.myscript.jiix & application/vnd.openxmlformats-officedocument.presentationml.presentation', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.diagram.mimeTypes = [
        'application/vnd.myscript.jiix',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ]
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        getExportedDatas(page),
        write(page, line.strokes),
      ])
      expect(mimeTypeRequest).toHaveLength(2)
      const allMimeTypesRequested = mimeTypeRequest.join(' ')
      expect(allMimeTypesRequested).toContain('application/vnd.myscript.jiix')
      expect(allMimeTypesRequested).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    })
  })

  describe('Nav actions', () => {
    test('should clear', async () => {
      const [exportedDatas] = await Promise.all([
        getExportedDatas(page),
        write(page, line.strokes),
      ])
      const resultText = await page.locator('#result').textContent()
      const rectResultJson = JSON.parse(resultText)
      expect(exportedDatas['application/vnd.myscript.jiix']).toEqual(rectResultJson['application/vnd.myscript.jiix'])
      expect(rectResultJson['application/vnd.myscript.jiix']).toMatchObject(line.exports[0]['application/vnd.myscript.jiix'])

      expect(await getEditorModelExports(page)).toBeDefined()

      const promisesResult = await Promise.all([
        getExportedDatas(page),
        page.click('#clear'),
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorModelExports(page)).toBeUndefined()

      expect(await page.locator('#result').textContent()).toBe('{}')
    })

    test('should undo/redo', async () => {
      const editorEl = await page.waitForSelector('#editor')
      await Promise.all([
        getExportedDatas(page),
        write(page, [rectangle.strokes[0]])
      ])
      await Promise.all([
        getExportedDatas(page),
        write(page, [rectangle.strokes[1]])
      ])
      let resultText = await page.locator('#result').textContent()
      let rectResultJson = JSON.parse(resultText)
      expect(rectResultJson['application/vnd.myscript.jiix']).toMatchObject(rectangle.exports.at(-1)['application/vnd.myscript.jiix'])

      let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(rectangle.strokes.length)

      await Promise.all([getExportedDatas(page), page.click('#undo')])
      resultText = await page.locator('#result').textContent()
      rectResultJson = JSON.parse(resultText)
      expect(rectResultJson['application/vnd.myscript.jiix']).toMatchObject(rectangle.exports.at(-2)['application/vnd.myscript.jiix'])

      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(rectangle.strokes.length - 1)

      await Promise.all([getExportedDatas(page), page.click('#redo')])
      resultText = await page.locator('#result').textContent()
      rectResultJson = JSON.parse(resultText)
      expect(rectResultJson['application/vnd.myscript.jiix']).toMatchObject(rectangle.exports.at(-1)['application/vnd.myscript.jiix'])

      raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
      expect(raw.length).toEqual(rectangle.strokes.length)
    })
  })
})
