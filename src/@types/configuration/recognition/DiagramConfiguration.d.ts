
import { TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

export type TDiagramConvertConfiguration = {
  edge?: boolean
  node?: boolean
  text?: boolean
}

export type TDiagramConfiguration = {
  mimeTypes: ('application/vnd.myscript.jiix' | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' | 'image/svg+xml')[]
  'enable-sub-blocks'?: boolean
  text?: TTextConfConfiguration
  convert?: TDiagramConvertConfiguration
  'session-time'?: number
  eraser?: TEraserConfiguration
}