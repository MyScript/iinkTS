const {
    waitForEditorRest,
    getDatasFromExportedEvent,
    write
  } = require('../helper')
  const { h } = require('../strokesDatas')

  describe('Rest customize stroke', () => {
  
    beforeAll(async () => {
      await page.goto('/examples/rest/rest_text_iink_customize_stroke_style.html')
    })

    beforeEach(async () => {
      await Promise.all([
        page.reload({ waitUntil: 'load' }),
        page.waitForRequest(req => req.url().includes('/api/v4.0/iink/availableLanguageList') && req.method() === "GET")
      ])
      await waitForEditorRest(page)
    })
    
    test('should have title', async () => {
      const title = await page.title()
      expect(title).toMatch('Rest Text Styling')
    })
  
    test('should display text/plain into result', async () => {
      const [exportedDatas] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
      const resultText = await page.locator('#result').textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))
    })

    test('should change language', async () => {
      const requestEn = page.waitForRequest(req => req.url().includes('/api/v4.0/iink/batch') && req.method() === "POST")
      const [exportedDatas] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
      const enPostData = (await requestEn).postDataJSON()
      expect(enPostData.configuration.lang).toEqual("en_US")

      const resultTextEn = await page.locator('#result').textContent()
      expect(resultTextEn).toStrictEqual(exportedDatas['text/plain'])
      expect(resultTextEn).toStrictEqual(h.exports['text/plain'].at(-1))


      await page.selectOption('#language', 'fr_FR')

      expect(await page.locator('#result').textContent()).toBe('')

      const requestFr = page.waitForRequest(req => req.url().includes('/api/v4.0/iink/batch') && req.method() === "POST")
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
      const frPostData = (await requestFr).postDataJSON()
      expect(frPostData.configuration.lang).toEqual("fr_FR")

      const resultTextFr = await page.locator('#result').textContent()
      expect(resultTextFr).toStrictEqual(exportedDatas['text/plain'])
      expect(resultTextFr).toStrictEqual(h.exports['text/plain'].at(-1))
    })
   
    test('should draw stroke with penStyleEnabled', async () => {
      await page.click('#penenabled')
  
      const [exportedDatas] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
      const resultText = await page.locator('#result').textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))
  
    })
  
    test('should draw stroke with different color and width of ink', async () => {
      await page.click('#penenabled')
      const colorLocator = await page.locator('#pencolor')
      await colorLocator.fill('#1a5fb4')
      const widthLocator = await page.locator('#penwidth')
      await widthLocator.fill('5')
  
      const [exportedDatas] = await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
      const style = await page.evaluate('editor.behaviors.styleManager.penStyle')
      expect(style).toEqual({ color: '#1a5fb4', "-myscript-pen-width": '5' })

      const resultText = await page.locator('#result').textContent()
      expect(resultText).toStrictEqual(exportedDatas['text/plain'])
      expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))
  
    })
  
    test('should draw stroke with default penStyle', async () => {
      expect(await page.locator('#pencolor').isDisabled()).toEqual(true)
      expect(await page.locator('#penwidth').isDisabled()).toEqual(true)
      await page.setChecked('#penenabled', true)
      expect(await page.locator('#pencolor').isDisabled()).toEqual(false)
      expect(await page.locator('#penwidth').isDisabled()).toEqual(false)
  
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, h.strokes),
      ])
  
      await page.setChecked('#penenabled', false)
      expect(await page.locator('#pencolor').isDisabled()).toEqual(true)
      expect(await page.locator('#penwidth').isDisabled()).toEqual(true)
    })
  })
  