import { IBehaviors } from "./Behaviors"
import { TConfiguration } from "./Configuration"
import { TPenStyle } from "./style/PenStyle"
import { TTheme } from "./style/Theme"

export type TEditorOptions = {
  configuration: TConfiguration
  behaviors?: IBehaviors
  penStyle?: TPenStyle
  theme?: TTheme
  globalClassCss?: string
}
