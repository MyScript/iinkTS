import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ThemeMenuAction, TCanvasTheme, CanvasThemes } from "@/iink"

describe("ThemeMenuAction.ts", () => {
  const themes: TCanvasTheme[] = [
    { id: "default", label: "Default", swatch: "#fff", color: "#000", vars: undefined },
    { id: "dark", label: "Dark", swatch: "#000", color: "#fff", vars: { "--ms-ink-primary": "#000" } },
  ]

  afterEach(() => {
    document.body.innerHTML = ""
    localStorage.clear()
  })

  test("should build one item per theme", () => {
    const canvas = createCanvasMock()
    const item = new ThemeMenuAction(asCanvas(canvas), "ms-menu-action", themes)

    const wrapper = item.getElement()

    expect(wrapper.querySelectorAll(".ms-theme-item")).toHaveLength(2)
  })

  test("should apply the picked theme's CSS vars, save it and mark it active", () => {
    const canvas = createCanvasMock()
    const item = new ThemeMenuAction(asCanvas(canvas), "ms-menu-action", themes)
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const darkItem = wrapper.querySelectorAll(".ms-theme-item")[1] as HTMLElement

    darkItem.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))

    expect(canvas.setCssVars).toHaveBeenCalledWith(themes[1].vars)
    expect(darkItem.classList.contains("active")).toBe(true)
  })

  test("should re-apply the previously saved theme on creation", () => {
    CanvasThemes.saveThemeId("dark")
    const canvas = createCanvasMock()
    const item = new ThemeMenuAction(asCanvas(canvas), "ms-menu-action", themes)

    const wrapper = item.getElement()

    expect(canvas.setCssVars).toHaveBeenCalledWith(themes[1].vars)
    const darkItem = wrapper.querySelectorAll(".ms-theme-item")[1] as HTMLElement
    expect(darkItem.classList.contains("active")).toBe(true)
  })
})
