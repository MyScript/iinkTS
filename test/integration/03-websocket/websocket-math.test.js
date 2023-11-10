
const {
  waitForEditorWebSocket,
  write,
  getDatasFromExportedEvent,
  getExportsTypeFromEditorModel,
  getEditorConfiguration,
  setEditorConfiguration,
  getConvertsFromEditorModel,
  getDatasFromConvertedEvent,
  waitEditorIdle
} = require('../helper')
const { equation1, fence, sum } = require('../strokesDatas')

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

  test('should convert svg path', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s], 100, 100)
      ])
    }
    const emptyConvert = await getConvertsFromEditorModel(page)
    expect(emptyConvert).toBeUndefined()
    expect(await page.locator('path').count()).toEqual(equation1.strokes.length)

    await Promise.all([
      getDatasFromConvertedEvent(page),
      page.click('#convert')
    ])

    await waitEditorIdle(page)
    expect(await page.locator('path').count()).toEqual(equation1.exports.LATEX.at(-1).length)

    const convert = await getConvertsFromEditorModel(page)
    const latexExport = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(convert['application/x-latex']).toEqual(latexExport)
    expect(latexExport).toEqual(equation1.exports.LATEX.at(-1))
  })

  test('should convert and solve sum by default', async () => {
    const config = await getEditorConfiguration(page)
    expect(config.recognition.math.solver.enable).toEqual(true)
    let numStroke = 0
    for(const s of sum.strokes) {
      const [exports] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s])
      ])
      expect(exports['application/x-latex']).toEqual(sum.exports.LATEX.at(numStroke))
      numStroke++
    }
    const emptyConvert = await getConvertsFromEditorModel(page)
    expect(emptyConvert).toBeUndefined()

    await Promise.all([
      getDatasFromConvertedEvent(page),
      page.click('#convert')
    ])
    const convert = await getConvertsFromEditorModel(page)
    expect(convert['application/x-latex']).toEqual(sum.exports.LATEX.at(-1))
    expect(await page.locator('#result').locator('.katex-html').textContent()).toEqual(sum.exports.LATEX.at(-1))
  })

  test('should convert and not solve sum', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.solver.enable = false
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    let numStroke = 0
    for(const s of sum.strokes) {
      const [exports] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s])
      ])
      expect(exports['application/x-latex']).toEqual(sum.exports.LATEX.at(numStroke))
      numStroke++
    }
    const emptyConvert = await getConvertsFromEditorModel(page)
    expect(emptyConvert).toBeUndefined()

    await Promise.all([
      getDatasFromConvertedEvent(page),
      page.click('#convert')
    ])
    const convert = await getConvertsFromEditorModel(page)
    const latexExport = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(convert['application/x-latex']).toEqual(latexExport)
    expect(latexExport).toEqual(sum.exports.LATEX.at(-2))
    expect(await page.locator('#result').locator('.katex-html').textContent()).toEqual(sum.exports.LATEX.at(-2))
  })

  require("../_partials/math/nav-actions-math-clear-test")
  require("../_partials/math/nav-actions-math-undo-redo-test")
})
