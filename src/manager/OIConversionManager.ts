import { OIBehaviors } from "../behaviors"
import { LoggerManager, LoggerClass } from "../logger"
import
{
  OIModel,
  TJIIXChar,
  TJIIXEdgeArc,
  TJIIXEdgeElement,
  JIIXEdgeKind,
  TJIIXEdgeLine,
  TJIIXEdgePolyEdge,
  TJIIXExport,
  TJIIXNodeCircle,
  TJIIXNodeElement,
  TJIIXNodeEllipse,
  JIIXNodeKind,
  TJIIXNodeParrallelogram,
  TJIIXNodePolygon,
  TJIIXNodeRectangle,
  TJIIXNodeRhombus,
  TJIIXNodeTriangle,
  TJIIXTextElement,
  TJIIXWord
} from "../model"
import
{
  Box,
  DecoratorKind,
  OIDecorator,
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon,
  OIStroke,
  OISymbolGroup,
  OIText,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TOISymbolChar,
  TPoint
} from "../primitive"
import { computeAngleAxeRadian, computeAverage, convertBoundingBoxMillimeterToPixel, convertMillimeterToPixel, createUUID } from "../utils"

/**
 * @group Manager
 */
export class OIConversionManager
{
  #logger = LoggerManager.getLogger(LoggerClass.CONVERTER)
  behaviors: OIBehaviors
  fontSize?: number

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get rowHeight(): number
  {
    return this.behaviors.configuration.rendering.guides.gap
  }

  get strokes(): OIStroke[]
  {
    const symbols = (this.model.symbolsSelected.length ? this.model.symbolsSelected : this.model.symbols)
    return this.behaviors.extractStrokesFromSymbols(symbols)
  }

  protected computeFontSize(chars: TJIIXChar[]): number
  {
    if (chars.some(c => c["bounding-box"])) {
      const height = convertMillimeterToPixel(computeAverage(chars.map(c => c["bounding-box"]?.height || 1)))
      return Math.round(Math.round(height * this.rowHeight) / this.rowHeight / 2) * 2
    }
    return Math.round(this.rowHeight / 2)
  }

  buildChar(char: TJIIXChar, strokes: OIStroke[], fontSize: number): TOISymbolChar
  {
    const points = char.grid.map(p => ({
      x: convertMillimeterToPixel(p.x),
      y: convertMillimeterToPixel(p.y),
    }))
    const fontWeight = Math.min(1000, Math.max(100, Math.round(strokes[0].style.width || 1) * 100))

    const color = strokes[0].style.color || "black"
    return {
      id: `text-char-${ createUUID() }`,
      label: char.label,
      color,
      fontSize,
      fontWeight,
      bounds: Box.createFromPoints(points)
    }
  }

