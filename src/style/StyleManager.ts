import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { DefaultPenStyle } from "./DefaultPenStyle"

import { DefaultTheme } from "./DefaultTheme"

export class StyleManager
{
  #penStyle!: TPenStyle
  #theme!: TTheme
  penStyleClasses: string

  get penStyle(): TPenStyle {
    return this.#penStyle
  }
  get theme(): TTheme {
    return this.#theme
  }

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
    this.penStyleClasses = ''
    this.overrideDefaultPenStyle(penStyle)
    this.overrideDefaultTheme(theme)
  }

  overrideDefaultPenStyle(penStyle?: TPenStyle): void
  {
    this.#penStyle = Object.assign({}, DefaultPenStyle, penStyle || {}) as TPenStyle
  }

  overrideDefaultTheme(theme?: TTheme): void
  {
    this.#theme = Object.assign({}, DefaultTheme, theme || {}) as TTheme
  }
}