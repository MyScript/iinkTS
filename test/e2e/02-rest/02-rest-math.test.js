const { write, getExportedDatas, getEditor, setEditorConfiguration, getEditorConfiguration } = require('../helper')
const { equation1, one } = require('../strokesDatas')

describe('Rest Math', () => {
  beforeAll(async () => {
    await page.goto('/examples/rest/rest_math_iink.html')
  })

  beforeEach(async () => {
    await page.reload()
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Math iink')
  })

  test('should only request application/x-latex by default', async () => {
    const mimeTypeRequest = []
    page.on('request', async (request) => {
      if (request.url().includes('api/v4.0/iink/batch') && request.method() === 'POST') {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    })
    await Promise.all([
      getExportedDatas(page),
      write(page, one.strokes, 100, 100),
    ])
    expect(mimeTypeRequest).toHaveLength(1)
    expect(mimeTypeRequest[0]).toContain('application/x-latex')
  })

  test('should only request application/mathml+xml', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.math.mimeTypes = ['application/mathml+xml']
    await setEditorConfiguration(page, configuration)

    const mimeTypeRequest = []
    page.on('request', async (request) => {
      if (request.url().includes('api/v4.0/iink/batch') && request.method() === 'POST') {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    })

    await Promise.all([
      getExportedDatas(page),
      write(page, one.strokes, 100, 100),
    ])
    expect(mimeTypeRequest).toHaveLength(1)
    expect(mimeTypeRequest[0]).toContain('application/mathml+xml')
  })

  test('should request application/mathml+xml & application/x-latex', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.math.mimeTypes = ['application/mathml+xml', 'application/x-latex']
    await setEditorConfiguration(page, configuration)

    const mimeTypeRequest = []
    page.on('request', async (request) => {
      if (request.url().includes('api/v4.0/iink/batch') && request.method() === 'POST') {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    })

    await Promise.all([
      getExportedDatas(page),
      write(page, one.strokes, 100, 100),
    ])
    expect(mimeTypeRequest).toHaveLength(2)
    const allMimeTypesRequested = mimeTypeRequest.join(' ')
    expect(allMimeTypesRequested).toContain('application/mathml+xml')
    expect(allMimeTypesRequested).toContain('application/x-latex')
  })

  test('should export "y=3x+2"', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, equation1.strokes, 100, 100),
    ])
    const editor = await getEditor(page)
    expect(exportedDatas).toStrictEqual(editor.model.exports)
    expect(exportedDatas['application/x-latex']).toStrictEqual(
      equation1.exports.LATEX.at(-1)
    )
  })

  test('should display katex-html into result', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, equation1.strokes, 100, 100),
    ])
    const resultElement = page.locator('#result')
    const htmlKatexResult = await resultElement.locator('.katex-html').textContent()
    expect(htmlKatexResult).toStrictEqual(exportedDatas['application/x-latex'])
    expect(htmlKatexResult).toStrictEqual(equation1.exports.LATEX.at(-1))
  })

  test('should clear', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, one.strokes, 100, 100),
    ])
    expect(exportedDatas['application/x-latex']).toStrictEqual(one.exports.LATEX.at(-1))

    const promisesResult = await Promise.all([
      getExportedDatas(page),
      page.click('#clear'),
    ])
    expect(promisesResult[0]).toBeNull()

    const editor = await getEditor(page)
    expect(editor.model.exports).toBeUndefined()

    const resultElement = page.locator('#result')
    const resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })

  test('should undo/redo', async () => {
    const editorEl = await page.waitForSelector('#editor')

    await Promise.all([
      getExportedDatas(page),
      write(page, equation1.strokes, 100, 100),
    ])

    await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(equation1.strokes.length - 1)

    await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(equation1.strokes.length - 2)

    await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(equation1.strokes.length - 1)
  })

})
