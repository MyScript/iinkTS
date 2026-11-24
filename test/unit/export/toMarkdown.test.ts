import { JIIXElementType, JIIXNodeKind, jiixToMarkdown } from "@/iink"
import type { TJIIXExport } from "@/iink"

describe("jiixToMarkdown", () => {
  test("should return the root label as plain text for a simple Text export", () => {
    const jiix: TJIIXExport = {
      type: JIIXElementType.Text,
      id: "MainBlock",
      version: "3",
      label: "Hello world",
    }

    expect(jiixToMarkdown(jiix)).toBe("Hello world")
  })

  test("should join Text elements' labels as separate paragraphs when root has no label", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "First paragraph" },
        { id: "text/2", type: JIIXElementType.Text, label: "Second paragraph" },
      ],
    }

    expect(jiixToMarkdown(jiix)).toBe("First paragraph\n\nSecond paragraph")
  })

  test("should wrap Math elements' labels in $$ and keep element order", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "Solve for x" },
        { id: "math/1", type: JIIXElementType.Math, label: "x=2" },
      ],
    }

    expect(jiixToMarkdown(jiix)).toBe("Solve for x\n\n$$x=2$$")
  })

  test("should skip diagram Node/Edge elements (handled by the Mermaid/PlantUML export)", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "Diagram below" },
        { id: "node/1", type: JIIXElementType.Node, kind: JIIXNodeKind.Rectangle, x: 0, y: 0, width: 10, height: 10 },
      ],
    }

    expect(jiixToMarkdown(jiix)).toBe("Diagram below")
  })
})
