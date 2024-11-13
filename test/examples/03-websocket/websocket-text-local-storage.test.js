import { test, expect } from '@playwright/test'
import {
  waitForEditorWebSocket,
  writeStrokes,
  waitForExportedEvent
} from '../helper'
import helloOneStroke from '../__dataset__/helloOneStroke'
import TextNavActions from '../_partials/text-nav-actions'

test.describe('Websocket Text local storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/websocket/websocket_text_local_storage_text.html')
    await waitForEditorWebSocket(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('WEBSOCKET Text iink')
  })

  test('should show hello in the prompter after page reload', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, helloOneStroke.strokes)
    ])

    expect(await page.evaluate("localStorage.getItem(\"editorTextContent\")")).toEqual(helloOneStroke.exports['text/plain'].at(-1))

    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await expect(page.locator('.prompter-text')).toHaveText('hello')
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
