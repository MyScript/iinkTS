import { test, expect } from '@playwright/test'
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExportsType,
  getEditorConfiguration,
  setEditorConfiguration,
  callEditorIdle,
  getEditorExports,
} from '../helper'

import TextNavActions from '../_partials/text-nav-actions'
import h from '../__dataset__/h'
import helloStrike from '../__dataset__/helloStrike'

test.describe('Websocket Text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/websocket/websocket_text_iink.html')
    await Promise.all([
      page.waitForResponse((req) => req.url().includes('/api/v4.0/iink/availableLanguageList')),
      waitForEditorInit(page)
    ])
    await callEditorIdle(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Websocket Text')
  })

  test('should export application/vnd.myscript.jiix', async ({ page }) => {
    const [exports] = await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = exports['application/vnd.myscript.jiix']
    const modelExportJiixReceived = await getEditorExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiixReceived).toEqual(modelExportJiixReceived)
    expect(jiixReceived).toEqual(jiixExpected)
  })

  test.describe('Gesture', () => {
    test('should apply gesture', async ({ page }) => {
      const exportPormise = waitForExportedEvent(page)
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        exportPormise,
        waitForEditorInit(page)
      ])

      const [firstModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[0]])
      ])
      const firstJiixExport = firstModelExports['application/vnd.myscript.jiix']
      expect(firstJiixExport.label).toEqual(helloStrike.exports['text/plain'][0])

      const [secondModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[1]])
      ])
      const secondJiixExport = secondModelExports['application/vnd.myscript.jiix']
      expect(secondJiixExport.label).toEqual('')
    })

    test('should not apply gesture', async ({ page }) => {
      const exportPormise = waitForExportedEvent(page)
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = false
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        exportPormise,
        waitForEditorInit(page)
      ])

      const [firstModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[0]])
      ])
      const firstJiixExport = firstModelExports['application/vnd.myscript.jiix']
      expect(firstJiixExport.label).toEqual(helloStrike.exports['text/plain'][0])

      const [secondModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[1]])
      ])
      const secondJiixExport = secondModelExports['application/vnd.myscript.jiix']
      expect(secondJiixExport.label).not.toEqual('')
    })

    test('should work after gesture then undo-redo', async ({ page }) => {
      const exportPormise = waitForExportedEvent(page)
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        exportPormise,
        waitForEditorInit(page)
      ])

      const [firstModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[0]])
      ])
      const firstJiixExport = firstModelExports['application/vnd.myscript.jiix']
      expect(firstJiixExport.label).toEqual(
        helloStrike.exports['text/plain'][0]
      )

      await callEditorIdle(page)
      const [secondModelExports] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloStrike.strokes[1]])
      ])
      const secondJiixExport = secondModelExports['application/vnd.myscript.jiix']
      expect(secondJiixExport.label).toEqual('')

      await callEditorIdle(page)
      const [undoModelExport] = await Promise.all([
        waitForExportedEvent(page),
        page.click('#undo')
      ])
      const thirdJiixExport = undoModelExport['application/vnd.myscript.jiix']
      expect(thirdJiixExport.label).toEqual(helloStrike.exports['text/plain'][0])

      await callEditorIdle(page)
      const [redoModelExport] = await Promise.all([
        waitForExportedEvent(page),
        page.click('#redo')
      ])
      const undoRedoJiixExport = redoModelExport['application/vnd.myscript.jiix']
      expect(undoRedoJiixExport.label).toEqual('')
    })
  })

  test('SmartGuide', async ({ page, browserName }) => {
    await test.step('should not display', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = false
      await setEditorConfiguration(page, configuration)
      await Promise.all([
        waitForExportedEvent(page),
        waitForEditorInit(page)
      ])
      await expect(page.locator('.smartguide')).toBeHidden()
    })

    await test.step('should display', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.rendering.smartGuide.enable = true
      setEditorConfiguration(page, configuration)
      await waitForEditorInit(page)
      await expect(page.locator('.smartguide')).toBeVisible()
    })

    await test.step('should display text into', async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes)
      ])
      await callEditorIdle(page)
      await expect(page.locator('.prompter-text')).toBeVisible()
      await expect(page.locator('.prompter-text')).toHaveText(h.exports['text/plain'].at(-1))
    })

    await test.step('should select candidate', async () => {
      const jiixExport = await getEditorExportsType(page, 'application/vnd.myscript.jiix')
      await expect(page.locator('.prompter-text')).toHaveText(jiixExport.label)
      await expect(page.locator('.candidates')).toBeHidden()

      await page.click(`.prompter-text > span`)
      await expect(page.locator('.candidates')).toBeVisible()

      const candidate = jiixExport.words[0].candidates[2]
      await Promise.all([
        waitForExportedEvent(page),
        page.click(`.candidates > span >> text=${candidate}`)
      ])

      await expect(page.locator('.prompter-text')).toHaveText(candidate)
      await expect(page.locator('.candidates')).toBeHidden()
    })

    await test.step('should open menu more', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
      await page.click(`.ellipsis`)
      await expect(page.locator('.more-menu')).toBeVisible()
    })

    await test.step('should convert', async () => {
      const wrotePath = await page.locator('path').first().getAttribute('d')
      await Promise.all([
        waitForExportedEvent(page),
        page.click(`.more-menu > button >> text=Convert`)
      ])

      const convert = await getEditorExports(page)
      expect(convert).toBeDefined()

      await expect(page.locator('path').first()).not.toHaveAttribute(wrotePath)
    })

    await test.step('should close menu more after convert', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
    })

    await test.step('should Delete', async () => {
      await page.click(`.ellipsis`)
      await expect(page.locator('.more-menu')).toBeVisible()

      await Promise.all([
        waitForExportedEvent(page),
        page.click(`.more-menu > button >> text=Delete`)
      ])
      expect(await page.locator('path').count()).toEqual(0)
    })

    await test.step('should close menu more after delete', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
    })

    // TODO fix navigator.clipboard.readText
    // if (browserName === 'webkit') {
    //   console.log("Skip webkit because no permissions are possible for clipboard")
    // }
    // else {
    //   await test.step("should Copy", async () => {
    //     await Promise.all([
    //       waitForExportedEvent(page),
    //       writeStrokes(page, h.strokes)
    //     ])

    //     await expect(page.locator("path")).toHaveCount(1)

    //     await page.click(`.ellipsis`)
    //     // wait for css animation
    //     await page.waitForTimeout(1000)

    //     await expect(page.locator(".more-menu")).toBeVisible()
    //     await page.click(`.more-menu > button >> text=Copy`)

    //     await expect(page.evaluate("navigator.clipboard.readText()")).toEqual(h.exports["text/plain"])
    //   })
    // }
  })

  TextNavActions.test()
})
