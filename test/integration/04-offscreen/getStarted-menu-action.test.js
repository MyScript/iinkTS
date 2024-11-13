const {
  waitEditorIdle,
  waitForEditorOffscreen,
  writePointers,
  writeStrokes,
  sendAndGetExportsTypeFromEditorModel,
  waitForLoadedEvent,
  waitForUIUpdatedEvent,
  waitForChangedEvent,
  waitForConvertedEvent,
  waitForExportedEvent,
  waitForSynchronizedEvent,
  waitForGesturedEvent,
  waitForToolChangedEvent
} = require("../helper")
const locator = require("../locators")

const { helloOneStroke, helloOneInsert, laLecon, helloStrikeStroke, helloOneSurrounded } = require("../strokesDatas")

describe("Offscreen Get Started", () => {
  beforeAll(async () => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorOffscreen(page)
    await waitEditorIdle(page)
  })

  describe("clear, undo and redo", () => {
    beforeAll(async () => {
      await page.evaluate("editor.clear()")
    })

    test("write stroke", async () => {
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
      await writeStrokes(page, helloOneStroke.strokes)
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
    })

    test("should undo the last stroke written ", async () => {
      const undoBtn = await page.locator(locator.menu.action.undo)
      expect(await undoBtn.isVisible()).toEqual(true)
      await undoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
    })

    test("should redo the last stroke written", async () => {
      const redoBtn = await page.locator(locator.menu.action.redo)
      expect(await redoBtn.isVisible()).toEqual(true)
      await redoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
    })

    test("should convert stroke to text", async () => {
      await page.evaluate("editor.convert()")
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      const textId = symbols[0].id
      const textEl = await page.waitForSelector(`#${ textId }`)
      expect(await textEl.textContent()).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    test("should undo convert", async () => {
      const undoBtn = await page.locator(locator.menu.action.undo)
      expect(await undoBtn.isVisible()).toEqual(true)
      await undoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
      const jiix = await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
      expect(jiix).toBeDefined()
      expect(jiix.elements).toBeDefined()
      expect(jiix.elements).toHaveLength(1)
      expect(jiix.elements[0].type).toStrictEqual("Text")
      const text = jiix.elements[0].label
      expect(text).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    test("should redo convert", async () => {
      const redoBtn = await page.locator(locator.menu.action.redo)
      expect(await redoBtn.isVisible()).toEqual(true)
      await redoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      const textIdRedo = symbols[0].id
      const textElRedo = await page.waitForSelector(`#${ textIdRedo }`)
      expect(await textElRedo.textContent()).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    test("should clear model", async () => {
      await page.evaluate("editor.clear()")
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
    })

    test("should undo clear", async () => {
      const undoBtn = await page.locator(locator.menu.action.undo)
      expect(await undoBtn.isVisible()).toEqual(true)
      await undoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      const textIdUndo = symbols[0].id
      const textElUndo = await page.waitForSelector(`#${ textIdUndo }`)
      expect(await textElUndo.textContent()).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    test("should redo clear", async () => {
      const redoBtn = await page.locator(locator.menu.action.redo)
      expect(await redoBtn.isVisible()).toEqual(true)
      await redoBtn.click()
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
    })
  })

  describe("convert", () => {
    beforeAll(async () => {
      await page.evaluate("editor.clear()")
    })

    test("should write text", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes)
      ])
      await page.evaluate("editor.behaviors.synchronizeStrokesWithJIIX()")
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].kind).toEqual("text")
    })

    test("should convert stroke to text", async () => {
      await Promise.all([
        waitForConvertedEvent(page),
        page.click(locator.menu.action.convert, { timeout: 1000 })
      ])
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      expect(symbols[0].chars.map(c => c.label).join("")).toEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    test("should display text", async () => {
      const textSymbolId = await page.evaluate("editor.model.symbols[0].id")
      const textElConvert = await page.waitForSelector(`#${ textSymbolId }`)
      expect(await textElConvert.textContent()).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })
  })

  describe("language", () => {
    beforeAll(async () => {
      await page.evaluate("editor.clear()")
    })

    test("should not recognize french text", async () => {
      //write something in French with a typical French character: ç
      await writeStrokes(page, laLecon.strokes)
      await page.evaluate("editor.behaviors.synchronizeStrokesWithJIIX()")
      const jiix = await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
      const symbols = await page.evaluate("editor.model.symbols")

      expect(symbols).toHaveLength(laLecon.exports["application/vnd.myscript.jiix"].words.length)
      expect(symbols[0].label).not.toEqual(jiix.elements[0].label)
      expect(laLecon.exports["application/vnd.myscript.jiix"].label).not.toEqual(jiix.elements[0].label)
    })

    test("should display language list", async () => {
      const languageBtn = page.locator(locator.menu.action.language.inputSelect)
      expect(await languageBtn.isVisible()).toEqual(true)
      await languageBtn.click()
      const languageOptions = await page.locator(locator.menu.action.language.inputSelect + " option").all()
      expect(languageOptions.length).toBeGreaterThan(0)
    })

    test("should change langage and conserve stroke", async () => {
      await Promise.all([
        waitForLoadedEvent(page),
        page.locator(locator.menu.action.language.inputSelect).selectOption({ value: "fr_FR" })
      ])
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(laLecon.exports["application/vnd.myscript.jiix"].words.length)
    })

    test("should recognize french text", async () => {
      await page.evaluate("editor.behaviors.synchronizeStrokesWithJIIX()")
      const jiix = await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
      expect(jiix.elements).toHaveLength(1)
      expect(laLecon.exports["application/vnd.myscript.jiix"].label).toEqual(jiix.elements[0].label)
    })
  })

  describe("strikethrough", () => {
    beforeAll(async () => {
      await page.evaluate("editor.clear()")
    })

    test("should not display menu gesture", async () => {
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(false)
    })

    test("should display menu gesture", async () => {
      const menuActionBtn = await page.locator(locator.menu.action.triggerBtn)
      expect(await menuActionBtn.isVisible()).toEqual(true)
      await menuActionBtn.click()
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(true)
      await menuActionGestureBtn.click()
    })

    test("should define strikethrough on draw", async () => {
      //check the detect gestures is activate
      await page.getByRole("checkbox", { id: locator.menu.action.gesture.detect }).check()
      const strikeThrough = await page.waitForSelector(locator.menu.action.gesture.strikeThrough)
      await strikeThrough.selectOption({ value: "draw" })
    })

    test("should draw strikethrough on stroke", async () => {
      for (s of helloStrikeStroke.strokes) {
        await Promise.all([
          waitForSynchronizedEvent(page),
          writeStrokes(page, [s])
        ])
      }
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].decorators).toHaveLength(1)
      const strikeThrough = symbols[0].decorators[0]
      expect(strikeThrough.kind).toEqual("strikethrough")

      const groupId = symbols[0].id
      const strikeThroughEl = page.locator(`#${ groupId } #${ strikeThrough.id }`)
      // expect(await strikeThroughEl.isVisible()).toEqual(true)
      expect(await strikeThroughEl.getAttribute("kind")).toContain("strikethrough")
    })

    test("should conserve strikethrough when convert", async () => {
      await page.evaluate("editor.convert()")
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      const text = symbols[0]
      expect(text.type).toEqual("text")
      expect(text.decorators).toHaveLength(1)
      const strikeThrough = text.decorators[0]
      expect(strikeThrough.kind).toEqual("strikethrough")

      const textEl = await page.waitForSelector(`#${ text.id }`)
      //verify strikeThrough did not erase the text
      expect(await textEl.textContent()).toStrictEqual(helloStrikeStroke.exports["text/plain"][0])

      const strikeThroughEl = page.locator(`#${ text.id } #${ strikeThrough.id }`)
      expect(await strikeThroughEl.getAttribute("kind")).toContain("strikethrough")
    })

    test("should define strikethrough on erase", async () => {
      await page.evaluate("editor.clear()")
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      //check the detect gestures is activated
      const menuActionBtn = await page.locator(locator.menu.action.triggerBtn).first()
      expect(await menuActionBtn.isVisible()).toEqual(true)
      await menuActionBtn.click()

      //open gestures sub menu
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(true)
      await menuActionGestureBtn.click()

      //check the detect gestures checkbox
      await page.getByRole("checkbox", { id: locator.menu.action.gesture.detect }).check()

      //select draw on strikethrough
      const strikeThroughMenu = await page.waitForSelector(locator.menu.action.gesture.strikeThrough)
      await strikeThroughMenu.selectOption({ value: "erase" })
    })

    test("should erase stroke when strikethrough", async () => {
      // write again only the hello without the strikethrough
      await writePointers(page, helloStrikeStroke.strokes[0].pointers)
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      const exportPromise = waitForExportedEvent(page)
      // write the strike through
      await writePointers(page, helloStrikeStroke.strokes[1].pointers)
      await exportPromise
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
    })
  })

  describe("surround", () => {
    beforeAll(async () => {
      await page.evaluate("editor.clear()")
    })

    test("should not display menu gesture", async () => {
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(false)
    })

    test("should display menu gesture", async () => {
      const menuActionBtn = await page.locator(locator.menu.action.triggerBtn)
      expect(await menuActionBtn.isVisible()).toEqual(true)
      await menuActionBtn.click()
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(true)
      await menuActionGestureBtn.click()
    })

    test("should define surround on select", async () => {
      //check the detect gestures checkbox
      await page.getByRole("checkbox", { id: locator.menu.action.gesture.detect }).check()

      //select draw on surround
      const surround = await page.waitForSelector(locator.menu.action.gesture.surround)
      await surround.selectOption({ value: "select" })
    })

    test("write hello in one stroke", async () => {
      await Promise.all([
        waitForUIUpdatedEvent(page),
        writePointers(page, helloOneSurrounded.strokes[0].pointers)
      ])
    })

    test("verify context wrapper is not visible", async () => {
      expect(await page.locator(locator.menu.context.wrapper).isVisible()).toEqual(false)
    })

    test("verify menu intention is still set on writing mode", async () => {
      let menuSelect = await page.locator(locator.menu.intention.select)
      expect(await menuSelect.isVisible()).toEqual(true)
      expect(await menuSelect.getAttribute("class")).not.toContain("active")

      let writeBtn = await page.locator(locator.menu.intention.writePencil)
      expect(await writeBtn.isVisible()).toEqual(true)
      expect(await writeBtn.getAttribute("class")).toContain("active")
    })

    test("write surround", async () => {
      const changedPromise = waitForChangedEvent(page)
      const uiPromise = waitForUIUpdatedEvent(page)
      await writePointers(page, helloOneSurrounded.strokes[1].pointers)
      await changedPromise
      await uiPromise
    })

    test("verify context wrapper is visible", async () => {
      await page.waitForTimeout(300)
      expect(await page.locator(locator.menu.context.wrapper).isVisible()).toEqual(true)
      let menuSelect = await page.locator(locator.menu.intention.select)
      expect(await menuSelect.isVisible()).toEqual(true)
      expect(await menuSelect.getAttribute("class")).toContain("active")
    })

    test("clear the editor before setting surround parameter on draw", async () => {
      //clear the editor
      await page.evaluate("editor.clear()")
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)
    })

    test("should define surround on draw surround", async () => {
      //first detect the gestures
      //open action menu
      const menuActionBtn = await page.locator(locator.menu.action.triggerBtn).first()
      expect(await menuActionBtn.isVisible()).toEqual(true)
      await menuActionBtn.click()

      //open gestures sub menu
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(true)
      await menuActionGestureBtn.click()

      //check the detect gestures checkbox
      await page.getByRole("checkbox", { id: locator.menu.action.gesture.detect }).check()

      //select surround on surround
      const surround = await page.waitForSelector(locator.menu.action.gesture.surround)
      await surround.selectOption({ value: "surround" })
    })

    test("write again hello surrounded", async () => {
      //write something with surround
      const uiUpdatedPromise = waitForUIUpdatedEvent(page)
      await writeStrokes(page, helloOneSurrounded.strokes)
      const jiix = await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")
      await waitEditorIdle(page)
      await uiUpdatedPromise
    })

    test("should draw surround on text", async () => {
      //verify surround is drawn arround the text
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].kind).toEqual("text")
      expect(symbols[0].decorators).toHaveLength(1)
      expect(symbols[0].decorators[0].kind).toEqual("surround")
      expect(symbols[0].deleting).toEqual(false)
      const groupId = symbols[0].id
      const groupEl = page.locator(`#${ groupId }`)
      const groupElSVG = await groupEl.innerHTML()
      expect(groupElSVG).toContain('type="stroke"')
      expect(groupElSVG).toContain("<path ")
      expect(groupElSVG).toContain("<rect ")
      expect(groupElSVG).toContain('id="' + symbols[0].decorators[0].id + '"')
      expect(groupElSVG).toContain('kind="surround"')
    })

    test("verify surround is kept after convert", async () => {
      //now convert
      await page.evaluate("editor.convert()")

      //verify surround is still drawn arround the text
      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      expect(symbols[0].decorators).toHaveLength(1)
      expect(symbols[0].decorators[0].kind).toEqual("surround")
      const rectEl = page.locator(`#${ symbols[0].decorators[0].id }`)

      expect(await rectEl.count()).toEqual(1)
      expect(await rectEl.getAttribute("type")).toEqual("decorator")
      expect(await rectEl.getAttribute("kind")).toEqual("surround")
      expect(await rectEl.getAttribute("fill")).toEqual("transparent")
      expect(await rectEl.getAttribute("stroke")).toEqual(symbols[0].decorators[0].style.color)
    })
  })

  describe("insert gesture", () => {
    beforeAll(async () => {
      await page.reload({ waitUntil: 'load' })
      await waitEditorIdle(page)
    })

    test("should not display menu gesture", async () => {
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(false)
    })

    test("should display menu gesture", async () => {
      const menuActionBtn = await page.locator(locator.menu.action.triggerBtn)
      expect(await menuActionBtn.isVisible()).toEqual(true)
      await menuActionBtn.click()
      const menuActionGestureBtn = await page.locator(locator.menu.action.gesture.triggerBtn)
      expect(await menuActionGestureBtn.isVisible()).toEqual(true)
      await menuActionGestureBtn.click()
    })

    test("should define insert on insert", async () => {
      //check the detect gestures is activate
      await page.getByRole("checkbox", { id: locator.menu.action.gesture.detect }).check()
      await page.locator(locator.menu.action.gesture.insert).selectOption({ value: "insert" })
    })

    test("should write the stroke", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writePointers(page, helloOneInsert.strokes[0].pointers)
      ])
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].kind).toEqual("text")
    })

    test("should draw insert on stroke ", async () => {
      await Promise.all([
        waitForGesturedEvent(page),
        writePointers(page, helloOneInsert.strokes[1].pointers)
      ])
    })

    test("should separate stroke in 2 ", async () => {
      // necessary to ensure that recognition is completed
      await page.evaluate("editor.behaviors.synchronizeStrokesWithJIIX()")
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(2)
      expect(symbols[0]).toEqual(expect.objectContaining({
        type: "recognized",
        kind: "text",
        label: "hel"
      }))
      expect(symbols[1]).toEqual(expect.objectContaining({
        type: "recognized",
        kind: "text",
        label: "to"
      }))

      const helElBox = await page.locator(`#${ symbols[0].id }`).boundingBox()
      const toElBox = await page.locator(`#${ symbols[1].id }`).boundingBox()

      // check 2nd word is separated from the first by at least 50px
      expect(toElBox.x - helElBox.x - helElBox.width).toBeGreaterThan(50)
    })

    test("insert should be kept on convert", async () => {
      //convert
      const convertBtn = await page.locator(locator.menu.action.convert)
      expect(await convertBtn.isEnabled()).toEqual(true)
      await Promise.all([
        waitForConvertedEvent(page),
        convertBtn.click()
      ])

      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(2)
      const hel = symbols[0]
      expect(hel.type).toEqual("text")
      const to = symbols[1]
      expect(to.type).toEqual("text")

      expect(await page.locator(`#${hel.id}`).textContent()).toEqual("hel")
      expect( await page.locator(`#${to.id}`).textContent()).toEqual("to")
      //verify 2nd word is separated from the first by at least 10px
      expect(to.bounds.x - hel.bounds.x - hel.bounds.width).toBeGreaterThan(10)
    })

    test("insert should separate word on convert", async () => {
      //clear the editor
      await page.evaluate("editor.clear()")
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      //write again and convert 
      await writePointers(page, helloOneInsert.strokes[0].pointers)
      await page.evaluate("editor.convert()")
      await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")

      //write the insert between the 2 l
      await writePointers(page, helloOneInsert.strokes[1].pointers, 0, -20)
      await sendAndGetExportsTypeFromEditorModel(page, "application/vnd.myscript.jiix")

      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(2)
      const hel = symbols[0]
      expect(hel.type).toEqual("text")
      const lo = symbols[1]
      expect(lo.type).toEqual("text")

      const helText = await page.locator(`#${ hel.id }`).textContent()
      const loText = await page.locator(`#${ lo.id }`).textContent()
      expect(helText).toEqual(hel.chars.map(c => c.label).join(''))
      expect(loText).toEqual(lo.chars.map(c => c.label).join(''))
      //verify 2nd word is separatedr fom the first by at least 10px
      expect(lo.bounds.x - hel.bounds.x - hel.bounds.width).toBeGreaterThan(10)
    })

  })
})
