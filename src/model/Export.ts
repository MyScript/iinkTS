import { EdgeDecoration, TBoundingBox, TPoint } from "../primitive"

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
export enum TJIIXELementType
{
  Text = "Text",
  Node = "Node",
  Edge = "Edge",
  RawContent = "Raw Content",
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#diagram-item-blocks | Element node kind}
 */
export enum TJIIXNodeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Polygon = "polygon",
  Rhombus = "rhombus",
}

/**
 * @group JIIX
 */
export enum TJIIXEdgeKind
{
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#stroke-item | Stroke item}
 */
export type TJIIXStrokeItem = {
  type: "stroke"
  id: string
  "full-id"?: string
  timestamp?: string
  X?: number[]
  Y?: number[]
  F?: number[]
  T?: number[]
}

/**
 * @group JIIX
 */
export type TJIIXBase = {
  "bounding-box"?: TBoundingBox
  items?: TJIIXStrokeItem[]
}

/**
 * @group JIIX
 */
export type TJIIXElementBase<T = string> = TJIIXBase & {
  id: string
  type: T
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
export type TJIIXWord = TJIIXBase & {
  id?: string
  label: string
  candidates?: string[]
  "first-char"?: number
  "last-char"?: number
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
export type TJIIXChar = TJIIXBase & {
  label: string
  candidates?: string[]
  word: number
  grid: TPoint[]
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
export type TJIIXTextElement = TJIIXElementBase<TJIIXELementType.Text> & {
  id: string
  "bounding-box"?: TBoundingBox
  label: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
}

/**
 * @group JIIX
 */
export type TJIIXNodeElementBase<K = string> = TJIIXElementBase<TJIIXELementType.Node> & {
  id: string
  kind: K
}

/**
 * @group JIIX
 */
export type TJIIXNodeCircle = TJIIXNodeElementBase<TJIIXNodeKind.Circle> & {
  id: string
  cx: number
  cy: number
  r: number
}

/**
 * @group JIIX
 */
export type TJIIXNodeEllipse = TJIIXNodeElementBase<TJIIXNodeKind.Ellipse> & {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
}

/**
 * @group JIIX
 */
export type TJIIXNodeRectangle = TJIIXNodeElementBase<TJIIXNodeKind.Rectangle> & {
  id: string
  height: number
  width: number
  x: number
  y: number
}

/**
 * @group JIIX
 */
export type TJIIXNodeTriangle = TJIIXNodeElementBase<TJIIXNodeKind.Triangle> & {
  id: string
  points: number[]
}

/**
 * @group JIIX
 */
export type TJIIXNodeParrallelogram = TJIIXNodeElementBase<TJIIXNodeKind.Parallelogram> & {
  id: string
  points: number[]
}

/**
 * @group JIIX
 */
export type TJIIXNodePolygon = TJIIXNodeElementBase<TJIIXNodeKind.Polygon> & {
  id: string
  points: number[]
}

/**
 * @group JIIX
 */
export type TJIIXNodeRhombus = TJIIXNodeElementBase<TJIIXNodeKind.Rhombus> & {
  id: string
  points: number[]
}

/**
 * @group JIIX
 */
export type TJIIXNodeElement =
  TJIIXNodeCircle |
  TJIIXNodeEllipse |
  TJIIXNodeRectangle |
  TJIIXNodeTriangle |
  TJIIXNodeParrallelogram |
  TJIIXNodePolygon |
  TJIIXNodeRhombus

/**
 * @group JIIX
 */
export type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<TJIIXELementType.Edge> & {
  kind: K
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#line-item | Element line}
 */
export type TJIIXEdgeLine = TJIIXEdgeElementBase<TJIIXEdgeKind.Line> & {
  x1: number
  x2: number
  y1: number
  y2: number
  p1Decoration?: EdgeDecoration
  p2Decoration?: EdgeDecoration
}

/**
 * @group JIIX
 */
export type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<TJIIXEdgeKind.PolyEdge> & {
  edges: TJIIXEdgeLine[]
}

/**
 * @group JIIX
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#arc-item | Element arc}
 */
export type TJIIXEdgeArc = TJIIXEdgeElementBase<TJIIXEdgeKind.Arc> & {
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
 * @group JIIX
 */
export type TJIIXEdgeElement =
  TJIIXEdgeLine |
  TJIIXEdgePolyEdge |
  TJIIXEdgeArc

/**
 * @group JIIX
 * {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/web/jiix}
 */
export type TJIIXElement =
  TJIIXTextElement |
  TJIIXNodeElement |
  TJIIXEdgeElement

/**
 * @group JIIX
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
 * @group JIIX
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix | Documentation}
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
  "text/plain"?: string
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
