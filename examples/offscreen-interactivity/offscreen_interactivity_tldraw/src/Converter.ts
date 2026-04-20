import
{
  TLArrowShape,
  TLDrawShape,
  TLGeoShape,
  TLShapeId,
  TLShapePartial,
  TLTextShape,
  createShapeId,
  toRichText
} from "tldraw"
import
{
  TJIIXEdgeArc,
  TJIIXEdgeElement,
  TJIIXEdgeLine,
  TJIIXElement,
  TJIIXExport,
  TJIIXNodeCircle,
  TJIIXNodeElement,
  TJIIXNodeEllipse,
  TJIIXNodeRectangle,
  TJIIXNodeRhombus,
  TJIIXNodeTriangle,
  TJIIXTextElement,
  convertMillimeterToPixel
} from "iink-ts"
import { store } from "./store"

type geoType = "arrow-down" | "arrow-left" | "arrow-right" | "arrow-up" | "check-box" | "diamond" | "ellipse" | "hexagon" | "octagon" | "oval" | "pentagon" | "rectangle" | "rhombus-2" | "rhombus" | "star" | "trapezoid" | "triangle" | "x-box"
type arrowheadType = "none" | "diamond" | "triangle" | "arrow" | "bar" | "dot" | "inverted" | "pipe" | "square" | undefined

export class Converter
{
  static instance: Converter
  font: "draw" | "mono" | "sans" | "serif" = "draw"

  auto: boolean = false

  private jiixElementsCache: Map<string, TJIIXElement[]> = new Map()
  private lastJiixExportTime: number = 0

  get jiixExport(): TJIIXExport
  {
    const exports = store.getState().exports.value
    return exports["application/vnd.myscript.jiix"] as TJIIXExport
  }

  private buildJiixIndex(): void
  {
    const now = Date.now()
    if (now - this.lastJiixExportTime < 100 && this.jiixElementsCache.size > 0) {
      return
    }

    this.jiixElementsCache.clear()
    this.lastJiixExportTime = now

    if (!this.jiixExport?.elements) return

    for (const element of this.jiixExport.elements) {
      const shapeIds = new Set<string>()
      element.items?.forEach(i => {
        if (i["full-id"]) shapeIds.add(i["full-id"])
      })

      const textElement = element as TJIIXTextElement
      textElement.words?.forEach(w => {
        w.items?.forEach(i => {
          if (i["full-id"]) shapeIds.add(i["full-id"])
        })
      })

      textElement.chars?.forEach(c => {
        c.items?.forEach(i => {
          if (i["full-id"]) shapeIds.add(i["full-id"])
        })
      })

      shapeIds.forEach(shapeId => {
        if (!this.jiixElementsCache.has(shapeId)) {
          this.jiixElementsCache.set(shapeId, [])
        }
        this.jiixElementsCache.get(shapeId)!.push(element)
      })
    }
  }

  invalidateCache(): void
  {
    this.jiixElementsCache.clear()
    this.lastJiixExportTime = 0
  }

  protected findJiixElements(shape: TLDrawShape): TJIIXElement[]
  {
    this.buildJiixIndex()
    return this.jiixElementsCache.get(shape.id) || []
  }

  protected findDerivation(drawShapes: TLDrawShape[]): { dx: number, dy: number }
  {
    const points = drawShapes.flatMap(sh => sh.props.segments.flatMap(se => se.points.flatMap(p => p)))
    return {
      dx: Math.min(...points.map(p => p.x)),
      dy: Math.min(...points.map(p => p.y))
    }
  }

  protected createArrowShape(id: string, shapeOrigin: TLDrawShape, x: number, y: number, xEnd: number, yEnd: number, bend = 0, arrowheadStart: arrowheadType = "none", arrowheadEnd: arrowheadType = "none"): TLShapePartial<TLArrowShape>
  {
    return {
      typeName: "shape",
      type: "arrow",
      id: createShapeId(id),
      index: shapeOrigin.index,
      isLocked: shapeOrigin.isLocked,
      opacity: shapeOrigin.opacity,
      x,
      y,
      rotation: 0,
      props: {
        color: shapeOrigin.props.color,
        dash: shapeOrigin.props.dash,
        size: shapeOrigin.props.size,
        bend,
        start: {
          x: 0,
          y: 0
        },
        end: {
          x: xEnd,
          y: yEnd
        },
        arrowheadStart,
        arrowheadEnd,
      }
    }
  }

