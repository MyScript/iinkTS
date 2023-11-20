
/**
 * @group Configuration
 */
export type TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

/**
 * @group Configuration
 */
export const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": false,
  "draw-image-boxes": false
}

/**
 * @group Configuration
 */
export type TRecognitionRendererConfiguration = {
  debug: TRecognitionRendererDebugConfiguration
}

/**
 * @group Configuration
 */
export const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration = {
  debug: DefaultDebugConfiguration
}
