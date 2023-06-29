const { getEditorConfiguration, setEditorConfiguration, write, getExportedDatas, waitForEditorWebSocket } = require("../helper")
const { h, hello, helloOneStroke } = require("../strokesDatas")

describe('SmartGuide', () => {
  test('should not display', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.rendering.smartGuide.enable = false
    setEditorConfiguration(page, configuration)
    await waitForEditorWebSocket(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes)
    ])
    expect(await page.locator('.prompter-text').isVisible()).toBe(false)
    expect(await page.locator('.candidates').isVisible()).toBe(false)
  })

  test('should display', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.rendering.smartGuide.enable = true
    setEditorConfiguration(page, configuration)
    await waitForEditorWebSocket(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes)
    ])
    // wait css animation
    await page.waitForTimeout(1000)
    expect(await page.locator('.prompter-text').isVisible()).toBe(true)
    expect(await page.locator('.candidates').isVisible()).toBe(false)
  })

  test('should display text into', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes)
    ])

    const textExpected = h.exports['text/plain'].at(-1)
    const textExpectedWithNbsp = textExpected.replace(/\s/g, '\u00A0')

    const prompterText = await page.waitForSelector('.prompter-text')
    const textContent = await prompterText.evaluate((node) => node.textContent)

    expect(textExpectedWithNbsp).toEqual(textContent)
  })

  test('should select candidate', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, hello.strokes)
    ])

    const jiixExport = JSON.parse(exports['application/vnd.myscript.jiix'])
    expect(await page.innerText('.prompter-text')).toBe(jiixExport.label)
    expect(await page.locator('.candidates').isVisible()).toBe(false)

    await page.click(`.prompter-text > span`)
    expect(await page.locator('.candidates').isVisible()).toBe(true)
    const candidate = jiixExport.words[0].candidates[2]

    await Promise.all([
      getExportedDatas(page),
      page.click(`.candidates > span >> text=${candidate}`)
    ])

    expect(await page.innerText('.prompter-text')).toBe(candidate)
    expect(await page.locator('.candidates').isVisible()).toBe(false)
  })

  test('should convert', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, helloOneStroke.strokes)
    ])
    expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

    let pathElements = page.locator('path')
    expect(await pathElements.count()).toEqual(1)

    await page.click(`.ellipsis`)
    // wait for css animation
    await page.waitForTimeout(1000)

    expect(await page.locator('.more-menu.open').isVisible()).toBe(true)

    await Promise.all([
      getExportedDatas(page),
      page.click(`.more-menu > button >> text=Convert`)
    ])

    pathElements = page.locator('path')
    expect(await pathElements.count()).toEqual(5)
  })

  test.skip('should Copy', async () => {
    await write(page, h.strokes)
    await getExportedDatas(page)
    expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

    let pathElements = page.locator('path')
    expect(await pathElements.count()).toEqual(1)

    await page.click(`.ellipsis`)
    // wait for css animation
    await page.waitForTimeout(1000)

    expect(await page.locator('.more-menu.open').isVisible()).toBe(true)
    await page.click(`.more-menu > button >> text=Copy`)

    const clipboardCopy = page.evaluate(
      `(async () => { return await navigator.clipboard.readText(); })()`
    )
    expect(clipboardCopy).toEqual(h.label)
  })

  test('should Delete', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes)
    ])

    expect(await page.locator('.more-menu.close').isVisible()).toBe(false)

    let pathElements = page.locator('path')
    expect(await pathElements.count()).toEqual(1)

    await page.click(`.ellipsis`)
    // wait for css animation
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
