import strokes from "./json/line.json" with { type: "json" }

export default {
  strokes,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Diagram",
        elements: [
          {
            type: "Edge",
            kind: "line",
            connected: [],
            ports: [],
            x1: 60.0628433,
            y1: 47.2759743,
            x2: 98.6923065,
            y2: 47.064743,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}
