const { waitForExportedEvent, writeStrokes, waitEditorIdle } = require("../../helper")
const { h } = require("../../strokesDatas")

describe('Nav actions text language', () => {
  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitEditorIdle(page)
  })

  test('should change language', async () => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes),
    ])

    await waitEditorIdle(page)

    let resultText = await page.locator('#result').textContent()
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

    await Promise.all([
      waitForExportedEvent(page),
      page.selectOption('#language', 'fr_FR'),
    ])

    await waitEditorIdle(page)

    resultText = await  page.locator('#result').textContent()
    expect(resultText).toBe('')
  })
})
