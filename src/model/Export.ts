import { EdgeDecoration, TBox, TPoint } from "../symbol"

/**
 * @group Exports
 * @remarks List all supported MIME types for export. Please note, the MIME types supported depend on the recognition type configured
 */
export enum ExportType
{
  JIIX = "application/vnd.myscript.jiix",
  TEXT = "text/plain",
  LATEX = "application/x-latex",
  MATHML = "application/mathml+xml",
  SVG = "image/svg+xml",
  OFFICE_DOCUMENT = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
export enum JIIXELementType
{
  Text = "Text",
  Node = "Node",
  Edge = "Edge",
  RawContent = "Raw Content",
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#diagram-item-blocks | Element node kind}
 */
export enum JIIXNodeKind
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
 * @group Exports
 */
export enum JIIXEdgeKind
{
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group Exports
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
 * @group Exports
 */
export type TJIIXBase = {
  "bounding-box"?: TBox
  items?: TJIIXStrokeItem[]
}

/**
 * @group Exports
 */
export type TJIIXElementBase<T = string> = TJIIXBase & {
  id: string
  type: T
}

/**
 * @group Exports
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
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
export type TJIIXChar = TJIIXBase & {
  label: string
  candidates?: string[]
  word: number
  grid: TPoint[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
export type TJIIXLine = {
  "baseline-y": number
  "first-char"?: number
  "last-char"?: number
  "x-height": number
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
export type TJIIXTextElement = TJIIXElementBase<JIIXELementType.Text> & {
  id: string
  "bounding-box"?: TBox
  label: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
  lines?: TJIIXLine[]
}

/**
 * @group Exports
 */
export type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Node> & {
  id: string
  kind: K
}

/**
 * @group Exports
 */
export type TJIIXNodeCircle = TJIIXNodeElementBase<JIIXNodeKind.Circle> & {
  id: string
  cx: number
  cy: number
  r: number
}

/**
 * @group Exports
 */
export type TJIIXNodeEllipse = TJIIXNodeElementBase<JIIXNodeKind.Ellipse> & {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
  orientation: number
}

/**
 * @group Exports
 */
export type TJIIXNodeRectangle = TJIIXNodeElementBase<JIIXNodeKind.Rectangle> & {
  id: string
  height: number
  width: number
  x: number
  y: number
}

/**
 * @group Exports
 */
export type TJIIXNodeTriangle = TJIIXNodeElementBase<JIIXNodeKind.Triangle> & {
  id: string
  points: number[]
}

/**
 * @group Exports
 */
export type TJIIXNodeParrallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
  id: string
  points: number[]
}

/**
 * @group Exports
 */
export type TJIIXNodePolygon = TJIIXNodeElementBase<JIIXNodeKind.Polygon> & {
  id: string
  points: number[]
}

/**
 * @group Exports
 */
export type TJIIXNodeRhombus = TJIIXNodeElementBase<JIIXNodeKind.Rhombus> & {
  id: string
  points: number[]
}

/**
 * @group Exports
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
 * @group Exports
 */
export type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Edge> & {
  kind: K
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#line-item | Element line}
 */
export type TJIIXEdgeLine = TJIIXEdgeElementBase<JIIXEdgeKind.Line> & {
  x1: number
  x2: number
  y1: number
  y2: number
  p1Decoration?: EdgeDecoration
  p2Decoration?: EdgeDecoration
}

/**
 * @group Exports
 */
export type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<JIIXEdgeKind.PolyEdge> & {
  edges: TJIIXEdgeLine[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#arc-item | Element arc}
 */
export type TJIIXEdgeArc = TJIIXEdgeElementBase<JIIXEdgeKind.Arc> & {
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
 * @group Exports
 */
export type TJIIXEdgeElement =
  TJIIXEdgeLine |
  TJIIXEdgePolyEdge |
  TJIIXEdgeArc

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/web/jiix | Exports}
 */
export type TJIIXElement =
  TJIIXTextElement |
  TJIIXNodeElement |
  TJIIXEdgeElement

/**
 * @group Exports
 */
export type TJIIXExport = {
  type: string
  id: string
  "bounding-box"?: TBox
  version: string
  elements?: TJIIXElement[]
  label?: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
}

/**
 * @group Exports
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
