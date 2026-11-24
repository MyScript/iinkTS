import { circleJIIX, rectangleJIIX, rhombusJIIX } from "../__dataset__/jiix.dataset"
import { JIIXEdgeKind, JIIXElementType, JIIXNodeKind, jiixToPlantUML } from "@/iink"
import type { TJIIXExport } from "@/iink"

describe("jiixToPlantUML", () => {
  test("should declare a single rectangle Node using its kind as fallback label", () => {
    expect(jiixToPlantUML(rectangleJIIX)).toBe('@startuml\nrectangle "rectangle" as raw_content_24\n@enduml')
  })

  test("should declare a circle Node using the PlantUML circle shape", () => {
    expect(jiixToPlantUML(circleJIIX)).toBe('@startuml\ncircle "circle" as raw_content_12\n@enduml')
  })

  test("should declare a rhombus Node using the PlantUML hexagon shape (closest native equivalent)", () => {
    expect(jiixToPlantUML(rhombusJIIX)).toBe('@startuml\nhexagon "rhombus" as raw_content_15\n@enduml')
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

    expect(jiixToPlantUML(jiix)).toBe('@startuml\nrectangle "User" as node_1\n@enduml')
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

    expect(jiixToPlantUML(jiix)).toBe(
      '@startuml\nrectangle "rectangle" as node_A\nrectangle "rectangle" as node_B\nnode_A --> node_B\n@enduml'
    )
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

    expect(jiixToPlantUML(jiix)).toBe('@startuml\nrectangle "rectangle" as node_A\n@enduml')
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

    expect(jiixToPlantUML(jiix)).toBe(
      '@startuml\nrectangle "rectangle" as node_A\nrectangle "rectangle" as node_B\nnode_A --> node_B\n@enduml'
    )
  })
})
