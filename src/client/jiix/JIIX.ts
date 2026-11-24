import type { TBox } from "@/core"
import type { EdgeDecoration } from "@/symbol"

import type { TJIIXChar, TJIIXElementBase, TJIIXLine, TJIIXWord } from "./JIIXCommon"
import type { TJIIXMathElement } from "./JIIXMath"

/**
 * @group Client/Export
 */
// Re-export common types for backward compatibility
export type { TJIIXBase, TJIIXChar, TJIIXElementBase, TJIIXLine, TJIIXStrokeItem, TJIIXWord } from "./JIIXCommon"

/**
 * @group Client/Export
 */
// Export Math types
export type {
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXMathFraction,
  TJIIXMathGroup,
  TJIIXMathNumber,
  TJIIXMathOperator,
  TJIIXMathRoot,
  TJIIXMathSquareRoot,
  TJIIXMathSubscript,
  TJIIXMathSubsuperscript,
  TJIIXMathSuperscript,
  TJIIXMathSymbol,
  TJIIXMathSymbolExpression,
  TJIIXMathVariable,
} from "./JIIXMath"
export { JIIXMathExpressionType } from "./JIIXMath"

/**
 * @group Client/Export
 * @remarks List all supported MIME types for export. Please note, the MIME types supported depend on the recognition type configured
 */
export enum ExportType {
  JIIX = "application/vnd.myscript.jiix",
  TEXT = "text/plain",
  LATEX = "application/x-latex",
  MATHML = "application/mathml+xml",
  SVG = "image/svg+xml",
  OFFICE_DOCUMENT = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/  Element type}
 */
export enum JIIXElementType {
  Text = "Text",
  Math = "Math",
  Node = "Node",
  Edge = "Edge",
  RawContent = "Raw Content",
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#diagram-item-blocks | Element node kind}
 */
export enum JIIXNodeKind {
  Circle = "circle",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Polygon = "polygon",
  Rhombus = "rhombus",
}

/**
 * @group Client/Export
 */
export enum JIIXEdgeKind {
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#text-interpretation | Text Element }
 */
export type TJIIXTextElement = TJIIXElementBase<JIIXElementType.Text> & {
  id: string
  "bounding-box"?: TBox
  label: string
  words?: TJIIXWord[]
  chars?: TJIIXChar[]
  lines?: TJIIXLine[]
}

/**
 * @group Client/Export
 */
export type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Node> & {
  id: string
  kind: K
}

/**
 * @group Client/Export
 */
export type TJIIXNodeCircle = TJIIXNodeElementBase<JIIXNodeKind.Circle> & {
  id: string
  cx: number
  cy: number
  r: number
}

/**
 * @group Client/Export
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
 * @group Client/Export
 */
export type TJIIXNodeRectangle = TJIIXNodeElementBase<JIIXNodeKind.Rectangle> & {
  id: string
  height: number
  width: number
  x: number
  y: number
}

/**
 * @group Client/Export
 */
export type TJIIXNodeTriangle = TJIIXNodeElementBase<JIIXNodeKind.Triangle> & {
  id: string
  points: number[]
}

/**
 * @group Client/Export
 */
export type TJIIXNodeParallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
  id: string
  points: number[]
}

/**
 * @group Client/Export
 */
export type TJIIXNodePolygon = TJIIXNodeElementBase<JIIXNodeKind.Polygon> & {
  id: string
  points: number[]
}

/**
 * @group Client/Export
 */
export type TJIIXNodeRhombus = TJIIXNodeElementBase<JIIXNodeKind.Rhombus> & {
  id: string
  points: number[]
}

/**
 * @group Client/Export
 */
export type TJIIXNodeElement =
  | TJIIXNodeCircle
  | TJIIXNodeEllipse
  | TJIIXNodeRectangle
  | TJIIXNodeTriangle
  | TJIIXNodeParallelogram
  | TJIIXNodePolygon
  | TJIIXNodeRhombus

/**
 * @group Client/Export
 */
export type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Edge> & {
  kind: K
  /**
   * @remarks IDs of the Node elements this edge connects, in `ports` order. Populated by the
   * server for diagrams with more than one shape; empty for a standalone edge with nothing to
   * connect to.
   */
  connected?: string[]
  /**
   * @remarks Port index on each connected node, parallel to `connected`
   */
  ports?: number[]
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#line-item | Element line}
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
 * @group Client/Export
 */
export type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<JIIXEdgeKind.PolyEdge> & {
  edges: TJIIXEdgeLine[]
}

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/#arc-item | Element arc}
 */
export type TJIIXEdgeArc = TJIIXEdgeElementBase<JIIXEdgeKind.Arc> & {
  cx: number
  cy: number
  rx: number
  ry: number
  phi: number
  startAngle: number
  sweepAngle: number
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
}

/**
 * @group Client/Export
 */
export type TJIIXEdgeElement = TJIIXEdgeLine | TJIIXEdgePolyEdge | TJIIXEdgeArc

/**
 * @group Client/Export
 * @remarks {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/ | Exports}
 */
export type TJIIXElement = TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement

/**
 * @group Client/Export
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
 * @group Client/Export
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/cloud/latest/reference/jiix/ | Documentation}
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

/**
 * @group Client/Export
 * @summary Exports as the websocket protocols send them: every format a string, JIIX included
 * @remarks {@link parseExportedJIIX} turns it into a {@link TExport}.
 */
export type TExportWire = {
  [mimeType: string]: string | undefined
}

/**
 * @group Client
 * @summary Reads the exports of a websocket message, parsing the JIIX sent as a JSON string
 */
export function parseExportedJIIX(exports: TExportWire): TExport {
  const { "application/vnd.myscript.jiix": jiix, ...others } = exports
  return jiix ? { ...others, "application/vnd.myscript.jiix": JSON.parse(jiix) as TJIIXExport } : others
}
