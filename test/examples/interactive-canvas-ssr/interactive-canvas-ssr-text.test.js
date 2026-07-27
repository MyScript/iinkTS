import { test, expect } from '@playwright/test'
import {
  waitForCanvasInit,
  writeStrokes,
  waitForExportedEvent,
  getCanvasExportsType,
  getCanvasConfiguration,
  callCanvasIdle,
  getCanvasExports,
  loadCanvas,
  passModalKey
} from '../helper'

import TextNavActions from '../_partials/text-nav-actions'
import h from '../__dataset__/h'
import helloStrike from '../__dataset__/helloStrike'

test.describe('Interactive Canvas SSR Text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Interactive Canvas SSR Text')
  })

  test('should export application/vnd.myscript.jiix', async ({ page }) => {
    await test.step("write strokes", async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes),
      ])
    })

    await expect(page.locator('#result')).toHaveText(h.exports['text/plain'].at(-1))
    const exports = await getCanvasExports(page)
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = exports['application/vnd.myscript.jiix']
    expect(jiixReceived).toEqual(jiixExpected)
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })

  test('should work after gesture then undo-redo', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[0]])
    ])
    await expect(page.locator("#result")).toHaveText(helloStrike.exports["text/plain"].at(0))

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[1]])
    ])
    await expect(page.locator("#result")).toHaveText(helloStrike.exports["text/plain"].at(1))

    await Promise.all([
      waitForExportedEvent(page),
      page.locator('#undo').click()
    ])
    await expect(page.locator("#result")).toHaveText(helloStrike.exports["text/plain"].at(0))

    await Promise.all([
      waitForExportedEvent(page),
      page.locator('#redo').click()
    ])
    await expect(page.locator("#result")).toHaveText(helloStrike.exports["text/plain"].at(1))
  })

  test('SmartGuide', async ({ page }) => {
    await test.step('should not display', async () => {
      const configuration = await getCanvasConfiguration(page)
      const options = {
        configuration: {
          server: configuration.server,
          recognition: {
            type: "TEXT",
          },
          smartGuide: {
            enable: false
          }
        }
      }
      await loadCanvas(page, options)
      await waitForCanvasInit(page)
      await expect(page.locator('.smartguide')).toBeHidden()
    })

    await test.step('should display', async () => {
      const configuration = await getCanvasConfiguration(page)
      const options = {
        configuration: {
          server: configuration.server,
          recognition: {
            type: "TEXT",
          },
          smartGuide: {
            enable: true
          }
        }
      }
      await loadCanvas(page, options)
      await waitForCanvasInit(page)
      await expect(page.locator('.smartguide')).toBeVisible()
    })

    await test.step('should display text into', async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, h.strokes)
      ])
      await callCanvasIdle(page)
      await expect(page.locator('.prompter-text')).toBeVisible()
      await expect(page.locator('.prompter-text')).toHaveText(h.exports['text/plain'].at(-1))
    })

    await test.step('should select candidate', async () => {
      const jiixExport = await getCanvasExportsType(page, 'application/vnd.myscript.jiix')
      await expect(page.locator('.prompter-text')).toHaveText(jiixExport.label)
      await expect(page.locator('.candidates')).toBeHidden()

      await page.locator(`.prompter-text > span`).click()
      await expect(page.locator('.candidates')).toBeVisible()

      const candidate = jiixExport.words[0].candidates[2]
      await Promise.all([
        waitForExportedEvent(page),
        page.locator(`.candidates > span >> text=${candidate}`).click()
      ])

      await expect(page.locator('.prompter-text')).toHaveText(candidate)
      await expect(page.locator('.candidates')).toBeHidden()
    })

    await test.step('should open menu more', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
      await page.locator(`.ellipsis`).click()
      await expect(page.locator('.more-menu')).toBeVisible()
    })

    await test.step('should convert', async () => {
      const wrotePath = await page.locator('svg[data-layer="MODEL"] path').first().getAttribute('d')
      await Promise.all([
        waitForExportedEvent(page),
        page.locator(`.more-menu > button >> text=Convert`).click()
      ])

      const convert = await getCanvasExports(page)
      expect(convert).toBeDefined()

      await expect(page.locator('svg[data-layer="MODEL"] path').first()).not.toHaveAttribute('d', wrotePath)
    })

    await test.step('should close menu more after convert', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
    })

    await test.step('should Delete', async () => {
      await page.locator(`.ellipsis`).click()
      await expect(page.locator('.more-menu')).toBeVisible()

      await Promise.all([
        waitForExportedEvent(page),
        page.locator(`.more-menu > button >> text=Delete`).click()
      ])
      await expect(page.locator('#rootEl svg[data-layer="MODEL"] path')).toHaveCount(0)
    })

    await test.step('should close menu more after delete', async () => {
      await expect(page.locator('.more-menu')).toBeHidden()
    })

    // TODO fix navigator.clipboard.readText
    // if (browserName === 'webkit') {
    //
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
