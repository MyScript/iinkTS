const { waitForEditorWebSocket, write, getExportedDatas } = require('../helper')
const { h } = require('../strokesDatas')

function hexToRgbA(hex) {
  var c
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return (
      'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(', ') + ', 1)'
    )
  }
  throw new Error('Bad Hex')
}

describe('Websocket Text Customize Stroke Style', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_customize_stroke_style.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await page.waitForTimeout(1000)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Styling pen and strokes')
  })

  test('should draw stroke with DefaultTheme', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const defaultThemeColor = await page.evaluate('editor.theme.ink.color')
    const path = page.locator(`path[fill="${hexToRgbA(defaultThemeColor)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test('should draw stroke with penStyleClasses', async () => {
    await page.click('#penStyleClasses')

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])

    const editorTheme = await page.evaluate('editor.theme')
    const editorPenStyleClasses = await page.evaluate('editor.penStyleClasses')
    const penColorExpected = editorTheme[`.${editorPenStyleClasses}`].color
    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test('should draw stroke with theme', async () => {
    await page.selectOption('#theme', 'bold-red'),

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])

    const editorTheme = await page.evaluate('editor.theme')
    const penColorExpected = editorTheme.ink.color
    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })

  test('should draw stroke with default penStyle', async () => {
    expect(await page.$eval('.pensettings', (elements) => elements.classList.contains('disabled'))).toEqual(true)
    await page.setChecked('#penenabled', true)
    expect(await page.$eval('.pensettings', (elements) => elements.classList.contains('disabled'))).toEqual(false)

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])

    const editorPenStyle = await page.evaluate('editor.penStyle')
    const path = page.locator(`path[fill="${hexToRgbA(editorPenStyle.color)}"]`)
    expect(await path.count()).toEqual(1)

    await page.setChecked('#penenabled', false)
    expect(await page.$eval('.pensettings', (elements) => elements.classList.contains('disabled'))).toEqual(true)
  })

  test('should draw stroke with selected penStyle', async () => {
    const penColorExpected = '#1a5fb4'

    expect(await page.$eval('.pensettings', (elements) => elements.classList.contains('disabled'))).toEqual(true)
    await page.setChecked('#penenabled', true)
    expect(await page.$eval('.pensettings', (elements) => elements.classList.contains('disabled'))).toEqual(false)

    await page.fill('#pencolor', penColorExpected)

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])

    //TODO remove this after fixed exported event
    await page.waitForTimeout(500)

    const path = page.locator(`path[fill="${hexToRgbA(penColorExpected)}"]`)
    expect(await path.count()).toEqual(1)
  })

  require('../_partials/smart-guide-test')

  require('../_partials/gesture-test')
})
