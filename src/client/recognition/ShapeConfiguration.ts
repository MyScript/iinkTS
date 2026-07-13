import type { TEraserConfiguration } from "./EraserConfiguration"
import { DefaultEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Client
 */
export type TShapeConvertConfiguration = {
  types?: "shape"[]
  "match-text-size"?: boolean
}

/**
 * @group Client
 */
export type TShapeBeautificationConfiguration = {
  enable?: true
}

/**
 * @group Client
 */
export type TShapeConfiguration = {
  mimeTypes: (
    | "application/vnd.myscript.jiix"
    | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    | "image/svg+xml"
  )[]
  "enable-sub-blocks"?: boolean
  convert?: TShapeConvertConfiguration
  "session-time"?: number
  eraser?: TEraserConfiguration
  beautification?: TShapeBeautificationConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultShapeConvertConfiguration: TShapeConvertConfiguration = {
  types: ["shape"],
  "match-text-size": true,
}

/**
 * @group Client
 * @source
 */
export const DefaultShapeBeautificationConfiguration: TShapeBeautificationConfiguration = {
  enable: true,
}

/**
 * @group Client
 * @source
 */
export const DefaultShapeConfiguration: TShapeConfiguration = {
  convert: DefaultShapeConvertConfiguration,
  eraser: DefaultEraserConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
  beautification: DefaultShapeBeautificationConfiguration,
}
