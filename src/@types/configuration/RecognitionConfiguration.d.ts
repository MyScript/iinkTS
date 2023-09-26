import { TConvertConfiguration } from "./recognition/ConvertConfiguration"
import { TDiagramConfiguration } from "./recognition/DiagramConfiguration"
import { TExportConfiguration } from "./recognition/ExportConfiguration"
import { TMathConfiguration } from "./recognition/MathConfiguration"
import { TRawContentConfiguration } from "./recognition/RawContentConfiguration"
import { TTextConfiguration } from "./recognition/TextConfiguration"

/**
 * @REST
 * @websocket
 */
export type TDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

/**
 * @REST
 * @websocket
 */
export type TRecognitionRendererConfiguration = {
  debug: TDebugConfiguration
}

/**
 * @REST
 * @websocket
 */
export type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content"

/**
 * @REST
 * @websocket
 */
export type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"

/**
 * @REST
 * @websocket
 */
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
  gesture: { enable: boolean }
}
