import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel, TJIIXChar, TJIIXEdgeArc, TJIIXEdgeElement, TJIIXEdgeLine, TJIIXExport, TJIIXNodeCircle, TJIIXNodeElement, TJIIXNodeEllipse, TJIIXNodePolygon, TJIIXNodeRectangle, TJIIXTextElement, TJIIXWord } from "../model"
import { Box, EdgeKind, OIEdgeArc, OIEdgeLine, OIShapeCircle, OIShapeEllipse, OIShapePolygon, OIStroke, OIText, SymbolType, TOIEdge, TOIShape, TOISymbolChar, TPoint } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { UndoRedoManager } from "../undo-redo"
import { computeAngleAxeRadian, computeAverage, convertBoundingBoxMillimeterToPixel, convertMillimeterToPixel, createUUID, rotatePoint } from "../utils"
import { OISelectionManager } from "./OISelectionManager"

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

  get undoRedoManager(): UndoRedoManager
  {
    return this.behaviors.undoRedoManager
  }

  get selector(): OISelectionManager
  {
    return this.behaviors.selector
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  get rowHeight(): number
  {
    return this.behaviors.configuration.rendering.guides.gap
  }

  get strokes(): OIStroke[]
  {
    return this.model.symbolsSelected.length ?
      this.model.symbolsSelected.filter(s => s.type === SymbolType.Stroke) as OIStroke[] :
      this.model.symbols.filter(s => s.type === SymbolType.Stroke) as OIStroke[]
  }

  buildChar(char: TJIIXChar, strokes: OIStroke[]): TOISymbolChar
  {
    const grid = char.grid.map(p => ({
      x: convertMillimeterToPixel(p.x),
      y: convertMillimeterToPixel(p.y),
    }))
    const boundingBox = Box.createFromPoints(grid)
    const fontSize = this.fontSize || Math.ceil(Math.round((boundingBox.yMax - boundingBox.yMin) / 2) / 8) * 8
    const fontWeight = Math.min(1000, Math.max(100, Math.round(strokes[0].style.width || 1) * 100))

    const color = strokes[0].style.color || "black"
    return {
      id: `text-char-${ createUUID() }`,
      label: char.label,
      color,
      fontSize,
      fontWeight,
      boundingBox
    }
  }

  buildWord(word: TJIIXWord, chars: TJIIXChar[], strokes: OIStroke[]): OIText
  {
    const boundingBox = Box.createFromBoxes([convertBoundingBoxMillimeterToPixel(word["bounding-box"])])
    const charSymbols: TOISymbolChar[] = []
    chars.forEach(char =>
    {
      const charStrokes = strokes.filter(s => char.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (charStrokes.length) {
        charSymbols.push(this.buildChar(char, charStrokes))
      }
    })
    return new OIText({}, charSymbols, { x: boundingBox.xMin, y: boundingBox.yMax }, boundingBox)
  }

  getSpaceWidth(fontSize: number): number
  {
    const boundingBox = new Box({ height: 0, width: 0, x: 0, y: 0 })
    const charSymbol: TOISymbolChar = {
      id: `text-char-space`,
      label: "_",
      color: "",
      fontSize,
      fontWeight: 0,
      boundingBox
    }
    return this.renderer.getSymbolBounds(new OIText({}, [charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  async convertText(text: TJIIXTextElement, alignTextToGuide: boolean): Promise<void>
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

    const strokesIdsToRemove: string[] = []
    const decoratorIdsToRemove: string[] = []

    jiixWords.forEach(word =>
    {
      const wordStrokes = this.strokes.filter(s => word.items?.some(i => i["full-id"] === s.id)) as OIStroke[]
      if (wordStrokes.length) {
        decoratorIdsToRemove.push(...wordStrokes.flatMap(s => s.decorators.map(d => d.id)) as string[])
        strokesIdsToRemove.push(...wordStrokes.map(s => s.id))
        const chars = jiixChars.slice(word["first-char"] as number, (word["last-char"] || 0) + 1)
        const textSymbol = this.buildWord(word, chars, wordStrokes)
        if (alignTextToGuide) {
          textSymbol.point.y = Math.trunc(textSymbol.point.y / this.rowHeight) * this.rowHeight
        }

        const textGroupEl = this.renderer.drawSymbol(textSymbol) as SVGGElement
        const box = Box.createFromBoxes([this.renderer.getElementBounds(textGroupEl)])
        const textEl = textGroupEl.querySelector("text")
        textSymbol.boundingBox = box
        if (textEl) {
          for (let i = 0; i < textEl.getNumberOfChars(); i++) {
            const char = textSymbol.chars.at(i)
            if (char) {
              const ext = textEl.getExtentOfChar(i)
              char.boundingBox = new Box(ext)
            }
          }
        }
        this.model.addSymbol(textSymbol)
      }
    })

    const uniqIdsToRemove = [...new Set(strokesIdsToRemove)]
    decoratorIdsToRemove.forEach(id =>
    {
      this.renderer.removeSymbol(id)
      this.model.removeSymbol(id)
    })
    uniqIdsToRemove.forEach(id =>
    {
      this.renderer.removeSymbol(id)
      this.model.removeSymbol(id)
    })

    await this.recognizer.eraseStrokes(uniqIdsToRemove)
  }

  buildCircle(circle: TJIIXNodeCircle, strokes: OIStroke[]): OIShapeCircle
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(circle.cx),
      y: convertMillimeterToPixel(circle.cy)
    }
    return new OIShapeCircle(strokes[0]?.style, center, convertMillimeterToPixel(circle.r))
  }

  buildEllipse(ellipse: TJIIXNodeEllipse, strokes: OIStroke[]): OIShapeEllipse
  {
    const center: TPoint = {
      x: convertMillimeterToPixel(ellipse.cx),
      y: convertMillimeterToPixel(ellipse.cy),
    }
    return new OIShapeEllipse(strokes[0]?.style, center, convertMillimeterToPixel(ellipse.rx), convertMillimeterToPixel(ellipse.ry))
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
    return new OIShapePolygon(strokes[0]?.style, points, rectangle.kind)
  }

  buildPolygon(polygon: TJIIXNodePolygon, strokes: OIStroke[]): OIShapePolygon
  {
    const points: TPoint[] = []
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push({
        x: polygon.points[i],
        y: polygon.points[i + 1]
      })
    }
    return new OIShapePolygon(strokes[0]?.style, points, polygon.kind)
  }

  async convertNode(node: TJIIXNodeElement): Promise<void>
  {
    const associatedStroke = this.strokes.filter(s => node.items?.some(i => i["full-id"] === s.id))
    if (!associatedStroke.length) return

    let shape: TOIShape
    switch (node.kind) {
      case "circle":
        shape = this.buildCircle(node as TJIIXNodeCircle, associatedStroke)
        break
      case "ellipse":
        shape = this.buildEllipse(node as TJIIXNodeEllipse, associatedStroke)
        break
      case "rectangle":
        shape = this.buildRectangle(node as TJIIXNodeRectangle, associatedStroke)
        break
      case "triangle":
      case "parallelogram":
      case "rhombus":
      case "polygon":
        shape = this.buildPolygon(node as TJIIXNodePolygon, associatedStroke)
        break
      default:
        this.#logger.warn("convertNode", `Conversion of Node with kind equal to ${ node.kind } is unknow`)
        return
    }
    if (shape) {
      this.model.addSymbol(shape)
      this.renderer.drawSymbol(shape)
      const uniqIdsToRemove = [...new Set(associatedStroke.map(s => s.id))]
      uniqIdsToRemove.forEach(id =>
      {
        this.renderer.removeSymbol(id)
        this.model.removeSymbol(id)
      })
      await this.recognizer.eraseStrokes(uniqIdsToRemove)
    }
  }

  buildLine(line: TJIIXEdgeLine, strokes: OIStroke[]): OIEdgeLine
  {
    const point1: TPoint = { x: convertMillimeterToPixel(line.x1), y: convertMillimeterToPixel(line.y1) }
    const point2: TPoint = { x: convertMillimeterToPixel(line.x2), y: convertMillimeterToPixel(line.y2) }
    const angle = computeAngleAxeRadian(point1, point2)
    if (Math.abs(angle) < 0.1) {
      point1.y = computeAverage([point1.y, point2.y])
      point2.y = computeAverage([point1.y, point2.y])
    }
    else if (Math.abs(angle) - Math.PI / 2 < 0.1) {
      point1.x = computeAverage([point1.x, point2.x])
      point2.x = computeAverage([point1.x, point2.x])
    }
    return new OIEdgeLine(strokes[0]?.style, point1, point2, line.p1Decoration, line.p2Decoration)
  }

  buildArc(arc: TJIIXEdgeArc, strokes: OIStroke[]): OIEdgeArc
  {
    const center: TPoint = { x: convertMillimeterToPixel(arc.cx), y: convertMillimeterToPixel(arc.cy) }
    const radius = convertMillimeterToPixel(arc.rx + arc.ry) / 2

    const point: TPoint = { x: center.x + radius, y: center.y }
    const start: TPoint = rotatePoint(point, center, arc.startAngle)
    const middle: TPoint = rotatePoint(point, center, -(arc.startAngle + arc.sweepAngle / 2))
    const end: TPoint = rotatePoint(point, center, -(arc.startAngle + arc.sweepAngle))

    return new OIEdgeArc(strokes[0]?.style, start, middle, end, arc.startDecoration, arc.endDecoration)
  }

  async convertEdge(edge: TJIIXEdgeElement): Promise<void>
  {
    const associatedStroke = this.strokes.filter(s => edge.items?.some(i => i["full-id"] === s.id))
    if (!associatedStroke.length) return

    let oiedge: TOIEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        oiedge = this.buildLine(edge as TJIIXEdgeLine, associatedStroke)
        break
      case EdgeKind.Arc:
        oiedge = this.buildArc(edge as TJIIXEdgeArc, associatedStroke)
        break
      default:
        this.#logger.warn("convertEdge", `Conversion of Edge with kind equal to ${ edge.kind } is unknow`)
        return
    }

    if (oiedge) {
      this.model.addSymbol(oiedge)
      this.renderer.drawSymbol(oiedge)
      const uniqIdsToRemove = [...new Set(associatedStroke.map(s => s.id))]
      uniqIdsToRemove.forEach(id =>
      {
        this.renderer.removeSymbol(id)
        this.model.removeSymbol(id)
      })
      await this.recognizer.eraseStrokes(uniqIdsToRemove)
    }
  }

  async convert(): Promise<void>
  {
    this.#logger.info("convert")
    if (!this.model.exports?.["application/vnd.myscript.jiix"]) {
      await this.behaviors.export(["application/vnd.myscript.jiix"])
    }
    this.selector.removeSelectedGroup()
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport
    if (jiix?.elements?.length) {
      const alignTextToGuide = !jiix.elements?.some(e => e.type !== "Text")
      await Promise.all(jiix.elements.map(e =>
      {
        switch (e.type) {
          case "Text":
            return this.convertText(e as TJIIXTextElement, alignTextToGuide)
          case "Node":
            return this.convertNode(e as TJIIXNodeElement)
          case "Edge":
            return this.convertEdge(e as TJIIXEdgeElement)
          default: {
            this.#logger.warn("buildConversions", `Unknow jiix element type: ${ e.type }`)
            return Promise.resolve()
          }
        }
      }))
    }
    this.behaviors.textManager.adjustText()
    this.undoRedoManager.addModelToStack(this.model)
  }
}
