
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Recognizer
 */
export type TDiagramConvertConfiguration = {
  types?: ("text" | "shape")[]
  "match-text-size"?: boolean
}

/**
 * @group Recognizer
 */
export type TDiagramConfiguration = {
  mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
  "enable-sub-blocks"?: boolean
  text?: TTextConfConfiguration
  convert?: TDiagramConvertConfiguration
  "session-time"?: number
  eraser?: TEraserConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultDiagramConvertConfiguration: TDiagramConvertConfiguration = {
  types: ["text", "shape"],
  "match-text-size": true
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultDiagramConfiguration: TDiagramConfiguration = {
  convert: DefaultDiagramConvertConfiguration,
  eraser: DefaultEraserConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
