import { circleJIIX, rectangleJIIX, rhombusJIIX } from "../__dataset__/jiix.dataset"
import { JIIXEdgeKind, JIIXElementType, JIIXNodeKind, jiixToMermaid } from "@/iink"
import type { TJIIXExport } from "@/iink"

describe("jiixToMermaid", () => {
  test("should declare a single rectangle Node with its kind as fallback label", () => {
    expect(jiixToMermaid(rectangleJIIX)).toBe("flowchart TD\n  raw_content_24[rectangle]")
  })

  test("should declare a circle Node using the mermaid double-parenthesis shape", () => {
    expect(jiixToMermaid(circleJIIX)).toBe("flowchart TD\n  raw_content_12((circle))")
  })

  test("should declare a rhombus Node using the mermaid diamond shape", () => {
    expect(jiixToMermaid(rhombusJIIX)).toBe("flowchart TD\n  raw_content_15{rhombus}")
  })

  test("should use a Text element's label instead of the kind fallback when it sits inside the Node", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        {
          id: "node/1",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 0, y: 0, width: 100, height: 50 },
          x: 0,
          y: 0,
          width: 100,
          height: 50,
        },
        {
          id: "text/1",
          type: JIIXElementType.Text,
          label: "User",
          "bounding-box": { x: 10, y: 10, width: 20, height: 10 },
        },
      ],
    }

    expect(jiixToMermaid(jiix)).toBe("flowchart TD\n  node_1[User]")
  })

  test("should draw an arrow between the two Nodes a Line Edge's endpoints land in", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        {
          id: "node/A",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 0, y: 0, width: 20, height: 20 },
          x: 0,
          y: 0,
          width: 20,
          height: 20,
        },
        {
          id: "node/B",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 0, y: 100, width: 20, height: 20 },
          x: 0,
          y: 100,
          width: 20,
          height: 20,
        },
        {
          id: "edge/1",
          type: JIIXElementType.Edge,
          kind: JIIXEdgeKind.Line,
          x1: 10,
          y1: 15,
          x2: 10,
          y2: 105,
        },
      ],
    }

    expect(jiixToMermaid(jiix)).toBe("flowchart TD\n  node_A[rectangle]\n  node_B[rectangle]\n  node_A --> node_B")
  })

  test("should skip a Line Edge whose endpoint doesn't land inside any Node", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        {
          id: "node/A",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 0, y: 0, width: 20, height: 20 },
          x: 0,
          y: 0,
          width: 20,
          height: 20,
        },
        {
          id: "edge/1",
          type: JIIXElementType.Edge,
          kind: JIIXEdgeKind.Line,
          x1: 10,
          y1: 15,
          x2: 500,
          y2: 500,
        },
      ],
    }

    expect(jiixToMermaid(jiix)).toBe("flowchart TD\n  node_A[rectangle]")
  })

  test("should prefer the server-provided connected/ports over geometry when both are present", () => {
    const jiix: TJIIXExport = {
      type: "Raw Content",
      id: "MainBlock",
      version: "3",
      elements: [
        {
          id: "node/A",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          // Bounding box deliberately does NOT contain the edge's endpoints, so a geometry-only
          // resolution would fail to connect this node — connected/ports must win regardless.
          "bounding-box": { x: 500, y: 500, width: 20, height: 20 },
          x: 500,
          y: 500,
          width: 20,
          height: 20,
        },
        {
          id: "node/B",
          type: JIIXElementType.Node,
          kind: JIIXNodeKind.Rectangle,
          "bounding-box": { x: 600, y: 600, width: 20, height: 20 },
          x: 600,
          y: 600,
          width: 20,
          height: 20,
        },
        {
          id: "edge/1",
          type: JIIXElementType.Edge,
          kind: JIIXEdgeKind.Line,
          connected: ["node/A", "node/B"],
          ports: [0, 1],
          x1: 10,
          y1: 15,
          x2: 10,
          y2: 105,
        },
      ],
    }

    expect(jiixToMermaid(jiix)).toBe("flowchart TD\n  node_A[rectangle]\n  node_B[rectangle]\n  node_A --> node_B")
  })
})
