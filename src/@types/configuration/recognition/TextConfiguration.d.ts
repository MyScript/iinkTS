import { TMarginConfiguration } from "./MarginConfiguration"
import { TEraserConfiguration } from "./EraserConfiguration"

export type TGuidesConfiguration = {
  enable: boolean
}

export type TTextConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

export type TTextConfiguration = {
  text?: boolean
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
  margin: TMarginConfiguration
  guides?: TGuidesConfiguration
  configuration?: TTextConfConfiguration
  eraser?: TEraserConfiguration
}
