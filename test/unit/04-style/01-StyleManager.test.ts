import { style } from "../../../src/iink"

describe("StyleManager.ts", () =>
{
  const { StyleManager, DefaultPenStyle, DefaultTheme } = style
  describe("constructor", () =>
  {
    test("should instanciate with DefaultPenStyle & DefaultTheme", () =>
    {
      const styleManager = new StyleManager()
      expect(styleManager.penStyle).toStrictEqual(DefaultPenStyle)
      expect(styleManager.theme).toStrictEqual(DefaultTheme)
    })
    test("should instanciate and override DefaultPenStyle", () =>
    {
      const customPenStyle = { ...DefaultPenStyle }
      customPenStyle["-myscript-pen-fill-color"] = "yellow"
      customPenStyle["-myscript-pen-width"] = 12
      customPenStyle.color = "red"
      customPenStyle.width = 42
      const styleManager = new StyleManager(customPenStyle, undefined)
      expect(styleManager.penStyle).toStrictEqual(customPenStyle)
    })
    test("should instanciate and override DefaultTheme", () =>
    {
      const customTheme = { ...DefaultTheme }
      customTheme[".math"]["font-family"] = "math"
      customTheme[".math-solved"].color = "yellow"
      customTheme[".text"]["font-family"] = "Verdana, Arial, Helvetica, sans-serif"
      customTheme[".text"]["font-size"] = 42
      customTheme.ink["-myscript-pen-fill-color"] = "red"
      customTheme.ink["-myscript-pen-width"] = 27
      customTheme.ink.color = ".ink.color"
      customTheme.ink.width = 5
      const styleManager = new StyleManager(undefined, customTheme)
      expect(styleManager.theme).toStrictEqual(customTheme)
    })
  })

  describe("penStyle", () =>
  {
    test("should override DefaultPenStyle", () =>
    {
      const styleManager = new StyleManager()
      const customPenStyle = { ...DefaultPenStyle }
      customPenStyle["-myscript-pen-fill-color"] = "yellow"
      customPenStyle["-myscript-pen-width"] = 12
      customPenStyle.color = "red"
      customPenStyle.width = 42
      styleManager.setPenStyle(customPenStyle)
      expect(styleManager.penStyle).toStrictEqual(customPenStyle)
    })

    test("should define currentPenStyle", () =>
    {
      const styleManager = new StyleManager()
      const customPenStyle = { ...DefaultPenStyle }
      customPenStyle["-myscript-pen-fill-color"] = "yellow"
      customPenStyle["-myscript-pen-width"] = 12
      customPenStyle.color = "red"
      customPenStyle.width = 42
      styleManager.setPenStyle(customPenStyle)
      expect(styleManager.currentPenStyle).toStrictEqual(customPenStyle)
    })
  })

  describe("theme", () =>
  {
    test("should override DefaultTheme", () =>
    {
      const styleManager = new StyleManager()
      const customTheme = { ...DefaultTheme }
      customTheme[".math"]["font-family"] = "math"
      customTheme[".math-solved"].color = "yellow"
      customTheme[".text"]["font-family"] = "Verdana, Arial, Helvetica, sans-serif"
      customTheme[".text"]["font-size"] = 42
      customTheme.ink["-myscript-pen-fill-color"] = "red"
      customTheme.ink["-myscript-pen-width"] = 27
      customTheme.ink.color = ".ink.color"
      customTheme.ink.width = 5
      styleManager.setTheme(customTheme)
      expect(styleManager.theme).toStrictEqual(customTheme)
    })
  })

  describe("penStyleClasses", () =>
  {
    test("should set penStyleClasses", () =>
    {
      const styleManager = new StyleManager()
      styleManager.setPenStyleClasses("pouet")
      expect(styleManager.penStyleClasses).toStrictEqual("pouet")
    })
    test("should define currentPenStyle", () =>
    {
      const styleManager = new StyleManager()
      const customTheme = { ...DefaultTheme }
      customTheme[".math"]["font-family"] = "math"
      customTheme[".math-solved"].color = "yellow"
      customTheme[".text"]["font-family"] = "Verdana, Arial, Helvetica, sans-serif"
      customTheme[".text"]["font-size"] = 42
      customTheme.ink["-myscript-pen-fill-color"] = "red"
      customTheme.ink["-myscript-pen-width"] = 27
      customTheme.ink.color = ".ink.color"
      customTheme.ink.width = 5
      styleManager.setPenStyleClasses("math")
      expect(styleManager.currentPenStyle).toStrictEqual(customTheme[".math"])
    })
  })


})
