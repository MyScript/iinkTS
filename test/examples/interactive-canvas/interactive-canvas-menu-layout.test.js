import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"

test.describe("Interactive ink canvas menu layout", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_menu_layout.html`
    )
    await passModalKey(page)
    await expect(page.locator('[data-preset="Default"]')).toBeVisible()
  })

  /** The occupants of a slot, in stacking order */
  const occupantsOf = (page, slot) =>
    page
      .locator(`.ms-layout-${slot} > .ms-layout-host`)
      .evaluateAll((hosts) => hosts.map((host) => host.className.replace(/.*ms-layout-host-/, "")))

  test("should load with the action bar stacked right above the tools", async ({ page }) => {
    expect(await occupantsOf(page, "bottom-center")).toEqual(["action", "tool"])
    // Undo/redo, in the action bar, sits above the tool bar
    const undo = await page.locator("#ms-menu-action-undoredo").boundingBox()
    const write = await page.locator("#ms-menu-tool-write-pencil").boundingBox()
    expect(undo.y + undo.height).toBeLessThanOrEqual(write.y)
  })

  test("should stand the tool bar up on the side, its dropdowns opening inwards", async ({ page }) => {
    await page.locator('[data-preset="Tools on the side"]').click()
    expect(await occupantsOf(page, "middle-left")).toEqual(["tool"])
    await expect(page.locator(".ms-menu-tool")).toHaveClass(/ms-menu-column/)
    const toolSubMenus = page.locator(".ms-menu-tool .sub-menu-content")
    await expect(toolSubMenus.first()).toHaveClass(/right-top/)
  })

  test("should rebuild the custom occupant for its new slot", async ({ page }) => {
    await expect(page.locator("#notebook-title")).toHaveClass(/horizontal/)
    await page.locator('[data-preset="Everything at the bottom"]').click()
    expect(await occupantsOf(page, "middle-right")).toEqual(["notebook"])
    await expect(page.locator("#notebook-title")).toHaveClass(/vertical/)
  })

  test("should fold the style panel when it shares a bottom slot", async ({ page }) => {
    await page.locator('[data-preset="Everything at the bottom"]').click()
    expect(await occupantsOf(page, "bottom-center")).toEqual(["style", "action", "tool"])
    // Folded behind its palette trigger, the panel's sections are out of sight
    await expect(page.locator("#ms-menu-style")).toBeVisible()
    await expect(page.locator("#ms-menu-style-color")).toBeHidden()
  })

  test("should put everything back in its default slot", async ({ page }) => {
    await page.locator('[data-preset="Tools on the side"]').click()
    await page.locator('[data-preset="Default"]').click()
    expect(await occupantsOf(page, "top-left")).toEqual(["action"])
    expect(await occupantsOf(page, "bottom-center")).toEqual(["tool"])
    await expect(page.locator(".ms-menu-tool")).toHaveClass(/ms-menu-row/)
  })
})
