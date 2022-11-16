import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { DefaultPenStyle } from "./DefaultPenStyle"

import { DefaultTheme } from "./DefaultTheme"

export class StyleManager
{
  #penStyle!: TPenStyle
  #theme!: TTheme

  get penStyle(): TPenStyle {
    return this.#penStyle
  }
  get theme(): TTheme {
    return this.#theme
  }

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
    this.overrideDefaultPenStyle(penStyle)
    this.overrideDefaultTheme(theme)
  }

  overrideDefaultPenStyle(penStyle?: TPenStyle): void
  {
    const currentPenStyle: TPenStyle = {
      ...DefaultPenStyle,
      ...(penStyle || {})
    }
    this.#penStyle = currentPenStyle
  }

  overrideDefaultTheme(theme?: TTheme): void
  {
    const currentTheme: TTheme = {
      ...DefaultTheme,
      ...(theme || {})
    }
    this.#theme = currentTheme
  }
}