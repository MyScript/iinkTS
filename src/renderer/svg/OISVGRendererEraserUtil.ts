import { OIEraser, TPointer } from "../../primitive"

/**
 * @group Renderer
 */
export class OISVGRendererEraserUtil
{
  static getSVGPath(eraser: OIEraser): string
  {
    if (eraser.pointers.length < 1) return ""

    const firstPoint = eraser.pointers.at(0) as TPointer

    if (eraser.pointers.length === 1) {
      const strokeWith = eraser.style.width || 4
      return `C ${ firstPoint.x - strokeWith / 2 } ${ firstPoint.y } Q ${ firstPoint.x  + strokeWith / 2 } ${ firstPoint.y }`
    }

    const middlePoints = eraser.pointers.slice(1)

    const startPathMoveTo = `M ${ firstPoint.x } ${ firstPoint.y }`


    const middlePathQuadratic = middlePoints.reduce((acc, point) => {
      return `${ acc } ${ point.x } ${ point.y }`
    }, "Q")

    return `${ startPathMoveTo } ${ middlePathQuadratic }`
  }

}
