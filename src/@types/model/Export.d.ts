import { TBoundingBox, TPoint } from "../math"

/**
 * values of X and Y are in millimeters
 */
export type TJIIXStrokeItem = TJIIXBase & {
  timestamp?: string
  X?: number[]
  Y?: number[]
  F?: number[]
  T?: number[]
  type: string
  id: string
  "bounding-box"?: TBoundingBox
}

type TJIIXBase = {
  "bounding-box"?: TBoundingBox
  items?: TJIIXStrokeItem[]
}

export type TJIIXElement = TJIIXBase & {
  /** @hidden */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  id: string
  type: string
}

export type TJIIXWord = TJIIXBase & {
  id?: string
  label: string
  candidates?: string[]
  "first-char"?: number
  "last-char"?: number
}

export type TJIIXChar = TJIIXBase & {
  label: string
  candidates?: string[]
  word: number
  grid: TPoint[]
}

export type TJIIXTextElement = TJIIXElement & {
  id: string
  type: "Text"
  "bounding-box"?: TBoundingBox
  label: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
}

export type TJIIXNodeElement = TJIIXElement & {
  id: string
  type: "Node"
  kind: "circle" | "ellipse" | "rectangle" | "triangle" | "parallelogram" | "polygon" | "rhombus"
  [key: string]: never
}

export type TJIIXNodeCircle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "circle"
  cx: number
  cy: number
  r: number
}

export type TJIIXNodeEllipse = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "ellipse"
  cx: number
  cy: number
  rx: number
  ry: number
}

export type TJIIXNodeRectangle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "rectangle"
  height: number
  width: number
  x: number
  y: number
}

export type TJIIXNodeTriangle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "triangle"
  points: number[]
}

export type TJIIXNodeParrallelogram = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "parallelogram"
  points: number[]
}

export type TJIIXNodePolygon = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "polygon"
  points: number[]
}

export type TJIIXNodeRhombus = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "rhombus"
  points: number[]
}

export type TJIIXEdgeElement = TJIIXElement & {
  id: string
  type: "Edge"
  kind: string
}

export type TJIIXEdgeLine = TJIIXEdgeElement & {
  id: string
  type: "Edge"
  kind: "line"
  x1: number
  x2: number
  y1: number
  y2: number
  p1Decoration?: "arrow-head" | string
  p2Decoration?: "arrow-head" | string
}

export type TJIIXExport = {
  type: string
  id: string
  "bounding-box"?: TBoundingBox
  version: string
  elements?: TJIIXElement[]
  label?: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
}

/**
 * List all supported MIME types for export.
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 */
export type TExport = {
  /** @hidden */
  [key: string]: TJIIXExport | string | Blob
  /**
   * vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: TJIIXExport
  /**
   * text/plain is only use for text export
   */
  "text/plain"? : string
  /**
   * x-latex is only use for math export
   * @see {@link https://katex.org/docs/browser.html | katex} to render
   */
  "application/x-latex"?: string
  /**
   * mathml+xml is only use for math export
   * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
   */
  "application/mathml+xml"?: string
  /**
   * svg+xml is only use for diagram export
   */
  "image/svg+xml"?: string
  /**
   * vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
   */
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob
}
