
const {
  waitForEditorWebSocket,
  write,
  getDatasFromExportedEvent,
  getExportsTypeFromEditorModel,
  getEditorConfiguration,
  setEditorConfiguration,
  getExportsFromEditorModel,
  waitEditorIdle
} = require('../helper')
const { equation1, fence } = require('../strokesDatas')

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math')
  })

  test('should only export latex by default', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toBeDefined()
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export jiix', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix']
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s], 100, 100)
      ])
    }
    const latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeDefined()
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export mathml+xml', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    await write(page, equation1.strokes, 100, 100)
    await waitEditorIdle(page)

    const latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml).toBeDefined()
  })

  test('should export mathml with flavor "standard"', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    config.recognition.export.mathml = { flavor: 'standard' }
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)
    for(const s of fence.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s])
      ])
    }
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.STANDARD[fence.exports.MATHML.STANDARD.length - 1].trim().replace(/ /g, ''))
  })

  test('should export mathml with flavor "ms-office"', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    config.recognition.export.mathml = { flavor: 'ms-office' }
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)
    for(const s of fence.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s])
      ])
    }
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1].trim().replace(/ /g, ''))
  })
  require("../_partials/math/nav-actions-math-undo-redo-test")
})
