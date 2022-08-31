import JsonCSS from 'json-css'
import { TPenStyle } from '../@types/style/PenStyle'
import { TTheme } from '../@types/style/Theme'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser: any = new JsonCSS()

export default {
  themeToCSS(json: TTheme): string
  {
    let css = parser.toCSS(json) as string
    css = css.replace( /[\r\n]+/gm, "" )
    return css
  },
  themeToJSON(style: string): TTheme
  {
    const theme = parser.toJSON(style) as TTheme
    theme['.text']['font-size'] = Number(theme['.text']['font-size'])
    theme.ink['-myscript-pen-width'] = Number(theme.ink['-myscript-pen-width'])
    theme.ink.width = Number(theme.ink.width)
    return theme
  },
  penStyleToCSS (penStyle: TPenStyle): string {
    let css = parser.toCSS({ css: penStyle }) as string
    css = css.substring(6, css.length - 3)
    css = css.replace( /[\r\n]+/gm, "" )
    return css
  },
  penStyleToJSON (penStyleString: string): TPenStyle {
    const penStyle = parser.toJSON(`css {${penStyleString}}`).css as TPenStyle
    penStyle.width = Number(penStyle.width)
    penStyle['-myscript-pen-width'] = Number(penStyle['-myscript-pen-width'])
    return penStyle
  }
}