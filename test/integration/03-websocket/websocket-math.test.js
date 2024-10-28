
const {
  waitForEditorWebSocket,
  writeStrokes,
  getDatasFromExportedEvent,
  getExportsTypeFromEditorModel,
  getEditorConfiguration,
  setEditorConfiguration,
  getConvertsFromEditorModel,
  getExportsFromEditorModel,
  getDatasFromConvertedEvent,
  waitEditorIdle
} = require('../helper')
const { equation1, fence, sum, threeScratchOut, one } = require('../strokesDatas')

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
        writeStrokes(page, [s], 100, 100)
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
        writeStrokes(page, [s], 100, 100)
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

    await writeStrokes(page, equation1.strokes)
    await waitEditorIdle(page)

    const latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml).toBeDefined()
  })

  test('should undo/redo in mode "stroke" by default', async () => {
    const config = await getEditorConfiguration(page)
    expect(config.recognition.math['undo-redo'].mode).toEqual('stroke')

    let latex
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        writeStrokes(page, [s], 100, 100)
      ])
    }
    await waitEditorIdle(page)

    const [clearExport] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#clear')
    ])
    const modelExportCleared = await getExportsFromEditorModel(page)
    if (modelExportCleared) {
      expect(modelExportCleared['application/x-latex']).toEqual('')
      expect(clearExport['application/x-latex']).toEqual('')
    }

    const [undo1Export] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#undo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(undo1Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-1)).toEqual(undo1Export['application/x-latex'])

    await waitEditorIdle(page)
    const [undo2Export] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#undo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(undo2Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-2)).toEqual(undo2Export['application/x-latex'])

    await waitEditorIdle(page)
    const [undo3Export] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#undo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(undo3Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-3)).toEqual(undo3Export['application/x-latex'])

    await waitEditorIdle(page)
    const [redoExport] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#redo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(redoExport['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-2)).toEqual(redoExport['application/x-latex'])
  })

  test('should undo/redo in mode "session"', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/x-latex']
    config.recognition.math['undo-redo'].mode = 'session'
    // 5000 = time to write equation1
    config.recognition.math['session-time'] = 5000
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    let latex
    await writeStrokes(page, equation1.strokes)
    await waitEditorIdle(page)
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX.at(-1))

    const [clearExport] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#clear')
    ])
    const modelExportCleared = await getExportsFromEditorModel(page)
    if (modelExportCleared) {
      expect(modelExportCleared['application/x-latex']).toEqual('')
      expect(clearExport['application/x-latex']).toEqual('')
    }

    await waitEditorIdle(page)
    const [undo1Export] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#undo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(undo1Export['application/x-latex']).toEqual(latex)
    expect(undo1Export['application/x-latex']).toEqual(equation1.exports.LATEX.at(-1))

    await waitEditorIdle(page)
    const [undo2Export] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#undo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(undo2Export['application/x-latex']).toEqual(latex)
    expect(latex).toEqual('')

    await waitEditorIdle(page)
    const [redoExport] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click('#redo')
    ])
    latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(redoExport['application/x-latex']).toEqual(latex)
    expect(redoExport['application/x-latex']).toEqual(equation1.exports.LATEX.at(-1))
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
        writeStrokes(page, [s])
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
        writeStrokes(page, [s])
      ])
    }
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1].trim().replace(/ /g, ''))
  })

  test('should convert svg path', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        writeStrokes(page, [s], 100, 100)
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
        writeStrokes(page, [s])
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
        writeStrokes(page, [s])
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

  test("should work after gesture then undo-redo", async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.gesture.enable = true
    configuration.recognition.math['undo-redo'].mode = 'stroke'
    setEditorConfiguration(page, configuration)
    await waitForEditorWebSocket(page)

    await writeStrokes(page, threeScratchOut.strokes)
    await waitEditorIdle(page)
    const exports = await getExportsFromEditorModel(page)
    const latex = exports["application/x-latex"]
    expect(latex).toEqual("")

    await page.click('#undo')
    await waitEditorIdle(page)
    const [undoRedoModelExport] = await Promise.all([getDatasFromExportedEvent(page), page.click('#redo')])
    const undoRedoExport = undoRedoModelExport["application/x-latex"]
    expect(undoRedoExport).toEqual("")

    const [oneModelExport] = await Promise.all([getDatasFromExportedEvent(page), writeStrokes(page, one.strokes, 100, 150)])
    const oneExport = oneModelExport["application/x-latex"]
    expect(oneExport).toEqual("1")
  })
})
