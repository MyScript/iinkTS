describe('Home Page', () =>
{
  beforeAll(async () => {
    await page.goto('/examples/index.html')
  })

  test('should have title', async () =>
  {
    const title = await page.title()
    expect(title).toMatch('iinkTS: Examples')
  })

  test('should display table of content', async () =>
  {
    const tableOfContent = await page.locator('#table-of-content')
    expect(await tableOfContent.isVisible()).toBe(true)
  })

  test('each table of contents link must be associated with a detail', async () =>
  {
    const links = await page.locator('#table-of-content li')
    const sectionParts = await page.locator('details')
    const linksCount = await links.count()
    const secctionPartsCount = await sectionParts.count()
    expect(linksCount).toBe(secctionPartsCount)

    for (let i = 0; i < linksCount; i++) {
      const linkHref = await links.nth(i).locator('a').getAttribute('href')
      const sectionPartName = await sectionParts.nth(i).getAttribute('name')
      expect(linkHref).toBe('#' + sectionPartName)
    }
  })

  test('for each example-recognition each example-item should have 2 links', async () =>
  {
    const exampleDetails = await page.locator('.example-recognition')

    for (let i = 0; i < await exampleDetails.count(); i++) {
      const currentDetail = exampleDetails.nth(i);
      await currentDetail.click()
      const exampleItems = await currentDetail.locator('.example-item')

      for (let i = 0; i < await exampleItems.count(); i++) {
        const exampleItemsTitle = await exampleItems.nth(i).locator('p strong').textContent()
        expect(exampleItemsTitle).toBeDefined()

        const links = await exampleItems.nth(i).locator('a')
        expect(await links.count()).toBe(2)

        const exampleLink = links.nth(0)
        const codeLink = links.nth(1)

        const exampleLinkText = await exampleLink.allInnerTexts()
        expect(exampleLinkText.length).toBe(1)
        expect(exampleLinkText[0].trim()).toBe('View example')

        const codeLinkText = await codeLink.allInnerTexts()
        expect(codeLinkText.length).toBe(1)
        expect(codeLinkText[0].trim()).toBe('Get source code')
        expect(await codeLink.getAttribute('href')).toContain('https://github.com/MyScript')
      }
    }
  })

  test('each "View example" link should ok', async () =>
  {
    const exampleDetails = await page.locator('.example-recognition')
    for (let i = 0; i < await exampleDetails.count(); i++) {
      const currentDetail = exampleDetails.nth(i);
      await currentDetail.click()
    }
    const exampleLink = await page.locator('text=View example')
    const linksInErrors = []
    for (let i = 0; i < await exampleLink.count(); i++) {
      const link = exampleLink.nth(i)
      const href = await link.getAttribute('href')

      const [response] = await Promise.all([
        page.waitForResponse((response) => response.url().includes(href)),
        link.click()
      ])
      await page.waitForLoadState("networkidle")

      if (response.status() >= 400) {
        linksInErrors.push(href)
      }
      await page.goBack()
      for (let i = 0; i < await exampleDetails.count(); i++) {
        const currentDetail = exampleDetails.nth(i);
        await currentDetail.click()
      }
    }
    expect(linksInErrors).toStrictEqual([])
  }, 60000)

  test('each "Get source code" link should ok', async () =>
  {
    const exampleDetails = await page.locator('.example-recognition')
    for (let i = 0; i < await exampleDetails.count(); i++) {
      const currentDetail = exampleDetails.nth(i);
      await currentDetail.click()
    }
    const codeLinks = await page.locator('text=Get source code')
    const exampleLinks = await page.locator('text=View example')
    for(let i = 0; i < await exampleLinks.count(); i++) {
      const exampleHref = await exampleLinks.nth(i).getAttribute('href')
      const linkHref = await codeLinks.nth(i).getAttribute("href")
      expect(linkHref).toEqual(`https://github.com/MyScript/iinkTS/blob/master/examples/${exampleHref}`)
    }
  })
})
