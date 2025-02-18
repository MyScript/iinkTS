import
{
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon
} from "./geometry"
import
{
  IIRecognizedText,
  IIRecognizedArc,
  IIRecognizedCircle,
  IIRecognizedEllipse,
  IIRecognizedLine,
  IIRecognizedPolyLine,
  IIRecognizedPolygon
} from "./recognized"
import { IIStroke } from "./IIStroke"
import { IISymbolGroup } from "./IISymbolGroup"
import { IIText } from "./IIText"

/**
 * @group Symbol
 */
export type TIIEdge = IIEdgeArc | IIEdgeLine | IIEdgePolyLine

/**
 * @group Symbol
 */
export type TIIShape = IIShapeCircle | IIShapeEllipse | IIShapePolygon

/**
 * @group Symbol
 */
export type TIIRecognized = IIRecognizedText | IIRecognizedArc | IIRecognizedCircle | IIRecognizedEllipse | IIRecognizedLine | IIRecognizedPolyLine | IIRecognizedPolygon

/**
 * @group Symbol
 */
export type TIISymbol = TIIEdge | TIIShape | IIStroke | IISymbolGroup | IIText | TIIRecognized
