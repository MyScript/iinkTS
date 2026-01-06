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
    const jiix = await getEditorExportsType(
      page,
      'application/vnd.myscript.jiix'
    )
    expect(jiix).toBeUndefined()
    const latex = await getEditorExportsType(page, 'application/x-latex')
    expect(latex).toBeDefined()
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export jiix', async ({ page }) => {
    const config = await getEditorConfiguration(page)
    const options = {
      configuration: {
        server: config.server,
        recognition: {
          type: 'MATH',
          math: {
            mimeTypes: ['application/vnd.myscript.jiix']
          }
        }
      }
    }
    await loadEditor(page, options)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, one.strokes)
    ])
    const latex = await getEditorExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getEditorExportsType(
      page,
      'application/vnd.myscript.jiix'
    )
    expect(jiix).toBeDefined()
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export mathml+xml', async ({ page }) => {
    const config = await getEditorConfiguration(page)
    const options = {
      configuration: {
        server: config.server,
        recognition: {
          type: 'MATH',
          math: {
            mimeTypes: ['application/mathml+xml']
          }
        }
      }
    }
    await loadEditor(page, options)

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, one.strokes)
    ])
    const latex = await getEditorExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const jiix = await getEditorExportsType(
      page,
      'application/vnd.myscript.jiix'
    )
    expect(jiix).toBeUndefined()
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeDefined()
  })

  test('should export mathml with flavor "standard"', async ({ page }) => {
    const config = await getEditorConfiguration(page)
    const options = {
      configuration: {
        server: config.server,
        recognition: {
          type: 'MATH',
          math: {
            mimeTypes: ['application/mathml+xml']
          },
          export: {
            mathml: {
              flavor: 'standard'
            }
          }
        }
      }
    }
    await loadEditor(page, options)
    await writeStrokes(page, fence.strokes)
    await callEditorIdle(page)
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(
      fence.exports.MATHML.STANDARD[fence.exports.MATHML.STANDARD.length - 1]
        .trim()
        .replace(/ /g, '')
    )
  })

  test('should export mathml with flavor "ms-office"', async ({ page }) => {
    const config = await getEditorConfiguration(page)
    const options = {
      configuration: {
        server: config.server,
        recognition: {
          type: 'MATH',
          math: {
            mimeTypes: ['application/mathml+xml']
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
    await writeStrokes(page, fence.strokes)
    await callEditorIdle(page)
    const mathml = await getEditorExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(
      fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1]
        .trim()
        .replace(/ /g, '')
    )
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
          page.click('#clear')
        ])
        await expect(page.locator('#result')).toBeEmpty()
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual('')
        expect(clearExport['application/x-latex']).toEqual('')
      })

      await test.step('should undo clear', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.click('#undo')
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
          page.click('#undo')
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
          page.click('#undo')
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
          page.click('#redo')
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
                // 5000 = time to write equation
                'session-time': 3000,
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
          waitForExportedEvent(page),
          writeStrokes(page, equation.strokes)
        ])
        const exports = await page.evaluate(
          `editorEl.editor.export(["application/x-latex"])`
        )
        expect(exports.exports['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-1)
        )
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-1)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual(equation.exports.LATEX.at(-1))
      })

      await test.step('should undo all stroke written during session time', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.click('#undo')
        ])
        await expect(page.locator('#result')).toBeEmpty()
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(latex).toEqual('')
        expect(exportEvt['application/x-latex']).toEqual('')
      })

      await test.step('should redo all stroke written during session time', async () => {
        const [exportEvt] = await Promise.all([
          waitForExportedEvent(page),
          page.click('#redo')
        ])
        await expect(page.locator('#result .katex-html')).toHaveText(
          equation.exports.LATEX.at(-1)
        )
        const latex = await getEditorExportsType(page, 'application/x-latex')
        expect(exportEvt['application/x-latex']).toEqual(latex)
        expect(exportEvt['application/x-latex']).toEqual(
          equation.exports.LATEX.at(-1)
        )
      })
    })

    test('should work after gesture then undo-redo', async ({ page }) => {
      await writeStrokes(page, threeScratchOut.strokes)
      await callEditorIdle(page)
      const exports = await getEditorExports(page)
      const latex = exports['application/x-latex']
      expect(latex).toEqual('')

      await page.click('#undo')
      await callEditorIdle(page)
      const [undoRedoModelExport] = await Promise.all([
        waitForExportedEvent(page),
        page.click('#redo')
      ])
      const undoRedoExport = undoRedoModelExport['application/x-latex']
      expect(undoRedoExport).toEqual('')

      const [oneModelExport] = await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, one.strokes, 100, 150)
      ])
      const oneExport = oneModelExport['application/x-latex']
      expect(oneExport).toEqual('1')
    })

    test('should convert svg path', async ({ page }) => {
      await writeStrokes(page, equation.strokes)
      await callEditorIdle(page)
      const emptyConvert = await getEditorConverts(page)
      expect(emptyConvert).toBeUndefined()
      expect(await page.locator('path').count()).toEqual(
        equation.strokes.length
      )

      await Promise.all([waitForConvertedEvent(page), page.click('#convert')])

      await callEditorIdle(page)
      expect(await page.locator('path').count()).toEqual(
        equation.exports.LATEX.at(-1).length
      )

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

      await Promise.all([waitForConvertedEvent(page), page.click('#convert')])
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

      await Promise.all([waitForConvertedEvent(page), page.click('#convert')])
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
