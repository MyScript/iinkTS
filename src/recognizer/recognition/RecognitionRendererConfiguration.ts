
/**
 * @group Recognizer
 */
export type TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": boolean
  "draw-image-boxes": boolean
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration = {
  "draw-text-boxes": false,
  "draw-image-boxes": false
}

/**
 * @group Recognizer
 */
export type TRecognitionRendererConfiguration = {
  debug: TRecognitionRendererDebugConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration = {
  debug: DefaultDebugConfiguration
}
