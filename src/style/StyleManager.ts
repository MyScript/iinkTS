import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { DefaultPenStyle } from "./DefaultPenStyle"

import { DefaultTheme } from "./DefaultTheme"

export class StyleManager
{
  private _penStyle!: TPenStyle
  private _theme!: TTheme

  get penStyle(): TPenStyle {
    return this._penStyle
  }
  get theme(): TTheme {
    return this._theme
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
    this._penStyle = currentPenStyle
  }

  overrideDefaultTheme(theme?: TTheme): void
  {
    const currentTheme: TTheme = {
      ...DefaultTheme,
      ...(theme || {})
    }
    this._theme = currentTheme
  }
}