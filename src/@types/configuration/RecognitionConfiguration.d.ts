import { TConvertConfiguration } from "./recognition/ConvertConfiguration"
import { TDiagramConfiguration } from "./recognition/DiagramConfiguration"
import { TExportConfiguration } from "./recognition/ExportConfiguration"
import { TMathConfiguration } from "./recognition/MathConfiguration"
import { TRawContentConfiguration } from "./recognition/RawContentConfiguration"
import { TTextConfiguration } from "./recognition/TextConfiguration"

export type TDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

export type TRecognitionRendererConfiguration = {
  debug: TDebugConfiguration
}

export type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content"

export type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"

export type TRecognitionConfiguration = {
  convert?: TConvertConfiguration
  type: TRecognitionType
  alwaysConnected: boolean
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  "raw-content": TRawContentConfiguration
  gesture: TGesture
}

export type TRecognitionConfigurationClient = {
  convert?: TConvertConfiguration
  type?: TRecognitionType
  alwaysConnected?: boolean
  lang?: string
  math?: TMathConfiguration
  text?: TTextConfiguration
  diagram?: TDiagramConfiguration
  renderer?: TRecognitionRendererConfiguration
  export?: TExportConfiguration
  "raw-content"?: TRawContentConfiguration
  gesture?: { enable: boolean }
}
