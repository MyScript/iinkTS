import type { TRecognitionTypeV2 } from "@/client"

import type { TJIIXBase, TJIIXWord } from "./ExportCommon"

/**
 * @group Exports
 * @remarks List all supported MIME types for export in ClientsV2. Please note, the MIME types supported depend on the recognition type configured
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
export type TJIIXV2RangeItem = {
  from: { stroke: number }
  to: { stroke: number }
}

/**
 * @group Exports
 * @remarks Only in InkCanvas () activated with recognition.export.JIIXV2.range = true
 */
export type TJIIXV2Range = TJIIXV2RangeItem[]

/**
 * @group Exports
 */
export type TJIIXV2Base = TJIIXBase & {
  range?: TJIIXV2Range
}

/**
 * @group Exports
 */
export type TJIIXV2ElementBase<T = TRecognitionTypeV2> = TJIIXV2Base & {
  id: string
  type: T
}

/**
 * @group Exports
 */
export type TJIIXV2LineSpan = {
  type: string
  range: TJIIXV2RangeItem[]
  label: string
}

/**
 * @group Exports
 */
export type TJIIXV2Line = {
  type: string
  range: TJIIXV2RangeItem[]
  label: string
  spans: TJIIXV2LineSpan[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
export type TJIIXV2Expression = TJIIXV2Base &
  TJIIXWord & {
    lines: TJIIXV2Line[]
  }

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Text Element }
 */
export type TJIIXV2TextElement = TJIIXV2ElementBase<"Text"> & TJIIXV2Expression

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Math Element }
 */
export type TJIIXV2MathElement = TJIIXV2ElementBase<"Math"> & TJIIXV2Expression

/** @group Exports
 */
export type TJIIXV2DrawingElement = TJIIXV2ElementBase<"Drawing"> & TJIIXV2Expression

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
export type TJIIXV2PolygonType =
  | "triangle"
  | "isosceles triangle"
  | "right triangle"
  | "right isosceles triangle"
  | "equilateral triangle"
  | "quadrilateral"
  | "trapezoid"
  | "parallelogram"
  | "rhombus"
  | "rectangle"
  | "square"

/**
 * @group Exports
 */
export type TJIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = TJIIXV2ElementBase<K> & {
  kind: K
}

/**
 * @group Exports
 */
export type TJIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = TJIIXV2ShapeItemBase<
  JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle
> & {
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
export type TJIIXV2Circle = TJIIXV2EllipseBase<JIIXV2ShapeKind.Circle>

/**
 * @group Exports
 */
export type TJIIXV2Ellipse = TJIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>

/**
 * @group Exports
 */
export type TJIIXV2PrimitiveArc = {
  type: "arc"
  cx: number
  cy: number
  rx: number
  ry: number
  phi: number
  startAngle: number
  sweepAngle: number
  startDecoration?: string
  endDecoration?: string
}

/**
 * @group Exports
 */
export type TJIIXV2PrimitiveLine = {
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
export type TJIIXV2PolygonBase<K = TJIIXV2PolygonType> = TJIIXV2ShapeItemBase<K> & {
  kind: K
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygon = TJIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonRightTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonRightIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonEquilateralTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonQuadrilateral = TJIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonTrapezoid = TJIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonParallelogram = TJIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonRhombus = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonRectangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>

/**
 * @group Exports
 */
export type TJIIXV2ShapePolygonSquare = TJIIXV2PolygonBase<JIIXV2ShapeKind.Square>

/**
 * @group Exports
 */
export type TJIIXV2ShapeLine = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeLineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeLineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeLinePolyline = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeLinePolylineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeLinePolylineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
  primitives: TJIIXV2PrimitiveLine[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeCurvedDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
  primitives: TJIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeCurvedArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
  primitives: TJIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeArcOfEllipse = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
  primitives: TJIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeArcOfCircle = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
  primitives: TJIIXV2PrimitiveArc[]
}

/**
 * @group Exports
 */
export type TJIIXV2ShapeElement =
  | TJIIXV2Circle
  | TJIIXV2Ellipse
  | TJIIXV2ShapePolygon
  | TJIIXV2ShapePolygonTriangle
  | TJIIXV2ShapePolygonIsoscelesTriangle
  | TJIIXV2ShapePolygonRightTriangle
  | TJIIXV2ShapePolygonRightIsoscelesTriangle
  | TJIIXV2ShapePolygonEquilateralTriangle
  | TJIIXV2ShapePolygonQuadrilateral
  | TJIIXV2ShapePolygonTrapezoid
  | TJIIXV2ShapePolygonParallelogram
  | TJIIXV2ShapePolygonRhombus
  | TJIIXV2ShapePolygonRectangle
  | TJIIXV2ShapePolygonSquare
  | TJIIXV2ShapeLineArrow
  | TJIIXV2ShapeLineDoubleArrow
  | TJIIXV2ShapeLinePolyline
  | TJIIXV2ShapeLinePolylineArrow
  | TJIIXV2ShapeLinePolylineDoubleArrow
  | TJIIXV2ShapeCurvedDoubleArrow
  | TJIIXV2ShapeCurvedArrow
  | TJIIXV2ShapeArcOfEllipse
  | TJIIXV2ShapeArcOfCircle
  | TJIIXV2ShapeLine

/**
 * @group Exports
 * @remarks Only in InkCanvas () activated with recognition.export.JIIXV2.range = true
 */
export type TJIIXV2RawContentBase<T = TRecognitionTypeV2> = {
  type: T
  range?: TJIIXV2Range
}

/**
 * @group Exports
 */
export type TJIIXV2RawContentItemText = TJIIXV2RawContentBase<"Text"> & TJIIXV2Expression

/**
 * @group Exports
 */
export type TJIIXV2RawContentTextLine = {
  type: "Line"
  label: string
  range?: TJIIXV2RangeItem
}

/**
 * @group Exports
 */
export type TJIIXV2RawContentShape = TJIIXV2RawContentBase<"Shape"> & {
  label: string
  shape: TJIIXV2RawContentItemShape[]
}

/**
 * @group Exports
 */
export type TJIIXV2RawContentItemShape = TJIIXV2RawContentBase<"Shape"> & {
  range: TJIIXV2RangeItem[]
  elements: TJIIXV2ShapeElement[]
}

/**
 * @group Exports
 */
export type TJIIXV2RawContentElement = TJIIXV2RawContentItemText | TJIIXV2RawContentItemShape

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
 */
export type TJIIXV2Element =
  TJIIXV2TextElement | TJIIXV2ShapeElement | TJIIXV2MathElement | TJIIXV2DrawingElement | TJIIXV2RawContentElement

/**
 * @group Exports
 */
export type TJIIXV2Export = TJIIXV2Base & {
  type: string
  id: string
  version: string
  elements?: TJIIXV2Element[]
  label?: string
  words?: TJIIXV2Expression[]
}

/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
 */
export type TExportV2 = {
  /** @hidden */
  [key: string]: unknown
  /**
   * @remarks vnd.myscript.jiix is used for text and raw-content exports
   */
  "application/vnd.myscript.jiix"?: TJIIXV2Export
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
