import strokes from "./json/rectangle.json" with { type: "json" }

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
            x1: 57.5700951,
            y1: 52.1299248,
            x2: 56.6754112,
            y2: 71.9691315,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
    {
      "application/vnd.myscript.jiix": {
        type: "Diagram",
        elements: [
          {
            type: "Node",
            kind: "rectangle",
            x: 57.1401787,
            y: 52.4829941,
            width: 32.5525246,
            height: 18.9110947,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}