  buildWord(word: TJIIXWord, chars: TJIIXChar[], strokes: OIStroke[], fontSize?: number): OIText
  {
    const boundingBox = Box.createFromBoxes([convertBoundingBoxMillimeterToPixel(word["bounding-box"])])
    const charSymbols: TOISymbolChar[] = []
    fontSize = fontSize || this.computeFontSize(chars)

    chars.forEach(char =>
    {
      const charStrokes = strokes.filter(s => char.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (charStrokes.length) {
        charSymbols.push(this.buildChar(char, charStrokes, fontSize!))
      }
    })
    const point: TPoint = {
      x: boundingBox.xMin,
      y: boundingBox.yMax
    }
    const text = new OIText(charSymbols, point, boundingBox, strokes[0].style)
    const decorators = strokes.flatMap(s => s.decorators)
    strokes.forEach(s =>
    {
      const sym = this.model.getRootSymbol(s.id)
      if (sym?.type === SymbolType.Group) {
        const g = sym as OISymbolGroup
        const hightlight = g.decorators.find(d => d.kind === DecoratorKind.Highlight)
        if (hightlight) decorators.push(hightlight)
        const strikethrough = g.decorators.find(d => d.kind === DecoratorKind.Strikethrough)
        if (strikethrough) decorators.push(strikethrough)
        const surround = g.decorators.find(d => d.kind === DecoratorKind.Surround)
        if (surround) decorators.push(surround)
        const underline = g.decorators.find(d => d.kind === DecoratorKind.Underline)
        if (underline) decorators.push(underline)
      }
    })
    if (decorators.length) {
      const hightlight = decorators.find(d => d.kind === DecoratorKind.Highlight)
      if (hightlight) {
        text.decorators.push(new OIDecorator(DecoratorKind.Highlight, hightlight.style))
      }
      const strikethrough = decorators.find(d => d.kind === DecoratorKind.Strikethrough)
      if (strikethrough) {
        text.decorators.push(new OIDecorator(DecoratorKind.Strikethrough, strikethrough.style))
      }
      const surround = decorators.find(d => d.kind === DecoratorKind.Surround)
      if (surround) {
        text.decorators.push(new OIDecorator(DecoratorKind.Surround, surround.style))
      }
      const underline = decorators.find(d => d.kind === DecoratorKind.Underline)
      if (underline) {
        text.decorators.push(new OIDecorator(DecoratorKind.Underline, underline.style))
      }
    }

    return text
  }

  convertText(text: TJIIXTextElement, onlyText: boolean): { symbol: OIText, strokes: OIStroke[] }[] | undefined
  {
    if (!text.words) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.words = true")
    }
    if (!text.chars) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.chars = true")
    }
    if (!text.chars.some(c => c.items)) {
      throw new Error("You need to active configuration.recognition.export.jiix.strokes = true")
    }

    const jiixWords = text.words as TJIIXWord[]
    const jiixChars = text.chars as TJIIXChar[]

    const result: { symbol: OIText, strokes: OIStroke[] }[] = []

    const textBounds = convertBoundingBoxMillimeterToPixel(text["bounding-box"])
    let fontSize = this.fontSize
    if (onlyText && !fontSize) {
      fontSize = Math.round(this.computeFontSize(jiixChars.filter(c => c.items?.length)) / 2) * 2
    }

    let isNewLine = true
    let currentY = textBounds.y
    jiixWords.forEach(word =>
    {
      const wordStrokes = this.strokes.filter(s => word.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (wordStrokes.length) {
        const chars = jiixChars.slice(word["first-char"] as number, (word["last-char"] || 0) + 1)
        const textSymbol = this.buildWord(word, chars, wordStrokes, fontSize)

        if (onlyText) {
          if (isNewLine) {
            isNewLine = false
            const nbRow = Math.round((textSymbol.point.y - currentY) / this.rowHeight) || 1
            currentY += nbRow * this.rowHeight
            if (Math.abs(textSymbol.point.x - textBounds.x) < this.behaviors.texter.getSpaceWidth(fontSize!) * 2) {
              textSymbol.point.x = textBounds.x
            }
          }
          textSymbol.point.y = this.model.roundToLineGuide(currentY)
         }

        this.behaviors.texter.setBounds(textSymbol)
        result.push({
          symbol: textSymbol,
          strokes: wordStrokes
        })
      }
      isNewLine = word.label === "\n"
    })

    return result
  }

