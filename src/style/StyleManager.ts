import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"

import { DefaultPenStyle } from "./DefaultPenStyle"
import { DefaultTheme } from "./DefaultTheme"

export class StyleManager
{
  #penStyle!: TPenStyle
  #theme!: TTheme
  #penStyleClasses!: string
  #currentPenStyle!: TPenStyle

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
    this.setTheme(theme)
    this.setPenStyleClasses()
    this.setPenStyle(penStyle)
  }

  get currentPenStyle(): TPenStyle
  {
    return this.#currentPenStyle || this.#penStyle
  }

  get penStyle(): TPenStyle
  {
    return this.#penStyle
  }
  setPenStyle(p?: TPenStyle)
  {
    this.#penStyle = Object.assign({}, DefaultPenStyle, p || {}) as TPenStyle
    this.#currentPenStyle = p || (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
  }

  get theme(): TTheme
  {
    return this.#theme
  }
  setTheme(t?: TTheme)
  {
    this.#theme = Object.assign({}, DefaultTheme, t || {}) as TTheme
  }

  get penStyleClasses(): string
  {
    return this.#penStyleClasses
  }
  setPenStyleClasses(psc = "")
  {
    this.#penStyleClasses = psc
    this.#currentPenStyle = (this.theme[`.${ this.#penStyleClasses }`]) as TPenStyle
  }

}
