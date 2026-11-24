import { JIIXElementType, type TJIIXElement, type TJIIXExport } from "@/client"

function elementToMarkdown(element: TJIIXElement): string | undefined {
  switch (element.type) {
    case JIIXElementType.Text:
      return element.label
    case JIIXElementType.Math:
      return element.label ? `$$${element.label}$$` : undefined
    default:
      return undefined
  }
}

/**
 * @group Export
 * @summary Convert a JIIX export into a Markdown string
 * @param jiix - JIIX export to convert
 * @returns Markdown representation of the JIIX export
 */
export function jiixToMarkdown(jiix: TJIIXExport): string {
  if (jiix.label) {
    return jiix.label
  }

  return (jiix.elements ?? [])
    .map(elementToMarkdown)
    .filter((markdown): markdown is string => markdown !== undefined)
    .join("\n\n")
}
