const {
  waitForEditorWebSocket,
  writeStrokes,
  waitForExportedEvent,
  getExportsTypeFromEditorModel,
  getEditorConfiguration,
  setEditorConfiguration,
  waitEditorIdle,
  getExportsFromEditorModel
} = require("../helper")
const { h, helloStrikeStroke, helloOneStroke } = require("../strokesDatas")

describe("Websocket Text", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_iink.html")
    await Promise.all([
      waitForEditorWebSocket(page),
      page.waitForResponse(req => req.url().includes('/api/v4.0/iink/availableLanguageList'))
    ])
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Websocket Text")
  })

  test("should export application/vnd.myscript.jiix", async () => {
    const [exports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])
    const jiixExpected = h.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    const modelExportJiixReceived = await getExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
    expect(jiixReceived).toEqual(modelExportJiixReceived)
    expect(jiixReceived).toEqual(jiixExpected)
  })

  describe("Gesture", () => {
    test("should apply gesture", async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      const [firstModelExports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, [helloStrikeStroke.strokes[0]])])
      const firstJiixExport = firstModelExports["application/vnd.myscript.jiix"]
      expect(firstJiixExport.label).toEqual(helloStrikeStroke.exports["text/plain"][0])

      const [secondModelExports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, [helloStrikeStroke.strokes[1]])])
      const secondJiixExport = secondModelExports["application/vnd.myscript.jiix"]
      expect(secondJiixExport.label).toEqual("")
    })

    test("should not apply gesture", async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = false
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      const [firstModelExports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, [helloStrikeStroke.strokes[0]])])
      const firstJiixExport = firstModelExports["application/vnd.myscript.jiix"]
      expect(firstJiixExport.label).toEqual(helloStrikeStroke.exports["text/plain"][0])

      const [secondModelExports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, [helloStrikeStroke.strokes[1]])])
      const secondJiixExport = secondModelExports["application/vnd.myscript.jiix"]
      expect(secondJiixExport.label).not.toEqual("")
    })

    test("should work after gesture then undo-redo", async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      await setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)
      await writeStrokes(page, [helloStrikeStroke.strokes[0]])
      const [secondModelExports] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, [helloStrikeStroke.strokes[1]])])
      const secondJiixExport = secondModelExports["application/vnd.myscript.jiix"]
      expect(secondJiixExport.label).toEqual("")
      await page.click('#undo')
      await waitEditorIdle(page)
      const [undoRedoModelExport] = await Promise.all([waitForExportedEvent(page), page.click('#redo')])
      const undoRedoJiixExport = undoRedoModelExport["application/vnd.myscript.jiix"]
      expect(undoRedoJiixExport.label).toEqual("")
      const [helloModelExport] = await Promise.all([waitForExportedEvent(page), writeStrokes(page, helloOneStroke.strokes)])
      const helloJiixExport = helloModelExport["application/vnd.myscript.jiix"]
      expect(helloJiixExport.label).toEqual("hello")
    })
  })

  describe("SmartGuide", () => {
    beforeAll(async () => {
      await page.reload()
      await Promise.all([
        waitForEditorWebSocket(page),
        page.waitForResponse(req => req.url().includes('/api/v4.0/iink/availableLanguageList'))
      ])
      await waitEditorIdle(page)
    })
    test("should not display", async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = false
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      await Promise.all([waitForExportedEvent(page), writeStrokes(page, h.strokes)])

      // wait css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".prompter-text").isVisible()).toBe(false)
      expect(await page.locator(".candidates").isVisible()).toBe(false)
    })

    test("should display", async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = true
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      // wait css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".smartguide").isVisible()).toBe(true)
    })

    test("should display text into", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes)
      ])
      await waitEditorIdle(page)

      const textExpected = h.exports["text/plain"].at(-1)
      const textExpectedWithNbsp = textExpected.replace(/\s/g, "\u00A0")

      expect(await page.locator(".prompter-text").isVisible()).toBe(true)
      const prompterText = await page.waitForSelector(".prompter-text")
      const textContent = await prompterText.evaluate((node) => node.textContent)

      expect(textExpectedWithNbsp).toEqual(textContent)
    })

    test("should select candidate", async () => {
      const jiixExport = await getExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
      expect(await page.innerText(".prompter-text")).toBe(jiixExport.label)
      expect(await page.locator(".candidates").isVisible()).toBe(false)

      // wait css animation
      await page.waitForTimeout(1000)
      await page.click(`.prompter-text > span`)
      expect(await page.locator(".candidates").isVisible()).toBe(true)
      const candidate = jiixExport.words[0].candidates[2]

      await Promise.all([waitForExportedEvent(page), page.click(`.candidates > span >> text=${ candidate }`)])

      expect(await page.innerText(".prompter-text")).toBe(candidate)
      expect(await page.locator(".candidates").isVisible()).toBe(false)
    })

    test("should open menu more", async () => {
      expect(await page.locator(".more-menu.close").isVisible()).toBe(false)
      await page.click(`.ellipsis`)
      // wait for css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".more-menu.open").isVisible()).toBe(true)
    })

    test("should convert", async () => {
      const wrotePath = await page.locator("path").first().getAttribute("d")
      await Promise.all([waitForExportedEvent(page), page.click(`.more-menu > button >> text=Convert`)])

      const convert = await getExportsFromEditorModel(page)
      expect(convert).toBeDefined()

      const convertedPath = await page.locator("path").first().getAttribute("d")
      expect(wrotePath).not.toEqual(convertedPath)
    })

    test("should close menu more after convert", async () => {
      // wait for css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".more-menu.close").isVisible()).toBe(false)
    })

    test.skip("should Copy", async () => {
      await writeStrokes(page, h.strokes)
      await waitForExportedEvent(page)
      expect(await page.locator(".more-menu.close").isVisible()).toBe(false)

      let pathElements = page.locator("path")
      expect(await pathElements.count()).toEqual(1)

      await page.click(`.ellipsis`)
      // wait for css animation
      await page.waitForTimeout(1000)

      expect(await page.locator(".more-menu.open").isVisible()).toBe(true)
      await page.click(`.more-menu > button >> text=Copy`)

      const clipboardCopy = page.evaluate(`(async () => { return await navigator.clipboard.readText() })()`)
      expect(clipboardCopy).toEqual(h.label)
    })

    test("should Delete", async () => {
      await page.click(`.ellipsis`)
      // wait for css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".more-menu.open").isVisible()).toBe(true)

      await Promise.all([waitForExportedEvent(page), page.click(`.more-menu > button >> text=Delete`)])

      // wait for css animation
      await page.waitForTimeout(1000)

      pathElements = page.locator("path")
      expect(await pathElements.count()).toEqual(0)
    })

    test("should close menu more after delete", async () => {
      // wait for css animation
      await page.waitForTimeout(1000)
      expect(await page.locator(".more-menu.close").isVisible()).toBe(false)
    })
  })

  require("../_partials/text/nav-actions-text-clear-test")
  require("../_partials/text/nav-actions-text-language-test")
  require("../_partials/text/nav-actions-text-undo-redo-test")
})
