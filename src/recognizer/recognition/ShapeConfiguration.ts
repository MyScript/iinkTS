
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Recognizer
 */
export type TShapeConvertConfiguration = {
  types?: ("shape")[]
  "match-text-size"?: boolean
}

export type TShapeBeautificationConfiguration = {
    enable?: true
}
/**
 * @group Recognizer
 */
export type TShapeConfiguration = {
  mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
  "enable-sub-blocks"?: boolean
  convert?: TShapeConvertConfiguration
  "session-time"?: number
  eraser?: TEraserConfiguration
  beautification?: TShapeBeautificationConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultShapeConvertConfiguration: TShapeConvertConfiguration = {
  types: ["shape"],
  "match-text-size": true
}

export const DefaultShapeBeautificationConfiguration: TShapeBeautificationConfiguration = {
    enable: true
  }

/**
 * @group Recognizer
 * @source
 */
export const DefaultShapeConfiguration: TShapeConfiguration = {
  convert: DefaultShapeConvertConfiguration,
  eraser: DefaultEraserConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
  beautification: DefaultShapeBeautificationConfiguration
}
