import JsonCSS from "json-css"
import {
  TPenStyle,
  TTheme
} from "../@types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser: any = new JsonCSS()

export const StyleHelper = {
  themeToCSS(json: TTheme): string
  {
    return parser.toCSS(json) as string
    // css = css.replace( /[\r\n]+/gm, "" )
    // return css
  },
  themeToJSON(style: string): TTheme
  {
    const theme = parser.toJSON(style) as TTheme
    theme[".text"]["font-size"] = Number(theme[".text"]["font-size"])
    theme.ink["-myscript-pen-width"] = Number(theme.ink["-myscript-pen-width"])
    theme.ink.width = Number(theme.ink.width)
    return theme
  },
  penStyleToCSS (penStyle: TPenStyle): string {
    let css = parser.toCSS({ css: penStyle }) as string
    css = css.substring(6, css.length - 3)
    return css
  },
  penStyleToJSON (penStyleString: string): TPenStyle {
    const penStyle = parser.toJSON(`css {${penStyleString}}`).css as TPenStyle
    if (penStyle.width) {
      penStyle.width = Number(penStyle.width)
    } else {
      delete penStyle.width
    }
    if (penStyle["-myscript-pen-width"]) {
      penStyle["-myscript-pen-width"] = Number(penStyle["-myscript-pen-width"])
    } else {
      delete penStyle["-myscript-pen-width"]
    }
    return penStyle
  },

  stringToJSON(style: string): {[key: string]: string}
  {
    return parser.toJSON(`css {${style}}`).css
  },
  JSONToString(style: {[key: string]: string}): string
  {
    return Object.entries(style).map(([k, v]) => `${k}:${v}`).join(";")
  }
}
