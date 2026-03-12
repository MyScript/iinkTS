import JsonCSS from "json-css"
import { TTheme } from "./Theme"
import { TPenStyle } from "./PenStyle"

/**
 * Interface for JsonCSS parser
 */
interface IJsonCSSParser {
  toCSS(json: Record<string, unknown>): string
  toJSON(css: string): Record<string, unknown>
}

// Lazy initialize JsonCSS parser to improve bundle load time
let parserInstance: IJsonCSSParser | null = null
const getParser = (): IJsonCSSParser => {
  if (!parserInstance) {
    parserInstance = new JsonCSS() as IJsonCSSParser
  }
  return parserInstance
}

/**
 * @group Style
 */
export const StyleHelper = {
  themeToCSS(json: TTheme): string
  {
    return getParser().toCSS(json) as string
    // css = css.replace( /[\r\n]+/gm, "" )
    // return css
  },
  themeToJSON(style: string): TTheme
  {
    const theme = getParser().toJSON(style) as TTheme
    theme[".text"]["font-size"] = Number(theme[".text"]["font-size"])
    theme.ink["-myscript-pen-width"] = Number(theme.ink["-myscript-pen-width"])
    theme.ink.width = Number(theme.ink.width)
    return theme
  },
  penStyleToCSS (penStyle: TPenStyle): string {
    let css = getParser().toCSS({ css: penStyle }) as string
    css = css.substring(6, css.length - 3)
    return css
  },
  penStyleToJSON (penStyleString: string): TPenStyle {
    const penStyle = getParser().toJSON(`css {${penStyleString}}`).css as TPenStyle
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

  stringToJSON(style: string): Record<string, string>
  {
    return getParser().toJSON(`css {${style}}`).css as Record<string, string>
  },
  JSONToString(style: Record<string, string>): string
  {
    return Object.entries(style).map(([k, v]) => `${k}:${v}`).join(";")
  }
}
