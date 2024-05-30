import { EdgeDecoration, EdgeKind, ShapeKind, TBoundingBox, TPoint } from "../primitive"

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
  "full-id"?: string
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
  kind: ShapeKind
}

/**
 * @group Model/Export
 */
export type TJIIXNodeCircle = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: ShapeKind.Circle
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
  kind: ShapeKind.Ellipse
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
  kind: ShapeKind.Rectangle
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
  kind: ShapeKind.Triangle
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodeParrallelogram = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: ShapeKind.Parallelogram
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodePolygon = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: ShapeKind.Polygon
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXNodeRhombus = TJIIXNodeElement & {
  id: string
  type: "Node"
  kind: ShapeKind.Rhombus
  points: number[]
}

/**
 * @group Model/Export
 */
export type TJIIXEdgeElement = TJIIXElement & {
  type: "Edge"
  kind: EdgeKind
}

/**
 * @group Model/Export
 */
export type TJIIXEdgeLine = TJIIXEdgeElement & {
  kind: EdgeKind.Line
  x1: number
  x2: number
  y1: number
  y2: number
  p1Decoration?: EdgeDecoration
  p2Decoration?: EdgeDecoration
}

/**
 * @group Model/Export
 */
export type TJIIXEdgePolyEdge = TJIIXEdgeElement & {
  kind: EdgeKind.PolyEdge
  edges: TJIIXEdgeLine[]
}

/**
 * @group Model/Export
 */
export type TJIIXEdgeArc = TJIIXEdgeElement & {
  kind: EdgeKind.Arc
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  phi: number,
  startAngle: number,
  sweepAngle: number
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
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
