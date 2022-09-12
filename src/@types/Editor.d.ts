import { TConfiguration } from './Configuration'

export type TEditorOptions = {
  configuration: TConfiguration
  behaviors?: IBehaviors
  penStyle?: TPenStyle
  theme?: TTheme
  globalClassCss?: string
}
