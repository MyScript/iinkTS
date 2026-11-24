import { CanvasThemes } from "@/iink"

describe("CanvasThemes.ts", () => {
  afterEach(() => {
    localStorage.clear()
  })

  test("should return 'default' when no theme has been saved", () => {
    expect(CanvasThemes.getSavedThemeId()).toEqual("default")
  })

  test("should return the saved theme id after saveThemeId", () => {
    const secondThemeId = CanvasThemes.THEMES[1].id
    CanvasThemes.saveThemeId(secondThemeId)
    expect(CanvasThemes.getSavedThemeId()).toEqual(secondThemeId)
  })

  test("should not throw when localStorage.getItem throws", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("private browsing")
    })
    expect(CanvasThemes.getSavedThemeId()).toEqual("default")
    spy.mockRestore()
  })

  test("should not throw when localStorage.setItem throws", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("private browsing")
    })
    expect(() => CanvasThemes.saveThemeId("some-theme")).not.toThrow()
    spy.mockRestore()
  })

  test("should return the matching theme for a known id", () => {
    const theme = CanvasThemes.THEMES[1]
    expect(CanvasThemes.getThemeById(theme.id)).toEqual(theme)
  })

  test("should fall back to the first theme for an unknown id", () => {
    expect(CanvasThemes.getThemeById("does-not-exist")).toEqual(CanvasThemes.THEMES[0])
  })
})
