import { test, expect } from '@playwright/test'
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  passModalKey
} from '../helper'
import helloOneStroke from '../__dataset__/helloOneStroke'
import TextNavActions from '../_partials/text-nav-actions'

test.describe('Websocket Text local storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_local_storage_text.html`)
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
    expect(await page.evaluate("localStorage.getItem(\"editorTextContent\")")).toEqual(helloOneStroke.exports['text/plain'].at(-1))

    await page.reload({ waitUntil: 'load' })
    await expect(page.locator('.prompter-text')).toHaveText('hello')
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
