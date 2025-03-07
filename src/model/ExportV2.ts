import { TRecognitionV2Type } from "../recognizer"
import { TJIIXBase, TJIIXWord } from "./Export"

/**
 * @group Exports
 * @remarks List all supported MIME types for export in RecognizersV2. Please note, the MIME types supported depend on the recognition type configured
 */
export enum ExportV2Type {
  JIIX = "application/vnd.myscript.jiix",
  TEXT = "text/plain",
  LATEX = "application/x-latex",
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */


/**
 * @group Exports
*/
export type JIIXV2RangeItem = {
  from: { stroke: number }
  to: { stroke: number }
}

/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
export type JIIXV2Range = JIIXV2RangeItem[]

/**
 * @group Exports
 */
export type JIIXV2Base = TJIIXBase & {
  range?: JIIXV2Range
}

/**
 * @group Exports
 */
export type JIIXV2ElementBase<T = TRecognitionV2Type> = JIIXV2Base & {
  id: string
  type: T
}

/**
 * @group Exports
 */
export type JIIXV2WordSpans = {
  type: string
  range: JIIXV2RangeItem[]
  label: string
}

/**
 * @group Exports
 */
export type JIIXV2WordLines = {
  type: string
  range: JIIXV2RangeItem[]
  label: string
  spans: JIIXV2WordSpans[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
export type JIIXV2Word = JIIXV2Base & TJIIXWord & {
  lines: JIIXV2WordLines[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2/#text-interpretation | Text Element }
 */
export type JIIXV2TextElement = JIIXV2ElementBase<"Text"> &  JIIXV2Word & {
}

/**
 * @group Exports
 */
export enum JIIXV2ShapeKind {
  Circle = "circle",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Triangle = "triangle",
  IsoscelesTriangle = "isosceles triangle",
  RightTriangle = "right triangle",
  RightIsoscelesTriangle = "right isosceles triangle",
  EquilateralTriangle = "equilateral triangle",
  Quadrilateral = "quadrilateral",
  Trapezoid = "trapezoid",
  Square = "square",
  Parallelogram = "parallelogram",
  Polygon = "polygon",
  Rhombus = "rhombus",
  Line = "line",
  ArcOfEllipse = "arc of ellipse",
  ArcOfCircle = "arc of circle",
  PolyLine = "polyline",
  Arrow = "arrow",
  CurvedDoubleArrow = "curved double arrow",
  CurvedArrow = "curved arrow",
  PolylineArrow = "polyline arrow",
  PolylineDoubleArrow = "polyline double arrow",
  DoubleArrow = "double arrow",
}

/**
   * @group Exports
   */
export type JIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square"

/**
   * @group Exports
   */
export type JIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = JIIXV2ElementBase<K> & {
  kind: K
}

/**
 * @group Exports
 */
export type JIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> & {
  kind: K
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
  orientation: number
  type: string
}

/**
 * @group Exports
 */
export type JIIXV2Circle = JIIXV2EllipseBase<JIIXV2ShapeKind.Circle>

/**
 * @group Exports
 */
export type JIIXV2Ellipse = JIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>

/**
 * @group Exports
 */
export type JIIXV2PrimitiveArc = {
  type: "arc"
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  phi: number,
  startAngle: number,
  sweepAngle: number
  startDecoration?: string
  endDecoration?: string
}

/**
 * @group Exports
 */
export type JIIXV2PrimitiveLine = {
  type: "line"
  x1: number
  y1: number
  x2: number
  y2: number
  startDecoration?: string
  endDecoration?: string
}

/**
 * @group Exports
 */
export type JIIXV2PolygonBase<K = JIIXV2PolygonType> = JIIXV2ShapeItemBase<K> & {
  kind: K
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapePolygon = JIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonRightTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonRightIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonEquilateralTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonQuadrilateral = JIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonTrapezoid = JIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonParallelogram = JIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonRhombus = JIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonRectangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>

/**
 * @group Exports
 */
export type JIIXV2ShapePolygonSquare = JIIXV2PolygonBase<JIIXV2ShapeKind.Square>

/**
 * @group Exports
 */
export type JIIXV2ShapeLine = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeLineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeLineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeLinePolyline = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeLinePolylineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeLinePolylineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
  primitives: JIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeCurvedDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
  primitives: JIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeCurvedArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
  primitives: JIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeArcOfEllipse = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
  primitives: JIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeArcOfCircle = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
  primitives: JIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type JIIXV2ShapeElement = JIIXV2Circle | JIIXV2Ellipse | JIIXV2ShapePolygon | JIIXV2ShapePolygonTriangle | JIIXV2ShapePolygonIsoscelesTriangle | JIIXV2ShapePolygonRightTriangle | JIIXV2ShapePolygonRightIsoscelesTriangle | JIIXV2ShapePolygonEquilateralTriangle | JIIXV2ShapePolygonQuadrilateral | JIIXV2ShapePolygonTrapezoid | JIIXV2ShapePolygonParallelogram | JIIXV2ShapePolygonRhombus | JIIXV2ShapePolygonRectangle | JIIXV2ShapePolygonSquare | JIIXV2ShapeLineArrow | JIIXV2ShapeLineDoubleArrow | JIIXV2ShapeLinePolyline | JIIXV2ShapeLinePolylineArrow | JIIXV2ShapeLinePolylineDoubleArrow | JIIXV2ShapeCurvedDoubleArrow | JIIXV2ShapeCurvedArrow | JIIXV2ShapeArcOfEllipse | JIIXV2ShapeArcOfCircle | JIIXV2ShapeLine

/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
export type JIIXV2RawContentBase<T = Omit<TRecognitionV2Type, "MATH">> = {
  type: T
  range?: JIIXV2Range
}

/**
 * @group Exports
 */
export type JIIXV2RawContentItemText = JIIXV2RawContentBase<"Text"> & JIIXV2Word

/**
 * @group Exports
 */
export type JIIXV2RawContentTextLine = {
  type: "Line"
  label: string
  range?: JIIXV2RangeItem
}

/**
 * @group Exports
 */
export type JIIXV2RawContentShape = JIIXV2RawContentBase<"Shape"> & {
  label: string
  shape: JIIXV2RawContentItemShape[]
}

/**
 * @group Exports
 */
export type JIIXV2RawContentItemShape = JIIXV2RawContentBase<"Shape"> & {
  range: JIIXV2RangeItem[]
  elements: JIIXV2ShapeElement[]
}

export type JIIXV2RawContentElement = JIIXV2RawContentItemText | JIIXV2RawContentItemShape

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
 */
export type JIIXV2Element =
  JIIXV2TextElement |
  JIIXV2ShapeElement |
  JIIXV2RawContentElement

/**
 * @group Exports
 */
export type JIIXV2Export = JIIXV2Base & {
  type: string
  id: string
  version: string
  elements?: JIIXV2Element[]
  label?: string
  words?: JIIXV2Word[]
}

/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
 */
export type TExportV2 = {
  /** @hidden */
  [key: string]: unknown
  /**
   * @remarks vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: JIIXV2Export
  /**
   * @remarks text/plain is only use for text export
   */
  "text/plain"?: string
  /**
   * @remarks x-latex is only use for math export
   * @see {@link https://katex.org/docs/browser.html | katex} to render
   */
  "application/x-latex"?: string
}
