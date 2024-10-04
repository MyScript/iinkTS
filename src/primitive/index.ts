import { OIEdgeArc } from "./OIEdgeArc"
import { OIEdgeLine } from "./OIEdgeLine"
import { OIEdgePolyLine } from "./OIEdgePolyLine"
import { OIShapeCircle } from "./OIShapeCircle"
import { OIShapeEllipse } from "./OIShapeEllipse"
import { OIShapePolygon } from "./OIShapePolygon"
import { OIStroke } from "./OIStroke"
import { OISymbolGroup } from "./OISymbolGroup"
import { OIText } from "./OIText"
import { OIStrokeText } from "./OIStrokeText"

export * from "./Box"
export * from "./CanvasSymbol"
export * from "./OIDecorator"
export * from "./OIEdge"
export * from "./OIEdgeArc"
export * from "./OIEdgeLine"
export * from "./OIEdgePolyLine"
export * from "./OIShape"
export * from "./OIShapeEllipse"
export * from "./OIShapeCircle"
export * from "./OIShapePolygon"
export * from "./OIStroke"
export * from "./OIStrokeText"
export * from "./OISymbolGroup"
export * from "./OISymbolBase"
export * from "./OIText"
export * from "./OIEraser"
export * from "./Point"
export * from "./Stroke"
export * from "./Symbol"


/**
 * @group Primitive
 */
export type TOIEdge = OIEdgeArc | OIEdgeLine | OIEdgePolyLine

/**
 * @group Primitive
 */
export type TOIShape = OIShapeCircle | OIShapeEllipse | OIShapePolygon

/**
 * @group Primitive
 */
export type TOISymbol = TOIEdge | TOIShape | OIStroke | OISymbolGroup | OIText | OIStrokeText