  protected convertEdge(edge: TJIIXEdgeElement, drawShapes: TLDrawShape[]): TLShapePartial<TLArrowShape> | undefined
  {
    const associatedShapes = drawShapes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
    if (!associatedShapes.length) return

    const firstShape = associatedShapes[0]
    const x = firstShape.x
    const y = firstShape.y
    let xEnd, yEnd, arrowheadStart: arrowheadType = "none", arrowheadEnd: arrowheadType = "none", bend = 0
    let flag = false

    switch (edge.kind) {
      case "line": {
        const line = edge as TJIIXEdgeLine
        xEnd = convertMillimeterToPixel(line.x2 - line.x1)
        yEnd = convertMillimeterToPixel(line.y2 - line.y1)
        if (line.p1Decoration) {
          arrowheadStart = "arrow"
        }
        if (line.p2Decoration) {
          arrowheadEnd = "arrow"
        }
        flag = true
        break
      }
      case "arc": {
        const arc = edge as TJIIXEdgeArc
        const cx = convertMillimeterToPixel(arc.cx)
        const cy = convertMillimeterToPixel(arc.cy)
        xEnd = (cx - x) * 2
        yEnd = (cy - y) * 2
        bend = convertMillimeterToPixel(arc.rx + arc.ry) / 2
        if (arc.sweepAngle > 0) {
          bend = -bend
        }
        if (arc.startDecoration) {
          arrowheadStart = "arrow"
        }
        if (arc.endDecoration) {
          arrowheadEnd = "arrow"
        }
        flag = true
        break
      }
      default:
        console.warn("convertEdge", `Conversion of Edge with kind equal to ${ edge.kind } is unknow`)
        break
    }

    if (flag) {
      return this.createArrowShape(edge.id, firstShape, x, y, xEnd!, yEnd!, bend!, arrowheadStart, arrowheadEnd)
    }
  }

  protected convertText(text: TJIIXTextElement, drawShapes: TLDrawShape[]): TLShapePartial<TLTextShape> | undefined
  {
    const associatedShapes = drawShapes.filter(s => text.words?.some(w => w.items?.some(i => i["full-id"] === s.id)) || text.chars?.some(c => c.items?.some(i => i["full-id"] === s.id)))
    if (!associatedShapes.length) return

    const firstShape = associatedShapes[0]
    const { dy } = this.findDerivation(associatedShapes)
    return {
      typeName: "shape",
      type: "text",
      id: createShapeId(text.id),
      index: firstShape.index,
      isLocked: firstShape.isLocked,
      opacity: firstShape.opacity,
      x: firstShape.x,
      y: firstShape.y + dy,
      rotation: 0,
      props: {
        color: firstShape.props.color,
        size: firstShape.props.size,
        richText: toRichText(text.label),
        font: this.font,
        textAlign: "start",
      },
    }
  }

  protected createGeoShapeFromNode(id: string, shapeOrigin: TLDrawShape, geo: geoType, x: number, y: number, w: number, h: number): TLShapePartial<TLGeoShape>
  {
    return {
      typeName: "shape",
      type: "geo",
      id: createShapeId(id),
      index: shapeOrigin.index,
      isLocked: shapeOrigin.isLocked,
      opacity: shapeOrigin.opacity,
      x,
      y,
      rotation: shapeOrigin.rotation,
      props: {
        color: shapeOrigin.props.color,
        dash: shapeOrigin.props.dash,
        size: shapeOrigin.props.size,
        fill: shapeOrigin.props.fill,
        geo,
        w,
        h
      }
    }
  }

