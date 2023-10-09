import { TPenStyle, TTheme } from "../../../src/@types"
import { style } from "../../../src/iink"

const DefaultPenStyleString = ""
const DefaultThemeString = `ink {color: #000000;width: 1;-myscript-pen-width: 1;-myscript-pen-fill-style: none;-myscript-pen-fill-color: #FFFFFF00;}.math {font-family: STIXGeneral;}.math-solved {font-family: STIXGeneral;color: #A8A8A8FF;}.text {font-family: MyScriptInter;font-size: 10;}`

describe("StyleHelper.ts", () =>
{
  const { StyleHelper, DefaultPenStyle, DefaultTheme } = style
  test("should penStyleToCSS for DefaultPenStyle", () =>
  {
    const styleString = StyleHelper.penStyleToCSS(DefaultPenStyle)
    const styleStringInline = styleString.replace(/[\r\n]+/gm, "")
    expect(styleStringInline).toEqual(DefaultPenStyleString)
  })

  test("should penStyleToCSS for customPenStyle", () =>
  {
    const penStyle: TPenStyle = {
      "-myscript-pen-fill-color": "red",
      "-myscript-pen-fill-style": "none",
      "-myscript-pen-width": 1,
      color: "green",
      width: 2
    }
    const penStyleStringExpected = `-myscript-pen-fill-color: red;-myscript-pen-fill-style: none;-myscript-pen-width: 1;color: green;width: 2;`

    const styleString = StyleHelper.penStyleToCSS(penStyle)
    const styleStringInline = styleString.replace(/[\r\n]+/gm, "")

    expect(styleStringInline).toEqual(penStyleStringExpected)
  })

  test("should penStyleToJSON for DefaultPenStyle", () =>
  {
    const style = StyleHelper.penStyleToJSON(DefaultPenStyleString)
    expect(style).toEqual(DefaultPenStyle)
  })

  test("should penStyleToJSON for customPenStyle", () =>
  {
    const penStyle: TPenStyle = {
      "-myscript-pen-fill-color": "red",
      "-myscript-pen-fill-style": "purple",
      "-myscript-pen-width": 1,
      color: "green",
      width: 2
    }
    const penStyleString = `-myscript-pen-fill-color: red;-myscript-pen-fill-style: purple;-myscript-pen-width: 1;color: green;width: 2;`
    const style = StyleHelper.penStyleToJSON(penStyleString)
    expect(style).toEqual(penStyle)
  })

  test("should themeToCSS for DefaultTheme", () =>
  {
    const styleString = StyleHelper.themeToCSS(DefaultTheme)
    const styleStringInline = styleString.replace(/[\r\n]+/gm, "")
    expect(styleStringInline).toStrictEqual(DefaultThemeString)
  })

  test("should themeToCSS for CustomTheme", () =>
  {
    const theme: TTheme = {
      ink: {
        color: "#2E7D32",
        "-myscript-pen-width": 2,
        "-myscript-pen-fill-style": "purple",
        "-myscript-pen-fill-color": "#FFFFFF00"
      },
      ".math": {
        "font-family": "STIXGeneral"
      },
      ".math-solved": {
        "font-family": "STIXGeneral",
        color: "blue"
      },
      ".text": {
        "font-family": "Rubik Distressed",
        "font-size": 10
      }
    }
    const themeStringExpected = "ink {color: #2E7D32;-myscript-pen-width: 2;-myscript-pen-fill-style: purple;-myscript-pen-fill-color: #FFFFFF00;}.math {font-family: STIXGeneral;}.math-solved {font-family: STIXGeneral;color: blue;}.text {font-family: Rubik Distressed;font-size: 10;}"
    const themeString = StyleHelper.themeToCSS(theme)
    const themeStringInline = themeString.replace(/[\r\n]+/gm, "")
    expect(themeStringInline).toStrictEqual(themeStringExpected)
  })

  test("should themeToJSON for DefaultTheme", () =>
  {
    const style = StyleHelper.themeToJSON(DefaultThemeString)
    expect(style).toStrictEqual(DefaultTheme)
  })

  test("should themeToJSON for v", () =>
  {
    const theme: TTheme = {
      ink: {
        width: 42,
        color: "#2E7D32",
        "-myscript-pen-width": 2,
        "-myscript-pen-fill-style": "purple",
        "-myscript-pen-fill-color": "#FFFFFF00"
      },
      ".math": {
        "font-family": "STIXGeneral"
      },
      ".math-solved": {
        "font-family": "STIXGeneral",
        color: "blue"
      },
      ".text": {
        "font-family": "Rubik Distressed",
        "font-size": 10
      }
    }
    const themeString = "ink {width: 42;color: #2E7D32;-myscript-pen-width: 2;-myscript-pen-fill-style: purple;-myscript-pen-fill-color: #FFFFFF00;}.math {font-family: STIXGeneral;}.math-solved {font-family: STIXGeneral;color: blue;}.text {font-family: Rubik Distressed;font-size: 10;}"

    const style = StyleHelper.themeToJSON(themeString)
    expect(style).toStrictEqual(theme)
  })
})
