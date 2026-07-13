import type { TEraserConfiguration } from "./EraserConfiguration"
import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TMarginConfiguration } from "./MarginConfiguration"
import { DefaultMarginConfiguration } from "./MarginConfiguration"

/**
 * @group Client
 */
export type TTextGuidesConfigurationV2 = {
  enable: boolean
  "line-gap-mm"?: number
  "origin-y-mm"?: number
}

/**
 * @group Client
 * @source
 */
export const DefaultTextGuidesConfigurationV2: TTextGuidesConfigurationV2 = {
  enable: true,
  "line-gap-mm": 100,
  "origin-y-mm": 0,
}

/**
 * @group Client
 */
export type TTextHTTPClientV2ConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Client
 */
export type TTextHTTPClientV2Configuration = {
  text?: boolean
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
  margin: TMarginConfiguration
  guides: TTextGuidesConfigurationV2
  configuration?: TTextHTTPClientV2ConfConfiguration
  eraser?: TEraserConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultTexConfigurationV2: TTextHTTPClientV2Configuration = {
  guides: DefaultTextGuidesConfigurationV2,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
