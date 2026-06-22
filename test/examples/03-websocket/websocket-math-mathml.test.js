import { test, expect } from '@playwright/test'
import {
  waitForEditorInit,
  writeStrokes,
  waitForExportedEvent,
  getEditorExportsType,
  getEditorConfiguration,
  getEditorConverts,
  getEditorExports,
  waitForConvertedEvent,
  callEditorIdle,
  loadEditor,
  passModalKey
} from '../helper'

import one from '../__dataset__/1'
import sum from '../__dataset__/sum'
import threeScratchOut from '../__dataset__/threeScratchOut'
import fence from '../__dataset__/fence'
import equation from '../__dataset__/equation'

test.describe('Websocket Math MathML', function () {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_math_mathml.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Websocket Math MathML')
  })

  test('should only export mathml+xml', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, one.strokes)
    ])
    const latex = await getEditorExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getEditorExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeDefined()
  })

  test('should export mathml with flavor "standard"', async ({ page }) => {
    await writeStrokes(page, fence.strokes)
    await callEditorIdle(page)
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(
      fence.exports.MATHML.STANDARD[fence.exports.MATHML.STANDARD.length - 1]
        .trim()
        .replace(/ /g, '')
    )
  })

  // test('should export mathml with flavor "ms-office"', async ({ page }) => {
  //   await writeStrokes(page, fence.strokes)
  //   await callEditorIdle(page)
  //   const mathml = await getEditorExportsType(page, 'application/mathml+xml')
  //   expect(mathml.trim().replace(/ /g, '')).toEqual(
  //     fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1]
  //       .trim()
  //       .replace(/ /g, '')
  //   )
  // })
})
