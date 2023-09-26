
const {
  waitForEditorWebSocket,
  write,
  getExportedDatas,
  getEditorModelExportsType,
  getEditorConfiguration,
  setEditorConfiguration,
  getEditorModelConverts,
  getConvertedDatas,
  waitEditorIdle
} = require('../helper')
const { equation1, fence, sum } = require('../strokesDatas')

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink_convert.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math Convert')
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

    await waitEditorIdle(page)
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
})
