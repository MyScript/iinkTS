import { JIIXNodeKind, type TJIIXExport, type TJIIXNodeElement, type TJIIXTextElement } from "@/client"

import { extractJIIXGraphElements, findLabelInside, resolveEdgeNodes, sanitizeGraphId } from "./jiixGraph"

const PLANTUML_SHAPE_BY_NODE_KIND: Record<JIIXNodeKind, string> = {
  [JIIXNodeKind.Rectangle]: "rectangle",
  [JIIXNodeKind.Circle]: "circle",
  [JIIXNodeKind.Ellipse]: "circle",
  [JIIXNodeKind.Rhombus]: "hexagon",
  [JIIXNodeKind.Parallelogram]: "card",
  [JIIXNodeKind.Triangle]: "rectangle",
  [JIIXNodeKind.Polygon]: "rectangle",
}

function nodeDeclaration(node: TJIIXNodeElement, texts: TJIIXTextElement[]): string {
  const shape = PLANTUML_SHAPE_BY_NODE_KIND[node.kind]
  const label = findLabelInside(node["bounding-box"], texts) ?? node.kind
  return `${shape} "${label}" as ${sanitizeGraphId(node.id)}`
}

/**
 * @group Export
 * @summary Convert a JIIX diagram export into a PlantUML diagram
 * @param jiix - JIIX export to convert
 * @returns PlantUML `@startuml`/`@enduml` diagram syntax
 */
export function jiixToPlantUML(jiix: TJIIXExport): string {
  const { nodes, texts, edges } = extractJIIXGraphElements(jiix)

  const edgeDeclarations = edges
    .map((edge) => resolveEdgeNodes(edge, nodes))
    .filter((resolved): resolved is [TJIIXNodeElement, TJIIXNodeElement] => resolved !== undefined)
    .map(([from, to]) => `${sanitizeGraphId(from.id)} --> ${sanitizeGraphId(to.id)}`)

  return ["@startuml", ...nodes.map((node) => nodeDeclaration(node, texts)), ...edgeDeclarations, "@enduml"].join("\n")
}
