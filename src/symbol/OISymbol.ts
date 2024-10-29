import
{
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon
} from "./geometry"
import
{
  OIRecognizedText,
  OIRecognizedArc,
  OIRecognizedCircle,
  OIRecognizedEllipse,
  OIRecognizedLine,
  OIRecognizedPolyLine,
  OIRecognizedPolygon
} from "./recognized"
import { OIStroke } from "./OIStroke"
import { OISymbolGroup } from "./OISymbolGroup"
import { OIText } from "./OIText"

/**
 * @group Symbol
 */
export type TOIEdge = OIEdgeArc | OIEdgeLine | OIEdgePolyLine

/**
 * @group Symbol
 */
export type TOIShape = OIShapeCircle | OIShapeEllipse | OIShapePolygon

/**
 * @group Symbol
 */
export type TOIRecognized = OIRecognizedText | OIRecognizedArc | OIRecognizedCircle | OIRecognizedEllipse | OIRecognizedLine | OIRecognizedPolyLine | OIRecognizedPolygon

/**
 * @group Symbol
 */
export type TOISymbol = TOIEdge | TOIShape | OIStroke | OISymbolGroup | OIText | TOIRecognized
