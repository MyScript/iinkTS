
/**
 * @group Recognizer
 */
export type TImageViewportConfiguration = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * @group Recognizer
 */
export type TImageConfiguration = {
  guides: boolean
  viewport: TImageViewportConfiguration
}

/**
 * @group Recognizer
 */
export type TJiixConfiguration = {
  "bounding-box": boolean
  strokes: boolean
  ids: boolean
  "full-stroke-ids": boolean
  text: {
    chars: boolean
    words: boolean
    lines?: boolean
  }
  style?: boolean
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultJiixConfiguration: TJiixConfiguration = {
  "bounding-box": false,
  strokes: false,
  ids: false,
  "full-stroke-ids": false,
  text: {
    chars: false,
    words: true,
    lines: false
  },
}

/**
 * @group Recognizer
 */
export type TMathMLFlavor = {
  name: string
}

/**
 * @group Recognizer
 */
export type TMathMLExport = {
  flavor: TMathMLFlavor
}

/**
 * @group Recognizer
 */
export type TExportConfiguration = {
  "image-resolution"?: number
  image?: TImageConfiguration
  jiix: TJiixConfiguration
  mathml?: TMathMLExport
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultExportConfiguration: TExportConfiguration = {
  "image-resolution": 300,
  jiix: DefaultJiixConfiguration
}
