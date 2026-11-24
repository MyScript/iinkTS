import { JIIXElementType, JIIXNodeKind, jiixToLLM } from "@/iink"
import type { TJIIXExport } from "@/iink"

describe("jiixToLLM", () => {
  test("should return a single text block for a simple Text export", () => {
    const jiix: TJIIXExport = {
      type: JIIXElementType.Text,
      id: "MainBlock",
      version: "3",
      label: "Hello world",
    }

    expect(jiixToLLM(jiix)).toEqual({ blocks: [{ type: "text", content: "Hello world" }] })
  })

  test("should return one text block per Text element, in order", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "First paragraph" },
        { id: "text/2", type: JIIXElementType.Text, label: "Second paragraph" },
      ],
    }

    expect(jiixToLLM(jiix)).toEqual({
      blocks: [
        { type: "text", content: "First paragraph" },
        { type: "text", content: "Second paragraph" },
      ],
    })
  })

  test("should return a math block with the LaTeX label, keeping element order", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "Solve for x" },
        { id: "math/1", type: JIIXElementType.Math, label: "x=2" },
      ],
    }

    expect(jiixToLLM(jiix)).toEqual({
      blocks: [
        { type: "text", content: "Solve for x" },
        { type: "math", latex: "x=2" },
      ],
    })
  })

  test("should skip a Math element without a label", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [{ id: "math/1", type: JIIXElementType.Math }],
    }

    expect(jiixToLLM(jiix)).toEqual({ blocks: [] })
  })

  test("should collapse all diagram Node/Edge elements into a single trailing Mermaid diagram block", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        { id: "text/1", type: JIIXElementType.Text, label: "Diagram below" },
        {
          id: "node/1",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 0, y: 0, width: 10, height: 10 },
          x: 0,
          y: 0,
          width: 10,
          height: 10,
        },
      ],
    }

    expect(jiixToLLM(jiix)).toEqual({
      blocks: [
        { type: "text", content: "Diagram below" },
        { type: "diagram", mermaid: "flowchart TD\n  node_1[rectangle]" },
      ],
    })
  })
})
