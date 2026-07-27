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

test.describe('Interactive Canvas SSR Text Gesture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_text_gesture.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Interactive Canvas SSR Text Gesture')
  })
  
  test('should apply gesture', async ({ page }) => {
    const configuration = await getCanvasConfiguration(page)
    const options = {
      configuration: {
        server: configuration.server,
        recognition: {
          type: "TEXT",
          gesture: {
            enable: true
          },
        }
      }
    }
    await loadCanvas(page, options)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[0]])
    ])

    await expect(page.locator(".prompter-text")).toHaveText(helloStrike.exports["text/plain"].at(0))

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[1]])
    ])
    await expect(page.locator(".prompter-text")).toHaveText(helloStrike.exports["text/plain"].at(1))
  })

  test('should not apply gesture', async ({ page }) => {
    const configuration = await getCanvasConfiguration(page)
    const options = {
      configuration: {
        server: configuration.server,
        recognition: {
          type: 'TEXT',
          gesture: {
            enable: false
          }
        }
      }
    }
    await loadCanvas(page, options)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[0]])
    ])
    await expect(page.locator(".prompter-text")).toHaveText(helloStrike.exports["text/plain"].at(0))

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloStrike.strokes[1]])
    ])
    await expect(page.locator(".prompter-text")).not.toHaveText(helloStrike.exports["text/plain"].at(1))
  })
})
