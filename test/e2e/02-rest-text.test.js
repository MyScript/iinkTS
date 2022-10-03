const { write, getExportedDatas, getEditor, changeConfiguration, } = require('./helper')
const { h, hello } = require('./strokesDatas')

describe('Rest Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/rest/rest_text_iink.html')
  })

  beforeEach(async () => {
    await page.reload()
  })

  it('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest Text iink')
  })

  it('should only request text/plain by default', async () => {
    const mimeTypeRequest = []
    page.on('request', async (request) => {
      if (request.url().includes('api/v4.0/iink/batch') && request.method() === 'POST') {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    })
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes, 100, 100),
    ])
    expect(mimeTypeRequest).toHaveLength(1)
    expect(mimeTypeRequest[0]).toContain('text/plain')
  })

  it('should only request application/vnd.myscript.jiix', async () => {
    let editor = await getEditor(page)
    editor._configuration.recognition.text.mimeTypes = ['application/vnd.myscript.jiix']
    await changeConfiguration(page, editor._configuration)

    const mimeTypeRequest = []
    page.on('request', async (request) => {
      if (request.url().includes('api/v4.0/iink/batch') && request.method() === 'POST') {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    })

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes, 100, 100),
    ])
    expect(mimeTypeRequest).toHaveLength(1)
    expect(mimeTypeRequest[0]).toContain('application/vnd.myscript.jiix')
  })

  it('should export "hello"', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, hello.strokes)
    ])
    const editor = await getEditor(page)
    expect(exportedDatas).toStrictEqual(editor.model.exports)
    expect(exportedDatas['text/plain']).toStrictEqual(hello.exports.TEXT.at(-1))
  })

  it('should display result', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, hello.strokes)
    ])
    const resultElement = page.locator('#result')
    const resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(exportedDatas['text/plain'])
    expect(resultText).toStrictEqual(hello.exports.TEXT.at(-1))
  })

  it('should clear', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes)
    ])
    expect(exportedDatas['text/plain']).toStrictEqual(h.exports.TEXT.at(-1))

    const promisesResult = await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])
    expect(promisesResult[0]).toBeNull()

    const editor = await getEditor(page)
    expect(editor.model.exports).toBeUndefined()

    const resultElement = page.locator('#result')
    const resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })

  it('should undo/redo', async () => {
    const editorEl = await page.waitForSelector('#editor')
    await Promise.all([
      getExportedDatas(page),
      write(page, hello.strokes)
    ])

    await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)

    await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 2)

    await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)
  })
})
