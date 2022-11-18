const {
  write,
  getExportedDatas,
  waitEditorLoaded,
  setEditorConfiguration,
  getEditorConfiguration,
} = require('../helper')
const {
  h,
  hello,
  helloOneStroke,
  helloStrikeStroke,
} = require('../strokesDatas')

describe('Websocket Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_iink.html')
  })

  beforeEach(async () => {
    await page.reload()
    await waitEditorLoaded(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Text iink')
  })

  test('should export application/vnd.myscript.jiix', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes, 100, 100),
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = JSON.parse(exports['application/vnd.myscript.jiix'])
    expect(jiixReceived).toStrictEqual(jiixExpected)
  })

  describe('SmartGuide', () => {
    test('should not display SmartGuide', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = false
      setEditorConfiguration(page, configuration)
      await waitEditorLoaded(page)

      await write(page, hello.strokes, 100, 100)
      await getExportedDatas(page)
      expect(await page.locator('.prompter-text').isVisible()).toBe(false)
      expect(await page.locator('.candidates').isVisible()).toBe(false)
    })

    test('should display SmartGuide', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = true
      setEditorConfiguration(page, configuration)
      await waitEditorLoaded(page)

      await write(page, hello.strokes, 100, 100)
      await getExportedDatas(page)
      expect(await page.locator('.prompter-text').isVisible()).toBe(true)
      expect(await page.locator('.candidates').isVisible()).toBe(false)
    })

    test('should display text into SmartGuide', async () => {
      await write(page, hello.strokes, 100, 100)
      await getExportedDatas(page)

      const textExpected = hello.exports['text/plain'].at(-1)
      const textExpectedWithNbsp = textExpected.replace(/\s/g, '\u00A0')

      const prompterText = await page.waitForSelector('.prompter-text')
      const textContent = await prompterText.evaluate(
        (node) => node.textContent
      )

      expect(textExpectedWithNbsp).toEqual(textContent)
    })

    test('should select candidate', async () => {
      await write(page, helloOneStroke.strokes, 20, 175)
      const exports = await getExportedDatas(page)
      const jiixExport = JSON.parse(exports['application/vnd.myscript.jiix'])

      expect(await page.innerText('.prompter-text')).toBe(jiixExport.label)
      expect(await page.locator('.candidates').isVisible()).toBe(false)

      await page.click(`.prompter-text > span`)
      expect(await page.locator('.candidates').isVisible()).toBe(true)

      const candidate = jiixExport.words[0].candidates[3]

      await page.click(`.candidates > span >> text=${candidate}`)
      await page.waitForTimeout(1000)
      expect(await page.innerText('.prompter-text')).toBe(candidate)
      expect(await page.locator('.candidates').isVisible()).toBe(false)
    })

    test('should convert', async () => {
      await write(page, helloOneStroke.strokes, 20, 175)
      await getExportedDatas(page)
      expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

      let pathElements = page.locator('path')
      expect(await pathElements.count()).toEqual(1)

      await page.click(`.ellipsis`)
      await page.waitForTimeout(1000)

      expect(await page.locator('.more-menu.open').isVisible()).toBe(true)
      const convertPormise = getExportedDatas(page)
      await page.click(`.more-menu > button >> text=Convert`)

      await convertPormise

      pathElements = page.locator('path')
      expect(await pathElements.count()).toEqual(5)
    })

    test.skip('should Copy', async () => {
      await write(page, h.strokes, 20, 175)
      await getExportedDatas(page)
      expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

      let pathElements = page.locator('path')
      expect(await pathElements.count()).toEqual(1)

      await page.click(`.ellipsis`)
      await page.waitForTimeout(1000)

      expect(await page.locator('.more-menu.open').isVisible()).toBe(true)
      await page.click(`.more-menu > button >> text=Copy`)

      const clipboardCopy = page.evaluate(
        `(async () => { return await navigator.clipboard.readText(); })()`
      )
      expect(clipboardCopy).toEqual(h.label)
    })

    test('should Delete', async () => {
      await write(page, h.strokes, 20, 175)
      await getExportedDatas(page)
      expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

      let pathElements = page.locator('path')
      expect(await pathElements.count()).toEqual(1)

      await page.click(`.ellipsis`)
      await page.waitForTimeout(1000)

      expect(await page.locator('.more-menu.open').isVisible()).toBe(true)

      await Promise.all([
        getExportedDatas(page),
        page.click(`.more-menu > button >> text=Delete`),
      ])

      pathElements = page.locator('path')
      expect(await pathElements.count()).toEqual(0)
    })
  })

  describe('Gesture', () => {
    test('should apply gesture', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      setEditorConfiguration(page, configuration)
      await waitEditorLoaded(page)

      await write(page, helloStrikeStroke.strokes, 100, 100)
      const myExports = await getExportedDatas(page)

      jiixExport = JSON.parse(myExports['application/vnd.myscript.jiix'])
      expect(jiixExport.label).toEqual('')
    })

    test('should not apply gesture', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = false
      setEditorConfiguration(page, configuration)
      await waitEditorLoaded(page)

      await write(page, helloStrikeStroke.strokes, 100, 100)
      const myExports = await getExportedDatas(page)

      jiixExport = JSON.parse(myExports['application/vnd.myscript.jiix'])
      expect(jiixExport.label).not.toEqual('')
    })
  })
})
