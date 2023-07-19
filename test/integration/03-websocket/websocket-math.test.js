
const { waitForEditorWebSocket, write, getExportedDatas, getEditorModelExportsType, getEditorConfiguration, setEditorConfiguration, getEditorModelConverts, getConvertedDatas, getEditorModelExports } = require('../helper')
const { equation1, fence, sum } = require('../strokesDatas')

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await page.waitForTimeout(1000)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math')
  })

  test('should only export latex by default', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toBeDefined()
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export jiix', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix']
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeDefined()
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export mathml+xml', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeDefined()
  })

  test('should undo/redo in mode "stroke" by default', async () => {
    const config = await getEditorConfiguration(page)
    expect(config.recognition.math['undo-redo'].mode).toEqual('stroke')

    let latex
    let nbStroke = 0
    for(const s of equation1.strokes) {
      const [exports] = await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
      expect(equation1.exports.LATEX.at(nbStroke)).toEqual(exports['application/x-latex'])
      nbStroke++
    }

    const [clearExport] = await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])
    const modelExportCleared = await getEditorModelExports(page)
    if (modelExportCleared) {
      expect(modelExportCleared['application/x-latex']).toEqual('')
      expect(clearExport['application/x-latex']).toEqual('')
    }

    const [undo1Export] = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo1Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-1)).toEqual(undo1Export['application/x-latex'])

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(100)
    const [undo2Export] = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo2Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-2)).toEqual(undo2Export['application/x-latex'])

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(100)
    const [undo3Export] = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo3Export['application/x-latex']).toEqual(latex)
    expect(equation1.exports.LATEX.at(-3)).toEqual(undo3Export['application/x-latex'])

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(100)
    const [redoExport] = await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
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
    await Promise.all([
      getExportedDatas(page),
      write(page, equation1.strokes)
    ])
    // To wait for the end of writing
    await page.waitForTimeout(1000)
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX.at(-1))

    const [clearExport] = await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])
    const modelExportCleared = await getEditorModelExports(page)
    if (modelExportCleared) {
      expect(modelExportCleared['application/x-latex']).toEqual('')
      expect(clearExport['application/x-latex']).toEqual('')
    }

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(500)
    const [undo1Export] = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo1Export['application/x-latex']).toEqual(latex)
    expect(undo1Export['application/x-latex']).toEqual(equation1.exports.LATEX.at(-1))

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(500)
    const [undo2Export] = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo2Export['application/x-latex']).toEqual(latex)
    expect(latex).toEqual('')

    // To wait for second export raise on undo/redo
    await page.waitForTimeout(500)
    const [redoExport] = await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(redoExport['application/x-latex']).toEqual(latex)
    expect(redoExport['application/x-latex']).toEqual(equation1.exports.LATEX.at(-1))
  })

  test('should convert svg path', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const emptyConvert = await getEditorModelConverts(page)
    expect(emptyConvert).toBeUndefined()
    expect(await page.locator('path').count()).toEqual(equation1.strokes.length)

    await Promise.all([
      getConvertedDatas(page),
      page.click('#convert')
    ])
    //To await for rendering
    await page.waitForTimeout(1000)
    expect(await page.locator('path').count()).toEqual(equation1.exports.LATEX.at(-1).length)

    const convert = await getEditorModelConverts(page)
    const laextExport = await getEditorModelExportsType(page, 'application/x-latex')
    expect(convert['application/x-latex']).toEqual(laextExport)
    expect(laextExport).toEqual(equation1.exports.LATEX.at(-1))
  })

  test('should convert and solve sum by default', async () => {
    const config = await getEditorConfiguration(page)
    expect(config.recognition.math.solver.enable).toEqual(true)
    let numStroke = 0
    for(const s of sum.strokes) {
      const [exports] = await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
      expect(exports['application/x-latex']).toEqual(sum.exports.LATEX.at(numStroke))
      numStroke++
    }
    const emptyConvert = await getEditorModelConverts(page)
    expect(emptyConvert).toBeUndefined()

    await Promise.all([
      getConvertedDatas(page),
      page.click('#convert')
    ])
    const convert = await getEditorModelConverts(page)
    expect(convert['application/x-latex']).toEqual(sum.converts.LATEX.at(-1))
    expect(await page.locator('#result').locator('.katex-html').textContent()).toEqual(sum.converts.LATEX.at(-1))
  })

  test('should convert and not solve sum', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.solver.enable = false
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    let numStroke = 0
    for(const s of sum.strokes) {
      const [exports] = await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
      expect(exports['application/x-latex']).toEqual(sum.exports.LATEX.at(numStroke))
      numStroke++
    }
    const emptyConvert = await getEditorModelConverts(page)
    expect(emptyConvert).toBeUndefined()

    await Promise.all([
      getConvertedDatas(page),
      page.click('#convert')
    ])
    const convert = await getEditorModelConverts(page)
    const laextExport = await getEditorModelExportsType(page, 'application/x-latex')
    expect(convert['application/x-latex']).toEqual(laextExport)
    expect(laextExport).toEqual(sum.exports.LATEX.at(-1))
    expect(await page.locator('#result').locator('.katex-html').textContent()).toEqual(sum.exports.LATEX.at(-1))
  })

  test('should export mathml with flavor "standard"', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    config.recognition.export.mathml = { flavor: 'standard' }
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)
    for(const s of fence.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 175)
      ])
    }
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
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
        getExportedDatas(page),
        write(page, [s], 100, 175)
      ])
    }
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1].trim().replace(/ /g, ''))
  })
})
