import { JIIXNodeKind, type TJIIXExport, type TJIIXNodeElement, type TJIIXTextElement } from "@/client"

import { extractJIIXGraphElements, findLabelInside, resolveEdgeNodes, sanitizeGraphId } from "./jiixGraph"

const MERMAID_SHAPE_BY_NODE_KIND: Record<JIIXNodeKind, [string, string]> = {
  [JIIXNodeKind.Rectangle]: ["[", "]"],
  [JIIXNodeKind.Circle]: ["((", "))"],
  [JIIXNodeKind.Ellipse]: ["((", "))"],
  [JIIXNodeKind.Rhombus]: ["{", "}"],
  [JIIXNodeKind.Parallelogram]: ["[/", "/]"],
  [JIIXNodeKind.Triangle]: ["[", "]"],
  [JIIXNodeKind.Polygon]: ["[", "]"],
}

function nodeDeclaration(node: TJIIXNodeElement, texts: TJIIXTextElement[]): string {
  const [open, close] = MERMAID_SHAPE_BY_NODE_KIND[node.kind]
  const label = findLabelInside(node["bounding-box"], texts) ?? node.kind
  return `  ${sanitizeGraphId(node.id)}${open}${label}${close}`
}

/**
 * @group Export
 * @summary Convert a JIIX diagram export into a Mermaid flowchart
 * @param jiix - JIIX export to convert
 * @returns Mermaid flowchart syntax
 */
export function jiixToMermaid(jiix: TJIIXExport): string {
  const { nodes, texts, edges } = extractJIIXGraphElements(jiix)

  const edgeDeclarations = edges
    .map((edge) => resolveEdgeNodes(edge, nodes))
    .filter((resolved): resolved is [TJIIXNodeElement, TJIIXNodeElement] => resolved !== undefined)
    .map(([from, to]) => `  ${sanitizeGraphId(from.id)} --> ${sanitizeGraphId(to.id)}`)

  return ["flowchart TD", ...nodes.map((node) => nodeDeclaration(node, texts)), ...edgeDeclarations].join("\n")
}
