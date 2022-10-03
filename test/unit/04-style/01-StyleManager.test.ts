import { StyleManager } from '../../../src/style/StyleManager'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { DefaultTheme } from '../../../src/style/DefaultTheme'

describe('StyleManager.ts', () =>
{
  test('should instanciate with DefaultPenStyle & DefaultTheme', () =>
  {
    const styleManager = new StyleManager()
    expect(styleManager.penStyle).toStrictEqual(DefaultPenStyle)
    expect(styleManager.theme).toStrictEqual(DefaultTheme)
  })

  test('should override DefaultPenStyle', () =>
  {
    const penStyle = { ...DefaultPenStyle }
    penStyle['-myscript-pen-fill-color'] = 'yellow'
    penStyle['-myscript-pen-width'] = 12
    penStyle.color = 'red'
    penStyle.width = 42
    const styleManager = new StyleManager(penStyle)
    expect(styleManager.penStyle).toStrictEqual(penStyle)
  })

  test('should override DefaultTheme', () =>
  {
    const theme = { ...DefaultTheme }
    theme['.math']['font-family'] = 'math'
    theme['.math-solved'].color = 'yellow'
    theme['.text']['font-family'] = 'Verdana, Arial, Helvetica, sans-serif'
    theme['.text']['font-size'] = 42
    theme.ink['-myscript-pen-fill-color'] = 'red'
    theme.ink['-myscript-pen-width'] = 27
    theme.ink.color = '.ink.color'
    theme.ink.width = 5
    const styleManager = new StyleManager(undefined, theme)
    expect(styleManager.theme).toStrictEqual(theme)
  })

})
