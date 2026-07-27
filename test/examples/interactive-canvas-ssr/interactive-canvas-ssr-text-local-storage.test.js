import { test, expect } from '@playwright/test'
import {
  waitForCanvasInit,
  writeStrokes,
  waitForExportedEvent,
  passModalKey
} from '../helper'
import helloOneStroke from '../__dataset__/helloOneStroke'
import TextNavActions from '../_partials/text-nav-actions'

test.describe('Interactive Canvas SSR Text local storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_local_storage_text.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Using local storage')
  })

  test('should show hello in the prompter after page reload', async ({ page }) => {
    await test.step('write hello', async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, helloOneStroke.strokes)
      ])
    })

    await expect(page.locator('.prompter-text')).toHaveText('hello')
    expect(await page.evaluate("localStorage.getItem(\"textContentToImport\")")).toEqual(helloOneStroke.exports['text/plain'].at(-1))

    await page.reload({ waitUntil: 'load' })
    await expect(page.locator('.prompter-text')).toHaveText('hello')
  })
})
