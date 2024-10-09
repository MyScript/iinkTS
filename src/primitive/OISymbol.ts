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
