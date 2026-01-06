import { test, expect } from "@playwright/test"

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/index.html`)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("iinkTS: Examples")
  })

  test("should display table of content", async ({ page }) => {
    await expect(page.locator("#table-of-content")).toBeVisible()
  })

  test("each table of contents link must be associated with a detail", async ({ page }) => {
    const links = page.locator("#table-of-content li")
    const sectionParts = page.locator("details")
    const linksCount = await links.count()
    const secctionPartsCount = await sectionParts.count()
    expect(linksCount).toBe(secctionPartsCount)

    for (let i = 0; i < linksCount; i++) {
      const sectionPartName = await sectionParts.nth(i).getAttribute("name")
      await expect(links.nth(i).locator("a")).toHaveAttribute("href", "#" + sectionPartName)
    }
  })

  test("for each example-recognition each example-item should have 2 links", async ({ page }) => {
    const exampleDetails = page.locator(".example-recognition")
    for (let i = 0; i < await exampleDetails.count(); i++) {
      const currentDetail = exampleDetails.nth(i);
      await currentDetail.click()
      const exampleItems = currentDetail.locator(".example-item")

      for (let i = 0; i < await exampleItems.count(); i++) {
        const links = exampleItems.nth(i).locator("a")
        expect(await links.count()).toBe(2)

        const exampleLink = links.nth(0)
        await expect(exampleLink).toBeVisible()
        await expect(exampleLink).toHaveText("View example")

        const codeLink = links.nth(1)
        await expect(codeLink).toBeVisible()
        await expect(codeLink).toHaveAttribute("href", /https:\/\/github.com\/MyScript\/iinkTS\/blob\/master\/examples\/.*/)
        await expect(codeLink).toHaveText("Get source code")
      }
    }
  })

  test("each \"View example\" link should be ok", async ({ page }) => {
    const exampleLink = page.locator("text=View example")

    const currentUrl = page.url()
    const linksInErrors = []
    for (let i = 0; i < await exampleLink.count(); i++) {
      const link = exampleLink.nth(i)
      const href = await link.getAttribute("href")
      const examplePage = await page.request.get(currentUrl.replace("index.html", href));
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (!examplePage.ok()) {
        linksInErrors.push(href)
      }
    }
    expect(linksInErrors).toStrictEqual([])
  })

  test("each \"Get source code\" link should target https://github.com/MyScript/iinkTS", async ({ page }) => {
    const exampleDetails = page.locator(".example-recognition")
    for (let i = 0; i < await exampleDetails.count(); i++) {
      const currentDetail = exampleDetails.nth(i);
      await currentDetail.click()
    }
    const codeLinks = page.locator("text=Get source code")
    const exampleLinks = page.locator("text=View example")
    for (let i = 0; i < await exampleLinks.count(); i++) {
      // const exampleHref = await exampleLinks.nth(i).getAttribute("href")
      const linkHref = await codeLinks.nth(i).getAttribute("href")
      expect(linkHref).toContain(`https://github.com/MyScript/iinkTS/blob/master/examples/`)
    }
  })
})
