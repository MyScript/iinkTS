/**
 * @group Client
 */
export type TImageViewportConfiguration = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * @group Client
 */
export type TImageConfiguration = {
  guides: boolean
  viewport: TImageViewportConfiguration
}

/**
 * @group Client
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
 * @group Client
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
    lines: false,
  },
}

/**
 * @group Client
 */
export type TMathMLFlavor = {
  name: string
}

/**
 * @group Client
 */
export type TMathMLExport = {
  flavor: TMathMLFlavor
}

/**
 * @group Client
 */
export type TExportConfiguration = {
  "image-resolution"?: number
  image?: TImageConfiguration
  jiix: TJiixConfiguration
  mathml?: TMathMLExport
}

/**
 * @group Client
 * @source
 */
export const DefaultExportConfiguration: TExportConfiguration = {
  "image-resolution": 300,
  jiix: DefaultJiixConfiguration,
}
