import { EditorOffscreen } from "../editor"
import { LoggerManager, LoggerCategory } from "../logger"
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
  OIText,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TOISymbolChar,
  TPoint
} from "../symbol"
import { RecognizedKind } from "../symbol/recognized/OIRecognizedBase"
import { computeAngleAxeRadian, computeAverage, convertBoundingBoxMillimeterToPixel, convertMillimeterToPixel, createUUID } from "../utils"

/**
 * @group Manager
 */
export class OIConversionManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.CONVERTER)
  editor: EditorOffscreen

  constructor(editor: EditorOffscreen)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get configuration(): { size: number | "auto", weight: "bold" | "normal" | "auto" } {
    return this.editor.configuration.fontStyle
  }

  get model(): OIModel
  {
    return this.editor.model
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
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
    let fontWeight = this.configuration.weight
    if (fontWeight === "auto") {
      fontWeight = (strokes[0].style.width || 1) > 2 ? "bold" : "normal"
    }

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

  buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: OIStroke[], size: number | "auto"): OIText
  {
    const boundingBox = Box.createFromBoxes([convertBoundingBoxMillimeterToPixel(word["bounding-box"])])
    const charSymbols: TOISymbolChar[] = []
    const charFontSize = size === "auto" ? this.computeFontSize(chars) : size

    chars.forEach(char =>
    {
      const charStrokes = strokes.filter(s => char.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (charStrokes.length) {
        charSymbols.push(this.buildChar(char, charStrokes, charFontSize))
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
      if ((sym?.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) || sym?.type === SymbolType.Group) {
        const hightlight = sym.decorators.find(d => d.kind === DecoratorKind.Highlight)
        if (hightlight) decorators.push(hightlight)
        const strikethrough = sym.decorators.find(d => d.kind === DecoratorKind.Strikethrough)
        if (strikethrough) decorators.push(strikethrough)
        const surround = sym.decorators.find(d => d.kind === DecoratorKind.Surround)
        if (surround) decorators.push(surround)
        const underline = sym.decorators.find(d => d.kind === DecoratorKind.Underline)
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

  convertText(text: TJIIXTextElement, strokes: OIStroke[], onlyText: boolean): { symbol: OIText, strokes: OIStroke[] }[] | undefined
  {
    if (!text.lines) {
      throw new Error("You need to active configuration.recognition.export.jiix.text.lines = true")
    }
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


    let textFontSize = this.configuration.size
    if (onlyText && textFontSize === "auto") {
      textFontSize = Math.round(this.computeFontSize(jiixChars.filter(c => c.items?.length)) / 2) * 2
    }
    else if (this.configuration.size !== "auto") {
      textFontSize = this.configuration.size * this.rowHeight
    }

    let isNewLine = false
    let currentY = convertMillimeterToPixel(text.lines[0]["baseline-y"])
    const leftX = convertMillimeterToPixel(text["bounding-box"]?.x || 0)
    let currentX = convertMillimeterToPixel(jiixWords[0]["bounding-box"]?.x || 0)
    jiixWords.forEach(word =>
    {
      if (word.label === " ") {
        currentX += this.editor.texter.getSpaceWidth(result.at(-1)?.symbol.chars[0].fontSize|| (this.rowHeight / 2))
        return
      }
      const wordStrokes = strokes.filter(s => word.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (wordStrokes.length) {
        const chars = jiixChars.slice(word["first-char"] as number, (word["last-char"] || 0) + 1)
        const wordSymbol = this.buildText(word, chars, wordStrokes, textFontSize)

        if (onlyText) {
          if (isNewLine) {
            isNewLine = false
            const nbRow = Math.round((wordSymbol.point.y - currentY) / this.rowHeight) || 1
            currentY += nbRow * this.rowHeight
            if (Math.abs(wordSymbol.point.x - leftX) < this.rowHeight) {
              currentX = leftX
            }
            else {
              currentX = wordSymbol.point.x
            }
          }
          wordSymbol.point.x = currentX
          wordSymbol.point.y = this.model.roundToLineGuide(currentY)
        }

        this.editor.texter.setBounds(wordSymbol)
        currentX += wordSymbol.bounds.width
        result.push({
          symbol: wordSymbol,
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
    return new OIShapeEllipse(center, convertMillimeterToPixel(ellipse.rx), convertMillimeterToPixel(ellipse.ry), ellipse.orientation, strokes[0]?.style)
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

  convertNode(node: TJIIXNodeElement, strokes: OIStroke[]): { symbol: TOIShape, strokes: OIStroke[] } | undefined
  {
    const associatedStroke = strokes.filter(s => node.items?.some(i => i["full-id"] === s.id))
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

    if (Math.abs(angle % Math.PI) < 0.1) {
      // to adjust the line with the horizontal
      point1.y = +((point1.y + point2.y) / 2).toFixed(3)
      point2.y = point1.y
    }
    else if (Math.abs(angle % (Math.PI / 2)) < 0.1) {
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
      if (Math.abs(angle % Math.PI) < 0.1) {
        p1.y = +((p1.y + p2.y) / 2).toFixed(3)
        p2.y = p1.y
      }
      else if (Math.abs(angle % (Math.PI / 2)) < 0.1) {
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

  convertEdge(edge: TJIIXEdgeElement, strokes: OIStroke[]): { symbol: TOIEdge, strokes: OIStroke[] } | undefined
  {
    switch (edge.kind) {
      case JIIXEdgeKind.Line: {
        const associatedStroke = strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildLine(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.Arc: {
        const associatedStroke = strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
        if (!associatedStroke.length) return
        const uniqStrokes = associatedStroke.filter((a, i) => associatedStroke.findIndex((s) => a.id === s.id) === i)
        const oiEdge = this.buildArc(edge, uniqStrokes)
        return {
          symbol: oiEdge,
          strokes: uniqStrokes
        }
      }
      case JIIXEdgeKind.PolyEdge: {
        const associatedStroke = strokes.filter(s => edge.edges.flatMap(e => e.items)?.some(i => i!["full-id"] === s.id))
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

  async apply(symbols: TOISymbol[] = []): Promise<void>
  {
    this.#logger.info("convert")
    if (!this.model.exports?.["application/vnd.myscript.jiix"]) {
      await this.editor.export(["application/vnd.myscript.jiix"])
    }
    this.editor.selector.removeSelectedGroup()
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport
    if (jiix?.elements?.length) {
      const strokesToConvert = this.editor.extractStrokesFromSymbols(symbols.length ? symbols : this.model.symbols)

      const onlyText = !jiix.elements?.some(e => e.type !== "Text")
      const conversionResults: { symbol: TOISymbol, strokes: OIStroke[] }[] = []
      jiix.elements.forEach(el =>
      {
        switch (el.type) {
          case "Text": {
            const conversion = this.convertText(el, strokesToConvert, onlyText)
            if (conversion) {
              conversionResults.push(...conversion)
            }
            break
          }
          case "Node": {
            const conversion = this.convertNode(el, strokesToConvert)
            if (conversion) {
              conversionResults.push(conversion)
            }
            break
          }
          case "Edge": {
            const conversion = this.convertEdge(el, strokesToConvert)
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

      this.editor.addSymbols(conversionResults.map(cs => cs.symbol), false)
      this.editor.removeSymbols(conversionResults.flatMap(cs => cs.strokes.map(s => s.id)), false)
      this.editor.history.push(this.model, { added: conversionResults.map(c => c.symbol), erased: conversionResults.flatMap(cs => cs.strokes) })
    }
  }
}
