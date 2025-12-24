import { test, expect } from '@playwright/test'
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExports,
  passModalKey
} from '../helper'
import rectangleShape from '../__dataset__/rectangleShape'
import line from '../__dataset__/line'

test.describe('Rest v2 Raw Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/rest/rest_v2_raw_content.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Rest v2 Raw Content')
  })

  test('should display application/vnd.myscript.jiix into result', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [rectangleShape.strokes[0]])
    ])
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [rectangleShape.strokes[1]])
    ])
    await expect(page.locator('#result')).toHaveText(/.*application\/vnd\.myscript\.jiix.*/s)
    await expect(page.locator('#result')).toContainText('"type": "Raw Content"')
  })

  test.describe('Request sent', () => {
    let mimeTypeRequest = []
    const countMimeType = async (request) => {
      if (
        request.url().includes('api/v4.0/iink/recognize') &&
        request.method() === 'POST'
      ) {
        const headers = await request.allHeaders()
        mimeTypeRequest.push(headers.accept)
      }
    }

    test.beforeEach(async ({ page }) => {
      page.on('request', countMimeType)
      mimeTypeRequest = []
    })

    test.afterEach(async ({ page }) => {
      await page.removeListener('request', countMimeType)
    })

    test('should only request application/vnd.myscript.jiix by default', async ({
      page
    }) => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, line.strokes)
      ])
      expect(mimeTypeRequest).toHaveLength(1)
      expect(mimeTypeRequest[0]).toContain('application/vnd.myscript.jiix')
    })
  })

  test.describe('Nav actions', () => {
    test('should clear', async ({ page }) => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, line.strokes)
      ])
      expect(await getEditorExports(page)).toBeDefined()

      const promisesResult = await Promise.all([
        waitForExportedEvent(page),
        page.click('#clear')
      ])
      expect(promisesResult[0]).toBeNull()
      expect(await getEditorExports(page)).toBeFalsy()
      await expect(page.locator('#result')).toHaveText('null')
    })

    test('should undo/redo', async ({ page }) => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [rectangleShape.strokes[0]])
      ])
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [rectangleShape.strokes[1]])
      ])

      expect(await page.evaluate("editorEl.editor.model.strokes")).toHaveLength(rectangleShape.strokes.length)

      await Promise.all([waitForExportedEvent(page), page.click('#undo')])

      expect(await page.evaluate("editorEl.editor.model.strokes")).toHaveLength(rectangleShape.strokes.length - 1)

      await Promise.all([waitForExportedEvent(page), page.click('#redo')])

      expect(await page.evaluate("editorEl.editor.model.strokes")).toHaveLength(rectangleShape.strokes.length)
    })
  })
})