  protected convertNode(node: TJIIXNodeElement, drawShapes: TLDrawShape[]): TLShapePartial<TLGeoShape> | undefined
  {
    const associatedShapes = drawShapes.filter(s => node.items?.some(i => i["full-id"] === s.id))
    if (!associatedShapes.length) return

    const { dx, dy } = this.findDerivation(associatedShapes)
    const firstShape = associatedShapes[0]
    const x = firstShape.x + dx
    const y = firstShape.y + dy

    let geo: geoType | undefined, w = 0, h = 0
    switch (node.kind) {
      case "circle": {
        const circle = node as TJIIXNodeCircle
        geo = "ellipse"
        w = convertMillimeterToPixel(circle.r) * 2
        h = convertMillimeterToPixel(circle.r) * 2
        break
      }
      case "ellipse": {
        const ellipse = node as TJIIXNodeEllipse
        geo = "ellipse"
        w = convertMillimeterToPixel(ellipse.rx) * 2
        h = convertMillimeterToPixel(ellipse.ry) * 2
        break
      }
      case "rectangle": {
        const rectangle = node as TJIIXNodeRectangle
        geo = "rectangle"
        w = convertMillimeterToPixel(rectangle.width)
        h = convertMillimeterToPixel(rectangle.height)
        break
      }
      case "triangle": {
        const triangle = node as TJIIXNodeTriangle
        geo = "triangle"
        w = convertMillimeterToPixel(triangle["bounding-box"]!.width)
        h = convertMillimeterToPixel(triangle["bounding-box"]!.height)
        break
      }
      case "rhombus": {
        const rhombus = node as TJIIXNodeRhombus
        geo = "diamond"
        w = convertMillimeterToPixel(rhombus["bounding-box"]!.width)
        h = convertMillimeterToPixel(rhombus["bounding-box"]!.height)
        break
      }
      // case "parallelogram":
      //   return this.buildParallelogramConversion(node as TJIIXNodeParrallelogram, associatedShapes)
      // case "polygon":
      //   return this.buildPolygonConversion(node as TJIIXNodePolygon, associatedShapes)
      default:
        console.warn("convertNode", `Conversion of Node with kind equal to ${ node.kind } is unknow`)
    }

    if (geo) {
      return this.createGeoShapeFromNode(node.id, firstShape, geo, x, y, w, h)
    }
  }

  convert(drawShapes: TLDrawShape[]): { toConvert: TLShapePartial<(TLArrowShape | TLTextShape | TLGeoShape)>[], toRemove: TLShapeId[] }
  {
    const toConvert: TLShapePartial<(TLArrowShape | TLTextShape | TLGeoShape)>[] = []
    const toRemove = new Set<TLShapeId>()
    const processed = new Set<string>()

    this.buildJiixIndex()

    for (const ds of drawShapes) {
      if (toRemove.has(ds.id)) continue

      const jiixElts = this.findJiixElements(ds)

      for (const e of jiixElts) {
        if (processed.has(e.id)) continue
        processed.add(e.id)

        let shapeConverted: TLShapePartial<TLArrowShape | TLTextShape | TLGeoShape> | undefined

        try {
          switch (e.type) {
            case "Node":
              shapeConverted = this.convertNode(e as TJIIXNodeElement, drawShapes)
              break
            case "Text":
              shapeConverted = this.convertText(e as TJIIXTextElement, drawShapes)
              break
            case "Edge":
              shapeConverted = this.convertEdge(e as TJIIXEdgeElement, drawShapes)
              break
            default:
              console.warn("convert", `Unknown jiix element type: ${ (e as TJIIXElement).type }`)
          }
        } catch (error) {
          console.error("Conversion error:", error)
        }

        if (shapeConverted) {
          toConvert.push(shapeConverted)
          e.items?.forEach(i => {
            if (i["full-id"]) toRemove.add(i["full-id"] as TLShapeId)
          })
          const textElement = e as TJIIXTextElement
          textElement.words?.forEach(w => {
            w.items?.forEach(i => {
              if (i["full-id"]) toRemove.add(i["full-id"] as TLShapeId)
            })
          })
          textElement.chars?.forEach(c => {
            c.items?.forEach(i => {
              if (i["full-id"]) toRemove.add(i["full-id"] as TLShapeId)
            })
          })
        }
      }
    }

    return {
      toConvert,
      toRemove: Array.from(toRemove),
    }
  }
}

export const useConverter = (): Converter =>
{
  if (!Converter.instance) {
    Converter.instance = new Converter()
  }
  return Converter.instance
}
