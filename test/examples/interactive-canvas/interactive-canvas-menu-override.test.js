import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes } from "../helper"
import h from "../__dataset__/h"

test.describe("Interactive ink canvas menu items and overrides", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    // Records whether the tool bar already held its added item when it first entered the page
    await page.addInitScript(() => {
      new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) {
              continue
            }
            const toolBar = node.matches(".ms-menu-tool") ? node : node.querySelector(".ms-menu-tool")
            if (toolBar) {
              window.firstToolBarHadAddedItem = !!toolBar.querySelector("#reset-zoom")
              observer.disconnect()
              return
            }
          }
        }
      }).observe(document, { childList: true, subtree: true })
    })
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_menu_override.html`
    )
    await passModalKey(page)
  })

  test("should add the items to the action and tool bars", async ({ page }) => {
    await expect(page.locator("#download-png")).toBeVisible()
    await expect(page.locator("#stroke-count")).toBeVisible()
    await expect(page.locator("#reset-zoom")).toBeVisible()
    // Nothing goes to the tool bar's dropdown zone: no "…" button
    await expect(page.locator("#ms-menu-tool-more")).not.toBeAttached()
  })

  test("should render the added items with their menu, not after it", async ({ page }) => {
    await expect(page.locator("#reset-zoom")).toBeVisible()
    // Declared in options.extend: no first render without them, then a second one with them
    expect(await page.evaluate(() => window.firstToolBarHadAddedItem)).toBe(true)
  })

  test("should move undo/redo from the action bar to the tool bar", async ({ page }) => {
    await expect(page.locator("#ms-menu-action-undoredo")).not.toBeAttached()
    await expect(page.locator("#ms-menu-tool-undoredo-undo")).toBeVisible()
    await expect(page.locator("#ms-menu-tool-undoredo-undo")).toBeDisabled()
    await writeStrokes(page, h.strokes)
    await expect(page.locator("#ms-menu-tool-undoredo-undo")).toBeEnabled()
  })

  test("should count the strokes in the badge as the user writes", async ({ page }) => {
    const badge = page.locator("#stroke-count .custom-badge")
    await expect(badge).toHaveText("0")
    await writeStrokes(page, h.strokes)
    await expect(badge).not.toHaveText("0")
  })

  test("should keep the added items when the menu configuration changes", async ({ page }) => {
    await page.evaluate(() => window.canvas.menu.setConfig({ tool: { erase: false } }))
    await expect(page.locator("#ms-menu-tool-erase")).not.toBeAttached()
    await expect(page.locator("#reset-zoom")).toBeVisible()
    await expect(page.locator("#download-png")).toBeVisible()
  })

  test("should show the quick action above the context menu list", async ({ page }) => {
    await page.evaluate(() => {
      window.canvas.menu.context.position = { x: 400, y: 300 }
      window.canvas.menu.context.show()
    })
    await expect(page.locator(".ms-menu-context-bar #count-selected")).toBeVisible()
  })

  test("should restrict the overridden style menu to the brand colors", async ({ page }) => {
    await expect(page.locator("#ms-menu-style-color-list > *")).toHaveCount(6)
  })
})