  buildCircle(circle: TJIIXNodeCircle, strokes: OIStroke[]): OIShapeCircle
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(circle.cx),
      y: convertMillimeterToPixel(circle.cy)
    }
    return new OIShapeCircle(center, convertMillimeterToPixel(circle.r), strokes[0]?.style)
  }

  buildEllipse(ellipse: TJIIXNodeEllipse, strokes: OIStroke[]): OIShapeEllipse
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(ellipse.cx),
      y: convertMillimeterToPixel(ellipse.cy),
    }
    return new OIShapeEllipse(center, convertMillimeterToPixel(ellipse.rx), convertMillimeterToPixel(ellipse.ry), strokes[0]?.style,)
  }

  buildRectangle(rectangle: TJIIXNodeRectangle, strokes: OIStroke[]): OIShapePolygon
  {
    const height = convertMillimeterToPixel(rectangle.height)
    const width = convertMillimeterToPixel(rectangle.width)
    const x = convertMillimeterToPixel(rectangle.x)
    const y = convertMillimeterToPixel(rectangle.y)
    const points: TPoint[] = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
    return new OIShapePolygon(points, strokes[0]?.style)
  }

  buildPolygon(polygon: TJIIXNodePolygon, strokes: OIStroke[]): OIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: convertMillimeterToPixel(polygon.points[i]),
        y: convertMillimeterToPixel(polygon.points[i + 1])
      })
    }

    return new OIShapePolygon(points, strokes[0]?.style)
  }

  buildRhombus(polygon: TJIIXNodeRhombus, strokes: OIStroke[]): OIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: convertMillimeterToPixel(polygon.points[i]),
        y: convertMillimeterToPixel(polygon.points[i + 1])
      })
    }

    return new OIShapePolygon(points, strokes[0]?.style)
  }

  buildTriangle(polygon: TJIIXNodeTriangle, strokes: OIStroke[]): OIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: convertMillimeterToPixel(polygon.points[i]),
        y: convertMillimeterToPixel(polygon.points[i + 1])
      })
    }

    return new OIShapePolygon(points, strokes[0]?.style)
  }

  buildParallelogram(polygon: TJIIXNodeParrallelogram, strokes: OIStroke[]): OIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: convertMillimeterToPixel(polygon.points[i]),
        y: convertMillimeterToPixel(polygon.points[i + 1])
      })
    }

    return new OIShapePolygon(points, strokes[0]?.style)
  }

  convertNode(node: TJIIXNodeElement): { symbol: TOIShape, strokes: OIStroke[] } | undefined
  {
    const associatedStroke = this.strokes.filter(s => node.items?.some(i => i["full-id"] === s.id))
    if (!associatedStroke.length) return

    const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)

    let shape: TOIShape
    switch (node.kind) {
      case JIIXNodeKind.Circle:
        shape = this.buildCircle(node, uniqStrokes)
        break
      case JIIXNodeKind.Ellipse:
        shape = this.buildEllipse(node, uniqStrokes)
        break
      case JIIXNodeKind.Rectangle:
        shape = this.buildRectangle(node, uniqStrokes)
        break
      case JIIXNodeKind.Triangle:
        shape = this.buildTriangle(node, uniqStrokes)
        break
      case JIIXNodeKind.Parallelogram:
        shape = this.buildParallelogram(node, uniqStrokes)
        break
      case JIIXNodeKind.Polygon:
        shape = this.buildPolygon(node, uniqStrokes)
        break
      case JIIXNodeKind.Rhombus:
        shape = this.buildRhombus(node, uniqStrokes)
        break
      default:
        this.#logger.warn("convertNode", `Conversion of Node with kind equal to ${ JSON.stringify(node) } is unknow`)
        return
    }
    return { symbol: shape, strokes: uniqStrokes }
  }

  buildLine(line: TJIIXEdgeLine, strokes: OIStroke[]): OIEdgeLine
  {
    const point1: TPoint = { x: convertMillimeterToPixel(line.x1), y: convertMillimeterToPixel(line.y1) }
    const point2: TPoint = { x: convertMillimeterToPixel(line.x2), y: convertMillimeterToPixel(line.y2) }
    const angle = computeAngleAxeRadian(point1, point2)

    if (Math.abs(angle) < 0.1) {
      // to adjust the line with the horizontal
      point1.y = +((point1.y + point2.y) / 2).toFixed(3)
      point2.y = point1.y
    }
    else if (Math.abs(angle - Math.PI / 2) - 1 < 0.1) {
      // to adjust the line with the vertical
      point1.x = +((point1.x + point2.x) / 2).toFixed(3)
      point2.x = point1.x
    }
    return new OIEdgeLine(point1, point2, line.p1Decoration, line.p2Decoration, strokes[0]?.style)
  }

  buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: OIStroke[]): OIEdgePolyLine
  {
    const start: TPoint = { x: convertMillimeterToPixel(polyline.edges[0].x1), y: convertMillimeterToPixel(polyline.edges[0].y1) }
    const points = polyline.edges.map(e => ({ x: convertMillimeterToPixel(e.x2), y: convertMillimeterToPixel(e.y2) }))
    points.unshift(start)
    for (let index = 0; index < points.length - 1; index++) {
      const p1 = points[index]
      const p2 = points[index + 1]
      const angle = computeAngleAxeRadian(p1, p2)
      if (Math.abs(angle) < 0.1) {
        p1.y = +((p1.y + p2.y) / 2).toFixed(3)
        p2.y = p1.y
      }
      else if (Math.abs(angle - Math.PI / 2) < 0.1) {
        p1.x = +((p1.x + p2.x) / 2).toFixed(3)
        p2.x = p1.x
      }
    }

    return new OIEdgePolyLine(points, polyline.edges[0].p1Decoration, polyline.edges.at(-1)!.p2Decoration, strokes[0]?.style)
  }

  buildArc(arc: TJIIXEdgeArc, strokes: OIStroke[]): OIEdgeArc
  {
    const center: TPoint = { x: convertMillimeterToPixel(arc.cx), y: convertMillimeterToPixel(arc.cy) }
    const radiusX = convertMillimeterToPixel(arc.rx)
    const radiusY = convertMillimeterToPixel(arc.ry)
    return new OIEdgeArc(center, arc.startAngle, arc.sweepAngle, radiusX, radiusY, arc.phi, arc.startDecoration, arc.endDecoration, strokes[0]?.style)
  }

  convertEdge(edge: TJIIXEdgeElement): { symbol: TOIEdge, strokes: OIStroke[] } | undefined
  {
    switch (edge.kind) {
      case JIIXEdgeKind.Line: {
        const associatedStroke = this.strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildLine(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.Arc: {
        const associatedStroke = this.strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildArc(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.PolyEdge: {
        const associatedStroke = this.strokes.filter(s => edge.edges.flatMap(e => e.items)?.some(i => i!["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildPolyEdge(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      default:
        this.#logger.error("convertEdge", `Conversion of Edge with kind equal to ${ JSON.stringify(edge) } is unknow`)
        return
    }
  }

  async apply(): Promise<void>
  {
    this.#logger.info("convert")
    if (!this.model.exports?.["application/vnd.myscript.jiix"]) {
      await this.behaviors.export(["application/vnd.myscript.jiix"])
    }
    this.behaviors.selector.removeSelectedGroup()
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport
    if (jiix?.elements?.length) {
      const onlyText = !jiix.elements?.some(e => e.type !== "Text")
      const conversionResults: { symbol: TOISymbol, strokes: OIStroke[] }[] = []
      jiix.elements.forEach(el =>
      {
        switch (el.type) {
          case "Text": {
            const conversion = this.convertText(el, onlyText)
            if (conversion) {
              conversionResults.push(...conversion)
            }
            break
          }
          case "Node": {
            const conversion = this.convertNode(el)
            if (conversion) {
              conversionResults.push(conversion)
            }
            break
          }
          case "Edge": {
            const conversion = this.convertEdge(el)
            if (conversion) {
              conversionResults.push(conversion)
            }
            break
          }
          default: {
            this.#logger.warn("buildConversions", `Unknow jiix element type: ${ el.type }`)
          }
        }
      })

      this.behaviors.addSymbols(conversionResults.map(cs => cs.symbol), false)
      this.behaviors.removeSymbols(conversionResults.flatMap(cs => cs.strokes.map(s => s.id)), false)
      this.behaviors.texter.adjustText()

      this.behaviors.history.push(this.model, { added: conversionResults.map(c => c.symbol), erased: conversionResults.flatMap(cs => cs.strokes) })
    }
  }
}
