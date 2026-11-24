import {
  JIIXEdgeKind,
  JIIXElementType,
  type TJIIXEdgeElement,
  type TJIIXExport,
  type TJIIXNodeElement,
  type TJIIXTextElement,
} from "@/client"
import { computePointOnEllipse, isPointInsideBox, type TBox, type TPoint } from "@/core"

/**
 * @group Export
 * @summary Sanitize a JIIX element id into a valid Mermaid/PlantUML identifier
 * @param id - JIIX element id
 * @returns Identifier containing only alphanumeric characters and underscores
 */
export function sanitizeGraphId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

function boxCenter(box: TBox): TPoint {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/**
 * @group Export
 * @summary Find the Text element whose bounding-box center lands inside a given box
 * @param box - Box to test against (typically a Node's bounding-box)
 * @param texts - Text elements to search
 * @returns The matching Text element's label, or undefined
 */
export function findLabelInside(box: TBox | undefined, texts: TJIIXTextElement[]): string | undefined {
  if (!box) {
    return undefined
  }
  return texts.find((text) => text["bounding-box"] && isPointInsideBox(boxCenter(text["bounding-box"]), box))?.label
}

function edgeEndpoints(edge: TJIIXEdgeElement): [TPoint, TPoint] {
  switch (edge.kind) {
    case JIIXEdgeKind.Line:
      return [
        { x: edge.x1, y: edge.y1 },
        { x: edge.x2, y: edge.y2 },
      ]
    case JIIXEdgeKind.PolyEdge: {
      const first = edge.edges[0]
      const last = edge.edges[edge.edges.length - 1]
      return [
        { x: first.x1, y: first.y1 },
        { x: last.x2, y: last.y2 },
      ]
    }
    case JIIXEdgeKind.Arc: {
      const center = { x: edge.cx, y: edge.cy }
      return [
        computePointOnEllipse(center, edge.rx, edge.ry, edge.phi, edge.startAngle),
        computePointOnEllipse(center, edge.rx, edge.ry, edge.phi, edge.startAngle + edge.sweepAngle),
      ]
    }
  }
}

function findNodeForPoint(point: TPoint, nodes: TJIIXNodeElement[]): TJIIXNodeElement | undefined {
  return nodes.find((node) => node["bounding-box"] && isPointInsideBox(point, node["bounding-box"]))
}

function findNodeById(id: string, nodes: TJIIXNodeElement[]): TJIIXNodeElement | undefined {
  return nodes.find((node) => node.id === id)
}

/**
 * Resolves which two Nodes an Edge connects. The server fills `connected`/`ports` once a
 * diagram has more than one shape — trust it first, since it reflects the actual recognition
 * rather than a geometric guess. Falls back to matching endpoints against node bounding boxes
 * when `connected` is absent (e.g. a lone edge with nothing to connect to).
 *
 * @group Export
 * @summary Resolve the two Nodes an Edge connects
 * @param edge - Edge element to resolve
 * @param nodes - Node elements to search
 * @returns Tuple of the source/target Node, or undefined if either end can't be resolved
 */
export function resolveEdgeNodes(
  edge: TJIIXEdgeElement,
  nodes: TJIIXNodeElement[]
): [TJIIXNodeElement, TJIIXNodeElement] | undefined {
  if (edge.connected?.length === 2) {
    const from = findNodeById(edge.connected[0], nodes)
    const to = findNodeById(edge.connected[1], nodes)
    if (from && to) {
      return [from, to]
    }
  }

  const [start, end] = edgeEndpoints(edge)
  const from = findNodeForPoint(start, nodes)
  const to = findNodeForPoint(end, nodes)
  return from && to ? [from, to] : undefined
}

/**
 * @group Export
 */
export type TJIIXGraphElements = {
  nodes: TJIIXNodeElement[]
  texts: TJIIXTextElement[]
  edges: TJIIXEdgeElement[]
}

/**
 * @group Export
 * @summary Split a JIIX export's elements into diagram Nodes/Edges and their Text labels
 * @param jiix - JIIX export to inspect
 * @returns The Node, Text and Edge elements found in the export
 */
export function extractJIIXGraphElements(jiix: TJIIXExport): TJIIXGraphElements {
  const elements = jiix.elements ?? []
  return {
    nodes: elements.filter((element): element is TJIIXNodeElement => element.type === JIIXElementType.Node),
    texts: elements.filter((element): element is TJIIXTextElement => element.type === JIIXElementType.Text),
    edges: elements.filter((element): element is TJIIXEdgeElement => element.type === JIIXElementType.Edge),
  }
}
