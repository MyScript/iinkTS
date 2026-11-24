import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform"
import type { ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types"
import
{
  JIIXEdgeKind,
  JIIXElementType,
  JIIXNodeKind,
  TJIIXEdgeElement,
  TJIIXElement,
  TJIIXExport,
  TJIIXNodeElement,
  TJIIXTextElement,
  convertMillimeterToPixel as mmToPx
} from "iink-ts"

/**
 * Excalidraw draws a text line 1.25 times its font size high
 */
const LINE_HEIGHT = 1.25

export type TConversion = {
  skeletons: ExcalidrawElementSkeleton[]
  convertedStrokeIds: Set<string>
}

/**
 * Every stroke id a JIIX element was recognized from, text words and chars included
 */
export const strokeIdsOf = (element: TJIIXElement): string[] =>
{
  const items = [...(element.items ?? [])]
  if (element.type === JIIXElementType.Text) {
    element.words?.forEach(w => items.push(...(w.items ?? [])))
    element.chars?.forEach(c => items.push(...(c.items ?? [])))
  }
  return items.flatMap(i => i["full-id"] ? [i["full-id"]] : [])
}

const styleOf = (stroke: ExcalidrawFreeDrawElement) => ({
  strokeColor: stroke.strokeColor,
  strokeWidth: stroke.strokeWidth,
  opacity: stroke.opacity,
})

const convertText = (text: TJIIXTextElement, stroke: ExcalidrawFreeDrawElement): ExcalidrawElementSkeleton | undefined =>
{
  const box = text["bounding-box"]
  if (!box) return
  const lineCount = text.label.split("\n").length
  return {
    type: "text",
    text: text.label,
    x: mmToPx(box.x),
    y: mmToPx(box.y),
    fontSize: mmToPx(box.height) / lineCount / LINE_HEIGHT,
    strokeColor: stroke.strokeColor,
    opacity: stroke.opacity,
  }
}

const convertNode = (node: TJIIXNodeElement, stroke: ExcalidrawFreeDrawElement): ExcalidrawElementSkeleton | undefined =>
{
  switch (node.kind) {
    case JIIXNodeKind.Rectangle:
      return { type: "rectangle", x: mmToPx(node.x), y: mmToPx(node.y), width: mmToPx(node.width), height: mmToPx(node.height), ...styleOf(stroke) }
    case JIIXNodeKind.Circle:
      return { type: "ellipse", x: mmToPx(node.cx - node.r), y: mmToPx(node.cy - node.r), width: mmToPx(node.r * 2), height: mmToPx(node.r * 2), ...styleOf(stroke) }
    case JIIXNodeKind.Ellipse:
      return { type: "ellipse", x: mmToPx(node.cx - node.rx), y: mmToPx(node.cy - node.ry), width: mmToPx(node.rx * 2), height: mmToPx(node.ry * 2), ...styleOf(stroke) }
    case JIIXNodeKind.Rhombus: {
      const box = node["bounding-box"]
      if (!box) return
      return { type: "diamond", x: mmToPx(box.x), y: mmToPx(box.y), width: mmToPx(box.width), height: mmToPx(box.height), ...styleOf(stroke) }
    }
    default:
      console.warn("convertNode", `No Excalidraw equivalent for a node of kind ${ node.kind }, strokes are kept`)
  }
}

const convertEdge = (edge: TJIIXEdgeElement, stroke: ExcalidrawFreeDrawElement): ExcalidrawElementSkeleton | undefined =>
{
  if (edge.kind !== JIIXEdgeKind.Line) {
    console.warn("convertEdge", `No Excalidraw equivalent for an edge of kind ${ edge.kind }, strokes are kept`)
    return
  }
  const x = mmToPx(edge.x1)
  const y = mmToPx(edge.y1)
  const hasArrowhead = !!(edge.p1Decoration || edge.p2Decoration)
  return {
    type: hasArrowhead ? "arrow" : "line",
    x,
    y,
    points: [[0, 0], [mmToPx(edge.x2) - x, mmToPx(edge.y2) - y]],
    startArrowhead: edge.p1Decoration ? "arrow" : null,
    endArrowhead: edge.p2Decoration ? "arrow" : null,
    ...styleOf(stroke),
  }
}

const convertElement = (element: TJIIXElement, stroke: ExcalidrawFreeDrawElement): ExcalidrawElementSkeleton | undefined =>
{
  switch (element.type) {
    case JIIXElementType.Text:
      return convertText(element, stroke)
    case JIIXElementType.Node:
      return convertNode(element, stroke)
    case JIIXElementType.Edge:
      return convertEdge(element, stroke)
    default:
      console.warn("convert", `Unsupported JIIX element type: ${ element.type }`)
  }
}

/**
 * Converts the JIIX elements recognized from at least one of the given strokes. A converted element
 * takes all its strokes with it, even those outside the given ones, so no half word is left behind
 */
export const convert = (jiix: TJIIXExport, strokes: ExcalidrawFreeDrawElement[]): TConversion =>
{
  const strokesById = new Map(strokes.map(s => [s.id, s]))
  const conversion: TConversion = { skeletons: [], convertedStrokeIds: new Set() }
  for (const element of jiix.elements ?? []) {
    const ids = strokeIdsOf(element)
    const firstStroke = ids.map(id => strokesById.get(id)).find(s => !!s)
    if (!firstStroke) continue
    const skeleton = convertElement(element, firstStroke)
    if (!skeleton) continue
    conversion.skeletons.push(skeleton)
    ids.forEach(id => conversion.convertedStrokeIds.add(id))
  }
  return conversion
}
