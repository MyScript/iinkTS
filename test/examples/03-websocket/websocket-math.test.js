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
  passModalKey,
  waitForChangedEvent,
  callEditorExport
} from '../helper'

import one from '../__dataset__/1'
import sum from '../__dataset__/sum'
import threeScratchOut from '../__dataset__/threeScratchOut'
import fence from '../__dataset__/fence'
import equation from '../__dataset__/equation'

test.describe('Websocket Math', function () {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_math.html`)
    await passModalKey(page)
  })

  test('should have title', async ({ page }) => {
    await expect(page).toHaveTitle('Websocket Math')
  })

  test('should only export latex by default', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, one.strokes)
    ])
    const jiix = await getEditorExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getEditorExportsType(page, 'application/x-latex')
    expect(latex).toBeDefined()
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test.describe('Nav actions', () => {
    test('should undo/redo in mode "stroke" by default', async ({ page }) => {
      await test.step('should have undo/redo mode set to "stroke" by default', async () => {
        const config = await getEditorConfiguration(page)
        expect(config.recognition.math['undo-redo'].mode).toEqual('stroke')
      })

      await test.step('should write stroke', async () => {
        await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, equation.strokes)
        ])
        await callEditorIdle(page)
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-1)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-1))
      })

      await test.step('should clean stroke', async () => {
        const [clearExport] = await Promise.all([
          waitForExportedEvent(page),
          page.locator('#clear').click()
        ])
        await expect(page.locator('#result')).toBeEmpty()
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual('')
        expect(clearExport['application/x-latex']).toEqual('')
      })

      await test.step('should undo clear', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.locator('#undo').click()
        ])
        expect(exportEvt['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-1)
        )
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-1)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-1))
      })

      await test.step('should undo last stroke written', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.locator('#undo').click()
        ])
        expect(exportEvt['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-2)
        )
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-2)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-2))
      })

      await test.step('should undo penultimate stroke written', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.locator('#undo').click()
        ])
        expect(exportEvt['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-3)
        )
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-3).replace('-', '−')
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-3))
      })

      await test.step('should redo penultimate stroke written', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.locator('#redo').click()
        ])
        expect(exportEvt['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-2)
        )
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-2)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-2))
      })
    })

    test('should undo/redo in mode "session"', async ({ page }) => {
      // Writing the full equation over a real WebSocket round trip per stroke is genuinely
      // slower under CI load than locally — 180s was still hit on CI ("Test timeout of 180000ms
      // exceeded" with no specific assertion failing, i.e. cumulative step time, not a hang).
      test.setTimeout(5 * 60 * 1000)

      await test.step('should set undo/redo mode set to "session"', async () => {
        const config = await getEditorConfiguration(page)
        const options = {
          configuration: {
            server: config.server,
            recognition: {
              type: 'MATH',
              math: {
                'undo-redo': {
                  mode: 'session'
                },
                // Writing the equation strokes takes a few seconds and varies with runner
                // speed (flaky on loaded CI when this window is too tight and the last
                // stroke(s) land outside the undo session) — keep well above worst-case
                // write time.
                'session-time': 20000,
                mimeTypes: ['application/x-latex']
              },
              export: {
                mathml: {
                  flavor: 'ms-office'
                }
              }
            }
          }
        }
        await loadEditor(page, options)
        await waitForEditorInit(page)
      })

      await test.step('should write stroke', async () => {
        await Promise.all([
          waitForChangedEvent(page, 60000),
          writeStrokes(page, equation.strokes)
        ])
        await callEditorIdle(page)
        const expected = equation.exports.LATEX.at(-1)
        
        await expect(page.locator('#result .katex-html')).toHaveText(expected)
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(expected)
      })

      await test.step('should undo all stroke written during session time', async () => {
        await callEditorIdle(page)
        await Promise.all([
          waitForChangedEvent(page, 60000),
          page.locator('#undo').click()
        ])
        await expect(page.locator('#result')).toBeEmpty()
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual('')
      })

      await test.step('should redo all stroke written during session time', async () => {
        await callEditorIdle(page)
        await Promise.all([
          waitForChangedEvent(page, 60000),
          page.locator('#redo').click()
        ])
        const expected = equation.exports.LATEX.at(-1)
        await expect(page.locator('#result .katex-html')).toHaveText(expected)
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(expected)
      })
    })

    test('should work after gesture then undo-redo', async ({ page }) => {
      await writeStrokes(page, threeScratchOut.strokes)
      await callEditorIdle(page)
      const exports = await getEditorExports(page)
      const latex = exports['application/x-latex']
      expect(latex).toEqual('')

      await page.locator('#undo').click()
      await callEditorIdle(page)
      const [undoRedoModelExport] = await Promise.all([
        waitForExportedEvent(page),
        page.locator('#redo').click()
      ])
      const undoRedoExport = undoRedoModelExport['application/x-latex']
      expect(undoRedoExport).toEqual('')

      const [oneModelExport] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes)
      ])
      const oneExport = oneModelExport['application/x-latex']
      expect(oneExport).toEqual('1')
    })

    test('should convert svg path', async ({ page }) => {
      await writeStrokes(page, equation.strokes)
      await callEditorIdle(page)
      const emptyConvert = await getEditorConverts(page)
      expect(emptyConvert).toBeUndefined()
      await expect(page.locator('#editorEl svg[data-layer="MODEL"] path')).toHaveCount(
        equation.strokes.length
      )

      await Promise.all([waitForConvertedEvent(page), page.locator('#convert').click()])

      await callEditorIdle(page)
      await expect(page.locator('#editorEl svg[data-layer="MODEL"] path'))
        .toHaveCount(equation.exports.LATEX.at(-1).length)

      const convert = await getEditorConverts(page)
      const latexExport = await getEditorExportsType(
        page,
        'application/x-latex'
      )
      expect(convert['application/x-latex']).toEqual(latexExport)
      expect(latexExport).toEqual(equation.exports.LATEX.at(-1))
    })

    test('should convert and solve sum by default', async ({ page }) => {
      const config = await getEditorConfiguration(page)
      expect(config.recognition.math.solver.enable).toEqual(true)
      let numStroke = 0
      for (const s of sum.strokes) {
        const [exports] = await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, [s])
        ])
        expect(exports['application/x-latex']).toEqual(
          sum.exports.LATEX.at(numStroke)
        )
        numStroke++
      }
      const emptyConvert = await getEditorConverts(page)
      expect(emptyConvert).toBeUndefined()

      await Promise.all([waitForConvertedEvent(page), page.locator('#convert').click()])
      const convert = await getEditorConverts(page)
      expect(convert['application/x-latex']).toEqual(sum.exports.LATEX.at(-1))
      await expect(page.locator('#result .katex-html')).toHaveText(
        sum.exports.LATEX.at(-1)
      )
    })

    test('should convert and not solve sum', async ({ page }) => {
      const config = await getEditorConfiguration(page)
      const options = {
        configuration: {
          server: config.server,
          recognition: {
            type: 'MATH',
            math: {
              mimeTypes: ['application/x-latex'],
              solver: {
                enable: false
              }
            }
          }
        }
      }
      await loadEditor(page, options)
      await waitForEditorInit(page)

      let numStroke = 0
      for (const s of sum.strokes) {
        const [exports] = await Promise.all([
          waitForExportedEvent(page),
          writeStrokes(page, [s])
        ])
        expect(exports['application/x-latex']).toEqual(
          sum.exports.LATEX.at(numStroke)
        )
        numStroke++
      }
      const emptyConvert = await getEditorConverts(page)
      expect(emptyConvert).toBeUndefined()

      await Promise.all([waitForConvertedEvent(page), page.locator('#convert').click()])
      const convert = await getEditorConverts(page)
      const latexExport = await getEditorExportsType(
        page,
        'application/x-latex'
      )
      expect(convert['application/x-latex']).toEqual(latexExport)
      expect(latexExport).toEqual(sum.exports.LATEX.at(-2))
      await expect(page.locator('#result .katex-html')).toHaveText(
        sum.exports.LATEX.at(-2)
      )
    })
  })
})
