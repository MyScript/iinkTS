
/**
 * @group Configuration
 */
export type TImageViewportConfiguration = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * @group Configuration
 */
export type TImageConfiguration = {
  guides: boolean
  viewport: TImageViewportConfiguration
}

/**
 * @group Configuration
 */
export type TJiixConfiguration = {
  "bounding-box": boolean
  strokes: boolean
  ids: boolean,
  "full-stroke-ids": boolean,
  text: {
    chars: boolean
    words: boolean
  }
  style?: boolean
}

/**
 * @group Configuration
 */
export const DefaultJiixConfiguration: TJiixConfiguration = {
  "bounding-box": false,
  strokes: false,
  ids: false,
  "full-stroke-ids": false,
  text: {
    chars: false,
    words: true
  },
}

/**
 * @group Configuration
 */
export type TMathMLFlavor = {
  name: string
}

/**
 * @group Configuration
 */
export type TMathMLExport = {
  flavor: TMathMLFlavor
}

/**
 * @group Configuration
 */
export type TExportConfiguration = {
  "image-resolution"?: number
  image?: TImageConfiguration
  jiix: TJiixConfiguration
  mathml?: TMathMLExport
}

/**
 * @group Configuration
 */
export const DefaultExportConfiguration: TExportConfiguration = {
  "image-resolution": 300,
  jiix: DefaultJiixConfiguration
}
