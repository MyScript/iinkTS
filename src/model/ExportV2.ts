import { TRecognitionType } from "../recognizer"
import { TBox } from "../symbol"

/**
 * @group Exports
 * @remarks List all supported MIME types for export. Please note, the MIME types supported depend on the recognition type configured
 */
export enum ExportV2Type
{
  JIIX = "application/vnd.myscript.jiix",
  TEXT = "text/plain",
  LATEX = "application/x-latex",
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/JIIXV2  Element type}
 */
export type JIIXV2ElementType = Omit<TRecognitionType, "DIAGRAM">

/**
 * @group Exports
 */
export type JIIXV2Base = {
  range?: JIIXV2Range
  "bounding-box"?: TBox
}

/**
 * @group Exports
 */
export type JIIXV2RangeItem = {
  from: { stroke: number}
  to: { stroke: number}
}

/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
export type JIIXV2Range = JIIXV2RangeItem[]

/**
 * @group Exports
 */
export type JIIXV2ElementBase<T = JIIXV2ElementType> = JIIXV2Base & {
  id: string
  type: T
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/JIIXV2/#word-object | Word object}
 */
export type JIIXV2Word = JIIXV2Base & {
  id?: string
  label: string
  candidates?: string[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/JIIXV2/#text-interpretation | Text Element }
 */
export type JIIXV2TextElement = JIIXV2ElementBase<"Text"> & {
  label: string
  words?: JIIXV2Word[]
}

export enum JIIXV2ShapeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Polygon = "polygon",
  Rhombus = "rhombus",
  Line = "line",
  PolyEdge = "polyedge",
  Arrow = "arrow",
}

/**
   * @group Exports
   */
export type JIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = JIIXV2Base & {
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

export type JIIXV2Circle = JIIXV2EllipseBase<JIIXV2ShapeKind.Circle>

export type JIIXV2Ellipse = JIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>

export type JIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square"

export type JIIXV2Line = {
    type: "line"
    x1: number
    y1: number
    x2: number
    y2: number
    startDecoration?: string
    endDecoration?: string
}

export type JIIXV2PolygonBase<K = JIIXV2PolygonType> = JIIXV2ShapeItemBase<K> & {
    kind: K
    primitives: JIIXV2Line[]
}

export type JIIXV2Polygon = JIIXV2PolygonBase<"polygon">
export type JIIXV2Triangle = JIIXV2PolygonBase<"triangle">
export type JIIXV2IsoscelesTriangle = JIIXV2PolygonBase<"isosceles triangle">
export type JIIXV2RightTriangle = JIIXV2PolygonBase<"right triangle">
export type JIIXV2RightIsoscelesTriangle = JIIXV2PolygonBase<"right isosceles triangle">
export type JIIXV2EquilateralTriangle = JIIXV2PolygonBase<"equilateral triangle">
export type JIIXV2Quadrilateral = JIIXV2PolygonBase<"quadrilateral">
export type JIIXV2Trapezoid = JIIXV2PolygonBase<"trapezoid">
export type JIIXV2Parallelogram = JIIXV2PolygonBase<"parallelogram">
export type JIIXV2Rhombus = JIIXV2PolygonBase<"rhombus">
export type JIIXV2Rectangle = JIIXV2PolygonBase<"rectangle">
export type JIIXV2Square = JIIXV2PolygonBase<"square">

export type JIIXV2Arrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
    primitives: JIIXV2Line[]
}

export type JIIXV2ShapeElement = JIIXV2Circle | JIIXV2Ellipse | JIIXV2Polygon | JIIXV2Triangle | JIIXV2IsoscelesTriangle | JIIXV2RightTriangle | JIIXV2RightIsoscelesTriangle | JIIXV2EquilateralTriangle | JIIXV2Quadrilateral | JIIXV2Trapezoid | JIIXV2Parallelogram | JIIXV2Rhombus | JIIXV2Rectangle | JIIXV2Square | JIIXV2Arrow

/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
export type JIIXV2RawContentBase<T = Omit<JIIXV2ElementType, "MATH">> = {
    type: T
    range?: JIIXV2Range
  }

  /**
   * @group Exports
   */
  export type JIIXV2RawContentItemText =  JIIXV2RawContentBase<"Text"> & JIIXV2Word

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
    lines: JIIXV2RawContentTextLine[]
  }

  /**
   * @group Exports
   */
  export type JIIXV2RawContentItemShape = JIIXV2RawContentBase<"Shape"> & {
      label: string
      lines: JIIXV2RawContentTextLine[]
  }

  export type JIIXV2RawContentElement = JIIXV2RawContentItemText | JIIXV2RawContentItemShape

/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
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
 * {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
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
