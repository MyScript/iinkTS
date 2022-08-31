import StyleHelper from '../../../src/style/StyleHelper'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { DefaultTheme } from '../../../src/style/DefaultTheme'

describe('StyleHelper.ts', () =>
{
  const DefaultPenStyleString = "color: #000000;width: 0;-myscript-pen-width: 1;-myscript-pen-fill-style: none;-myscript-pen-fill-color: #FFFFFF00;"
  test('should penStyleToCSS', () =>
  {
    const styleString = StyleHelper.penStyleToCSS(DefaultPenStyle)
    expect(styleString).toStrictEqual(DefaultPenStyleString)
  })

  test('should penStyleToJSON', () =>
  {
    const style = StyleHelper.penStyleToJSON(DefaultPenStyleString)
    expect(style).toStrictEqual(DefaultPenStyle)
  })

  const DefaultThemeString = `ink {color: #000000;width: 1;-myscript-pen-width: 1;-myscript-pen-fill-style: none;-myscript-pen-fill-color: #FFFFFF00;}.math {font-family: STIXGeneral;}.math-solved {font-family: STIXGeneral;color: #A8A8A8FF;}.text {font-family: MyScriptInter;font-size: 10;}`
  test('should themeToCSS', () =>
  {
    const styleString = StyleHelper.themeToCSS(DefaultTheme)
    expect(styleString).toStrictEqual(DefaultThemeString)
  })

  test('should themeToJSON', () =>
  {
    const style = StyleHelper.themeToJSON(DefaultThemeString)
    expect(style).toStrictEqual(DefaultTheme)
  })
})
