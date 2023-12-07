import { TBoundingBox, TPoint } from "../utils"

/**
 * @group Model/Export
 * @remarks values of X and Y are in millimeters
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

/**
 * @group Model/Export
 */
export type TJIIXBase = {
  "bounding-box"?: TBoundingBox
  items?: TJIIXStrokeItem[]
}

/**
 * @group Model/Export
 */
export type TJIIXElement = TJIIXBase & {
  /** @hidden */
  [key: string]: unknown
  id: string
  type: string
}

/**
 * @group Model/Export
 */
export type TJIIXWord = TJIIXBase & {
  id?: string
  label: string
  candidates?: string[]
  "first-char"?: number
  "last-char"?: number
}

/**
 * @group Model/Export
 */
export type TJIIXChar = TJIIXBase & {
  label: string
  candidates?: string[]
  word: number
  grid: TPoint[]
}

/**
 * @group Model/Export
 */
export type TJIIXTextElement = TJIIXElement & {
  id: string
  type: "Text"
  "bounding-box"?: TBoundingBox
  label: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodeElement = TJIIXElement & {
  id: string
  type: "Node"
  kind: "circle" | "ellipse" | "rectangle" | "triangle" | "parallelogram" | "polygon" | "rhombus"
}

/**
 * @group Model/Export
 */
export type TJIIXNodeCircle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "circle"
  cx: number
  cy: number
  r: number
}

/**
 * @group Model/Export
 */
export type TJIIXNodeEllipse = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "ellipse"
  cx: number
  cy: number
  rx: number
  ry: number
}

/**
 * @group Model/Export
 */
export type TJIIXNodeRectangle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "rectangle"
  height: number
  width: number
  x: number
  y: number
}

/**
 * @group Model/Export
 */
export type TJIIXNodeTriangle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "triangle"
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodeParrallelogram = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "parallelogram"
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodePolygon = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "polygon"
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodeRhombus = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: "rhombus"
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXEdgeElement = TJIIXElement & {
  id: string
  type: "Edge"
  kind: string
}

/**
 * @group Model/Export
 */
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

/**
 * @group Model/Export
 */
export type TJIIXEdgeArc = TJIIXEdgeElement & {
  id: string
  type: "Edge"
  kind: "arc"
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  phi: number,
  startAngle: number,
  sweepAngle: number
}

/**
 * @group Model/Export
 */
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
 * @group Model/Export
 * @remarks
 * List all supported MIME types for export.
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 */
export type TExport = {
  /** @hidden */
  [key: string]: unknown
  /**
   * @remarks vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: TJIIXExport
  /**
   * @remarks text/plain is only use for text export
   */
  "text/plain"? : string
  /**
   * @remarks x-latex is only use for math export
   * @see {@link https://katex.org/docs/browser.html | katex} to render
   */
  "application/x-latex"?: string
  /**
   * @remarks mathml+xml is only use for math export
   * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
   */
  "application/mathml+xml"?: string
  /**
   * @remarks svg+xml is only use for diagram export
   */
  "image/svg+xml"?: string
  /**
   * @remarks vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
   */
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob
}
