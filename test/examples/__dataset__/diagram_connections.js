import strokes from "./json/diagram_connections.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 11.6999998,
        y: 36.8354149,
        width: 87.1958313,
        height: 66.8229218,
      },
      elements: [
        {
          type: "Node",
          kind: "rectangle",
          orientation: 0.0171630364,
          id: "raw-content/15",
          "bounding-box": {
            x: 11.6999998,
            y: 36.8354149,
            width: 28.4583321,
            height: 31.1041679,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-e7ca6b62-fd-09-b1-4296c9aab6",
              "full-id": "stroke-e7ca6b62-fd-09-b1-4296c9aab6",
            },
          ],
          x: 12.6564922,
          y: 38.7844315,
          width: 27.1442356,
          height: 27.1442337,
        },
        {
          type: "Edge",
          kind: "line",
          connected: ["raw-content/15", "raw-content/34"],
          ports: [0, 1],
          id: "raw-content/23",
          "bounding-box": {
            x: 38.4229164,
            y: 49.0062485,
            width: 36.6604118,
            height: 10.4666672,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-e1fb8cff-43-2f-57-1631ff6171",
              "full-id": "stroke-e1fb8cff-43-2f-57-1631ff6171",
            },
            {
              type: "stroke",
              id: "stroke-da970797-8c-44-71-16789b46d1",
              "full-id": "stroke-da970797-8c-44-71-16789b46d1",
            },
          ],
          x1: 39.4229164,
          y1: 52.9166641,
          x2: 74.1963654,
          y2: 51.9186134,
          p2Decoration: "arrow-head",
        },
        {
          type: "Node",
          kind: "circle",
          orientation: 0,
          id: "raw-content/34",
          "bounding-box": {
            x: 73.6124954,
            y: 39.2166672,
            width: 25.2833328,
            height: 26.0770798,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-442f1eee-28-50-e9-f6493d87a9",
              "full-id": "stroke-442f1eee-28-50-e9-f6493d87a9",
            },
          ],
          cx: 86.3194351,
          cy: 52.2735481,
          r: 11.7354822,
        },
        {
          type: "Edge",
          kind: "arc",
          connected: ["raw-content/15", "raw-content/54"],
          ports: [0, 1],
          id: "raw-content/42",
          "bounding-box": {
            x: 24.9291668,
            y: 66.7333298,
            width: 34.8083344,
            height: 34.8083344,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-93dac127-27-c4-6a-5d4de2bc0e",
              "full-id": "stroke-93dac127-27-c4-6a-5d4de2bc0e",
            },
            {
              type: "stroke",
              id: "stroke-eb242c36-44-ef-e5-e53a09d72b",
              "full-id": "stroke-eb242c36-44-ef-e5-e53a09d72b",
            },
          ],
          cx: 46.944294,
          cy: 72.7045212,
          rx: 21.2520504,
          ry: 21.2520504,
          phi: 0,
          startAngle: -2.90930939,
          sweepAngle: -2.36714292,
          endDecoration: "arrow-head",
        },
        {
          type: "Node",
          kind: "circle",
          orientation: 0,
          id: "raw-content/54",
          "bounding-box": {
            x: 59.5895805,
            y: 71.7604141,
            width: 31.8979149,
            height: 31.8979187,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-02d36127-07-94-36-68972d187a",
              "full-id": "stroke-02d36127-07-94-36-68972d187a",
            },
          ],
          cx: 75.2424316,
          cy: 88.7148743,
          r: 14.3797951,
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
