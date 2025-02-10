import { test, expect } from "@playwright/test"
import {
  callEditorIdle,
  waitForEditorInit,
  writePointers,
  writeStrokes,
  callEditorExport,
  waitForLoadedEvent,
  waitForUIUpdatedEvent,
  waitForChangedEvent,
  waitForConvertedEvent,
  waitForExportedEvent,
  waitForSynchronizedEvent,
  waitForGesturedEvent,
  getEditorSymbols,
  getEditorExportsType,
  callEditorSynchronize
} from "../helper"
import locator from "../locators"
import laLecon from "../__dataset__/laLecon"
import helloStrike from "../__dataset__/helloStrike"
import helloInsert from "../__dataset__/helloInsert"
import helloOneStroke from "../__dataset__/helloOneStroke"
import helloOneStrokeSurrounded from "../__dataset__/helloOneStrokeSurrounded"

test.describe("Offscreen Get Started Menu Action", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/offscreen-interactivity/index.html")
    await waitForEditorInit(page)
    await callEditorIdle(page)
  })

  test("clear, undo and redo", async ({ page }) => {
    await test.step("write stroke", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes)
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].label).toEqual(helloOneStroke.exports["text/plain"].at(-1))
    })

    await test.step("should undo the last stroke written", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.undoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(0)
    })

    await test.step("should redo the last stroke written", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.redoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
    })

    await test.step("should convert stroke to text", async () => {
      await Promise.all([
        waitForConvertedEvent(page),
        page.locator(locator.menu.action.convertBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      await expect(page.locator(`#${ symbols[0].id }`)).toHaveText(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should undo convert", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.undoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("stroke")
      const jiix = await callEditorExport(page, "application/vnd.myscript.jiix")
      expect(jiix).toBeDefined()
      expect(jiix.elements).toBeDefined()
      expect(jiix.elements).toHaveLength(1)
      expect(jiix.elements[0].type).toStrictEqual("Text")
      const text = jiix.elements[0].label
      expect(text).toStrictEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should redo convert", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.redoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      await expect(page.locator(`#${  symbols[0].id }`)).toHaveText(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should clear model", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.clearBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(0)
    })

    await test.step("should undo clear", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.undoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      await expect(page.locator(`#${  symbols[0].id }`)).toHaveText(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should redo clear", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        page.locator(locator.menu.action.redoBtn).click()
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(0)
    })
  })

  test("convert", async ({ page }) => {
    await test.step("should write text", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, helloOneStroke.strokes)
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].kind).toEqual("text")
    })

    await test.step("should convert stroke to text", async () => {
      await Promise.all([
        waitForConvertedEvent(page),
        page.click(locator.menu.action.convertBtn)
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("text")
      expect(symbols[0].chars.map(c => c.label).join("")).toEqual(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should display text", async () => {
      const textSymbolId = await page.evaluate("editor.model.symbols[0].id")
      await expect(page.locator(`#${  textSymbolId }`)).toHaveText(helloOneStroke.exports["application/vnd.myscript.jiix"].label)
    })
  })

  test("language", async ({ page }) => {
    await test.step("should display language list", async () => {
      await page.locator(locator.menu.action.language.inputSelect).click()
      const languageOptions = await page.locator(locator.menu.action.language.inputSelect + " option").all()
      expect(languageOptions.length).toBeGreaterThan(0)
    })

    await test.step("should not recognize french text", async () => {
      //write something in French with a typical French character: ç
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, laLecon.strokes)
      ])
      await callEditorIdle(page)
      await callEditorSynchronize(page)

      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(laLecon.exports["application/vnd.myscript.jiix"].words.length)
      expect(symbols[0].label).toEqual(laLecon.exports["application/vnd.myscript.jiix"].words[0].label)
      //should not recognize typical French character: ç
      expect(symbols[1].label).not.toEqual(laLecon.exports["application/vnd.myscript.jiix"].words[1].label)

      const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
      expect(jiix.elements[0].labe).not.toEqual(laLecon.exports["application/vnd.myscript.jiix"].label)
    })

    await test.step("should recognize french text", async () => {
      await Promise.all([
        waitForLoadedEvent(page),
        page.locator(locator.menu.action.language.inputSelect).selectOption({ value: "fr_FR" })
      ])
      //write something in French with a typical French character: ç
      await Promise.all([
        waitForSynchronizedEvent(page),
        writeStrokes(page, laLecon.strokes)
      ])
      await callEditorIdle(page)
      await callEditorSynchronize(page)

      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(laLecon.exports["application/vnd.myscript.jiix"].words.length)
      expect(symbols[0].label).toEqual(laLecon.exports["application/vnd.myscript.jiix"].words[0].label)
      //should recognize typical French character: ç
      expect(symbols[1].label).toEqual(laLecon.exports["application/vnd.myscript.jiix"].words[1].label)

      const jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
      expect(jiix.elements[0].label).toEqual(laLecon.exports["application/vnd.myscript.jiix"].label)
    })
  })

  test("gesture strikethrough", async ({ page }) => {

    await test.step("should display menu gesture", async () => {
      await expect(page.locator(locator.menu.action.gesture.triggerBtn)).toBeHidden()
      await page.locator(locator.menu.action.triggerBtn).click()
      await expect(page.locator(locator.menu.action.gesture.triggerBtn)).toBeVisible()
    })

    await test.step("should define strikethrough on draw", async () => {
      await page.locator(locator.menu.action.gesture.detectCheckbox).check()
      await page.locator(locator.menu.action.gesture.triggerBtn).click()
      await page.locator(locator.menu.action.gesture.strikeThroughSelect).selectOption({ value: "draw" })
    })

    await test.step("should draw strikethrough on stroke", async () => {
      await Promise.all([
        waitForGesturedEvent(page),
        writeStrokes(page, helloStrike.strokes)
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)
      const symbol = symbols[0]
      expect(symbol.decorators).toHaveLength(1)
      const strikeThrough = symbol.decorators[0]
      expect(strikeThrough.kind).toEqual("strikethrough")

      // toBeVisible fails on horizontal line so we just check if parent is visible
      // https://github.com/microsoft/playwright/issues/20389
      const symbolLocator = page.locator(` #${ symbol.id }`)
      await expect(symbolLocator).toBeVisible()
      const strikeThroughEl = symbolLocator.locator(` #${ strikeThrough.id }`)
      // await expect(strikeThroughEl).toBeVisible()

      await expect(strikeThroughEl).toHaveAttribute("type", "decorator")
      await expect(strikeThroughEl).toHaveAttribute("kind", "strikethrough")
    })

    await test.step("should conserve strikethrough when convert", async () => {
      await page.evaluate("editor.convert()")
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      const text = symbols[0]
      expect(text.type).toEqual("text")
      expect(text.decorators).toHaveLength(1)
      const strikeThrough = text.decorators[0]
      expect(strikeThrough.kind).toEqual("strikethrough")

      const symbolLocator = page.locator(`#${ text.id }`)
      // toBeVisible fails on horizontal line so we just check if parent is visible
      // https://github.com/microsoft/playwright/issues/20389
      await expect(symbolLocator).toBeVisible()

      const strikeThroughEl = symbolLocator.locator(` #${ strikeThrough.id }`)
      await expect(strikeThroughEl).toHaveAttribute("type", "decorator")
      await expect(strikeThroughEl).toHaveAttribute("kind", "strikethrough")
    })

    await test.step("should define strikethrough on erase", async () => {
      await page.evaluate("editor.clear()")
      expect(await getEditorSymbols(page)).toHaveLength(0)

      await expect(page.locator(`${locator.menu.action.triggerBtn} + .sub-menu-content`)).toBeHidden()
      await page.locator(locator.menu.action.triggerBtn).click()
      await expect(page.locator(`${locator.menu.action.triggerBtn} + .sub-menu-content`)).toHaveClass(/open/)
      await expect(page.locator(`${locator.menu.action.triggerBtn} + .sub-menu-content`)).toBeVisible()

      //open gestures sub menu
      await expect(page.locator(`${locator.menu.action.gesture.triggerBtn} + .sub-menu-content`)).toBeHidden()
      await page.locator(locator.menu.action.gesture.triggerBtn).click()
      await expect(page.locator(`${locator.menu.action.gesture.triggerBtn} + .sub-menu-content`)).toHaveClass(/open/)
      await expect(page.locator(`${locator.menu.action.gesture.triggerBtn} + .sub-menu-content`)).toBeVisible()

      //check the detect gestures checkbox
      await page.locator(locator.menu.action.gesture.detectCheckbox).check()

      //select draw on strikethrough
      await page.locator(locator.menu.action.gesture.strikeThroughSelect).selectOption({ value: "erase" })
    })

    await test.step("should erase stroke when strikethrough", async () => {
      // write again only the hello without the strikethrough
      await Promise.all([
        waitForExportedEvent(page),
        writePointers(page, helloStrike.strokes[0].pointers)
      ])
      expect(await getEditorSymbols(page)).toHaveLength(1)

      // write the strike through
      await Promise.all([
        waitForGesturedEvent(page),
        writePointers(page, helloStrike.strokes[1].pointers)
      ])
      expect(await getEditorSymbols(page)).toHaveLength(0)
    })
  })

  test("gesture surround", async ({ page }) => {
    await test.step("should display menu gesture", async () => {
      await expect(page.locator(locator.menu.action.gesture.triggerBtn)).toBeHidden()
      await page.locator(locator.menu.action.triggerBtn).click()
      await page.locator(locator.menu.action.gesture.triggerBtn).click()
    })

    await test.step("should define surround on select", async () => {
      //check the detect gestures checkbox
      await page.locator(locator.menu.action.gesture.detectCheckbox).check()

      //select draw on surround
      await page.locator(locator.menu.action.gesture.surroundSelect).selectOption({ value: "select" })
    })

    await test.step("write hello in one stroke", async () => {
      await Promise.all([
        waitForUIUpdatedEvent(page),
        writePointers(page, helloOneStrokeSurrounded.strokes[0].pointers)
      ])
    })

    await test.step("verify menu intention is still set on writing mode", async () => {
      await expect(page.locator(locator.menu.context.wrapper)).toBeHidden()
      await expect(page.locator(locator.menu.intention.select)).toBeVisible()
      await expect(page.locator(locator.menu.intention.select)).not.toHaveClass(/active/)
      await expect(page.locator(locator.menu.intention.writePencil)).toBeVisible()
      await expect(page.locator(locator.menu.intention.writePencil)).toHaveClass(/active/)
    })

    await test.step("write surround", async () => {
      await Promise.all([
        waitForChangedEvent(page),
        waitForUIUpdatedEvent(page),
        writePointers(page, helloOneStrokeSurrounded.strokes[1].pointers)
      ])
    })

    await test.step("verify context wrapper is visible", async () => {
      await expect(page.locator(locator.menu.context.wrapper)).toBeVisible()
      const selectIntentionLocator = page.locator(locator.menu.intention.select)
      await expect(selectIntentionLocator).toBeVisible()
      await expect(selectIntentionLocator).toHaveClass(/active/)
    })

    await test.step("clear the editor before setting surround parameter on draw", async () => {
      //clear the editor
      await page.evaluate("editor.clear()")
      expect(await getEditorSymbols(page)).toHaveLength(0)
    })

    await test.step("should define surround on draw surround", async () => {
      //first detect the gestures
      //open action menu
      await page.locator(locator.menu.action.triggerBtn).click()

      //open gestures sub menu
      await page.locator(locator.menu.action.gesture.triggerBtn).click()

      //check the detect gestures checkbox
      await page.locator(locator.menu.action.gesture.detectCheckbox).check()

      //select surround on surround
      await page.locator(locator.menu.action.gesture.surroundSelect).selectOption({ value: "surround" })
    })

    await test.step("write again hello surrounded", async () => {
      //write something with surround
      await Promise.all([
        waitForGesturedEvent(page),
        writeStrokes(page, helloOneStrokeSurrounded.strokes)
      ])
      const symbols = await getEditorSymbols(page)
      expect(symbols).toHaveLength(1)

      const recoSym = symbols[0]
      expect(recoSym.type).toEqual("recognized")
      expect(recoSym.kind).toEqual("text")
      expect(recoSym.decorators).toHaveLength(1)

      const surrondSym = recoSym.decorators[0]
      expect(surrondSym.kind).toEqual("surround")

      const symLocator = page.locator(`#${ recoSym.id }`)
      await expect(symLocator).toBeVisible()
      await expect(symLocator).toHaveAttribute("type", "recognized")
      await expect(symLocator).toHaveAttribute("kind", "text")

      const surroundLocator = symLocator.locator(`#${ surrondSym.id }`)
      await expect(surroundLocator).toBeVisible()
      await expect(surroundLocator).toHaveAttribute("type", "decorator")
      await expect(surroundLocator).toHaveAttribute("kind", "surround")
      await expect(surroundLocator).toHaveAttribute("x")
      await expect(surroundLocator).toHaveAttribute("y")
      await expect(surroundLocator).toHaveAttribute("height")
      await expect(surroundLocator).toHaveAttribute("width")
      await expect(surroundLocator).toHaveAttribute("stroke", surrondSym.style.color)
    })

    await test.step("verify surround is kept after convert", async () => {
      //now convert
      await page.evaluate("editor.convert()")

      //verify surround is still drawn arround the text
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      const convertSym = symbols[0]
      expect(convertSym.type).toEqual("text")
      expect(convertSym.decorators).toHaveLength(1)

      const surrondSym = convertSym.decorators[0]
      expect(surrondSym.kind).toEqual("surround")

      const symLocator = page.locator(`#${ convertSym.id }`)
      await expect(symLocator).toBeVisible()
      await expect(symLocator).toHaveAttribute("type", "text")

      const surroundLocator = symLocator.locator(`#${ surrondSym.id }`)
      await expect(surroundLocator).toBeVisible()
      await expect(surroundLocator).toHaveAttribute("type", "decorator")
      await expect(surroundLocator).toHaveAttribute("kind", "surround")
      await expect(surroundLocator).toHaveAttribute("x")
      await expect(surroundLocator).toHaveAttribute("y")
      await expect(surroundLocator).toHaveAttribute("height")
      await expect(surroundLocator).toHaveAttribute("width")
      await expect(surroundLocator).toHaveAttribute("stroke", surrondSym.style.color)
    })
  })

  test("gesture insert", async ({ page }) => {
    await test.step("should display menu gesture", async () => {
      await expect(page.locator(locator.menu.action.gesture.triggerBtn)).toBeHidden()
      await expect(page.locator(locator.menu.action.gesture.detectCheckbox)).toBeHidden()
      await expect(page.locator(locator.menu.action.gesture.insertSelect)).toBeHidden()
      await page.locator(locator.menu.action.triggerBtn).click()
      await expect(page.locator(locator.menu.action.gesture.detectCheckbox)).toBeHidden()
      await expect(page.locator(locator.menu.action.gesture.insertSelect)).toBeHidden()
      await page.locator(locator.menu.action.gesture.triggerBtn).click()
      await expect(page.locator(locator.menu.action.gesture.detectCheckbox)).toBeVisible()
      await expect(page.locator(locator.menu.action.gesture.insertSelect)).toBeVisible()
    })

    await test.step("should define insert on insert", async () => {
      //check the detect gestures is activate
      await page.locator(locator.menu.action.gesture.detectCheckbox).check()
      await page.locator(locator.menu.action.gesture.insertSelect).selectOption({ value: "insert" })
    })

    await test.step("should write the stroke", async () => {
      await Promise.all([
        waitForSynchronizedEvent(page),
        writePointers(page, helloInsert.strokes[0].pointers)
      ])
      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(1)
      expect(symbols[0].type).toEqual("recognized")
      expect(symbols[0].kind).toEqual("text")
    })

    await test.step("should separate stroke in 2 on insert gesture", async () => {
      await Promise.all([
        waitForGesturedEvent(page),
        writePointers(page, helloInsert.strokes[1].pointers)
      ])
      // necessary to ensure that recognition is completed
      await page.evaluate("editor.synchronizeStrokesWithJIIX()")
      const symbols = await getEditorSymbols(page)
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

    await test.step("insert should be kept on convert", async () => {
      //convert
      const convertBtn = page.locator(locator.menu.action.convertBtn)
      await expect(convertBtn).toBeEnabled()
      await Promise.all([
        waitForConvertedEvent(page),
        convertBtn.click()
      ])

      const symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(2)
      const hel = symbols[0]
      expect(hel.type).toEqual("text")
      const to = symbols[1]
      expect(to.type).toEqual("text")

      await expect(page.locator(`#${  hel.id }`)).toHaveText("hel")
      await expect(page.locator(`#${ to.id }`)).toHaveText("to")
      //verify 2nd word is separated from the first by at least 10px
      expect(to.bounds.x - hel.bounds.x - hel.bounds.width).toBeGreaterThan(10)
    })

    await test.step("insert should separate word on convert", async () => {
      //clear the editor
      await page.evaluate("editor.clear()")
      let symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(0)

      //write again and convert
      await writePointers(page, helloInsert.strokes[0].pointers)
      await page.evaluate("editor.synchronizeStrokesWithJIIX()")
      await Promise.all([
        waitForConvertedEvent(page),
        page.locator(locator.menu.action.convertBtn).click()
      ])

      //write the insert between the 2 l
      await Promise.all([
        waitForGesturedEvent(page),
        writePointers(page, helloInsert.strokes[1].pointers, 0, -20)
      ])

      symbols = await page.evaluate("editor.model.symbols")
      expect(symbols).toHaveLength(2)
      const hel = symbols[0]
      expect(hel.type).toEqual("text")
      const lo = symbols[1]
      expect(lo.type).toEqual("text")

      await expect(page.locator(`#${  hel.id }`)).toHaveText(hel.chars.map(c => c.label).join(""))
      await expect(page.locator(`#${ lo.id }`)).toHaveText(lo.chars.map(c => c.label).join(""))
      //verify 2nd word is separatedr fom the first by at least 10px
      expect(lo.bounds.x - hel.bounds.x - hel.bounds.width).toBeGreaterThan(10)
    })

  })
})
