import { JIIXElementType, type TJIIXExport } from "@/client"

import { jiixToMermaid } from "./toMermaid"

/**
 * @group Export
 */
export type TLLMContentBlock =
  { type: "text"; content: string } | { type: "math"; latex: string } | { type: "diagram"; mermaid: string }

/**
 * @group Export
 */
export type TLLMExport = {
  blocks: TLLMContentBlock[]
}

/**
 * @group Export
 * @summary Convert a JIIX export into a flat, prompt-ready JSON structure for LLM consumption
 * @param jiix - JIIX export to convert
 * @returns Ordered content blocks (text/math/diagram); diagram Nodes/Edges collapse into a single Mermaid block
 */
export function jiixToLLM(jiix: TJIIXExport): TLLMExport {
  if (jiix.label) {
    return { blocks: [{ type: "text", content: jiix.label }] }
  }

  const elements = jiix.elements ?? []
  const blocks: TLLMContentBlock[] = []
  let diagramAdded = false

  for (const element of elements) {
    switch (element.type) {
      case JIIXElementType.Text:
        blocks.push({ type: "text", content: element.label })
        break
      case JIIXElementType.Math:
        if (element.label) {
          blocks.push({ type: "math", latex: element.label })
        }
        break
      case JIIXElementType.Node:
      case JIIXElementType.Edge:
        if (!diagramAdded) {
          blocks.push({ type: "diagram", mermaid: jiixToMermaid(jiix) })
          diagramAdded = true
        }
        break
    }
  }

  return { blocks }
}
