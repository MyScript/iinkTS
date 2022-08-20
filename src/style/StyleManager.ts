import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { DefaultPenStyle } from "./DefaultPenStyle"

import { DefaultTheme } from "./DefaultTheme"

export class StyleManager
{
  penStyle: TPenStyle
  theme: TTheme

  constructor(penStyle?: TPenStyle, theme?: TTheme)
  {
    this.penStyle = this.overrideDefaultPenStyle(penStyle)
    this.theme = this.overrideDefaultTheme(theme)
  }

  overrideDefaultPenStyle(penStyle?: TPenStyle): TPenStyle
  {
    const currentPenStyle: TPenStyle = {
      ...DefaultPenStyle,
      ...(penStyle || {})
    }
    return currentPenStyle
  }

  overrideDefaultTheme(theme?: TTheme): TTheme
  {
    const currentTheme: TTheme = {
      ...DefaultTheme,
      ...(theme || {})
    }
    return currentTheme
  }
}