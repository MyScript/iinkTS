import type { TEraserConfiguration } from "./EraserConfiguration"
import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Client
 */
export type TDiagramConvertConfiguration = {
  types?: ("text" | "shape")[]
  "match-text-size"?: boolean
}

/**
 * @group Client
 */
export type TDiagramConfiguration = {
  mimeTypes: (
    | "application/vnd.myscript.jiix"
    | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    | "image/svg+xml"
  )[]
  "enable-sub-blocks"?: boolean
  text?: TTextConfConfiguration
  convert?: TDiagramConvertConfiguration
  "session-time"?: number
  eraser?: TEraserConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultDiagramConvertConfiguration: TDiagramConvertConfiguration = {
  types: ["text", "shape"],
  "match-text-size": true,
}

/**
 * @group Client
 * @source
 */
export const DefaultDiagramConfiguration: TDiagramConfiguration = {
  convert: DefaultDiagramConvertConfiguration,
  eraser: DefaultEraserConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
