/**
 * @group Client
 */
export type TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

/**
 * @group Client
 * @source
 */
export const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": false,
  "draw-image-boxes": false,
}

/**
 * @group Client
 */
export type TRecognitionRendererConfiguration = {
  debug: TRecognitionRendererDebugConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration = {
  debug: DefaultDebugConfiguration,
}
