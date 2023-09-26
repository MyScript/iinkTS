
export type TImageViewportConfiguration = {
  x: number
  y: number
  width: number
  height: number
}

export type TImageConfiguration = {
  guides: boolean
  viewport: TImageViewportConfiguration
}

export type TJiixConfiguration = {
  "bounding-box"?: boolean
  strokes: boolean
  text?: {
    chars: boolean
    words: boolean
  }
  style?: boolean
}

export type TMathMLFlavor = {
  name: string
}

export type TMathMLExport = {
  flavor: TMathMLFlavor
}

export type TExportConfiguration = {
  "image-resolution"?: number
  image?: TImageConfiguration
  jiix?: TJiixConfiguration
  mathml?: TMathMLExport
}
