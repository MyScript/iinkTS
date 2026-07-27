import strokes from "./json/rectangleShape.json" with { type: "json" }

export default {
  strokes,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        version: "3",
        id: "MainBlock",
        type: "Shape",
        range: [
          {
            from: {
              stroke: 0,
            },
            to: {
              stroke: 0,
            },
          },
        ],
        elements: [
          {
            range: [
              {
                from: {
                  stroke: 0,
                },
                to: {
                  stroke: 0,
                },
              },
            ],
            shape: {
              kind: "line",
              primitives: [
                {
                  type: "line",
                  x1: 57.2127228,
                  y1: 52.2120247,
                  x2: 57.2127228,
                  y2: 72.0824585,
                },
              ],
            },
            candidates: [
              {
                kind: "line",
                primitives: [
                  {
                    type: "line",
                    x1: 57.2127228,
                    y1: 52.2120247,
                    x2: 57.2127228,
                    y2: 72.0824585,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      "application/vnd.myscript.jiix": {
        elements: [
          {
            type: "Shape",
            elements: [
              {
                shape: {
                  kind: "rectangle",
                  primitives: [
                    {
                      type: "line",
                      x1: 57.238903,
                      y1: 71.5014038,
                      x2: 89.8252258,
                      y2: 71.5014038,
                    },
                    {
                      type: "line",
                      x1: 89.8252258,
                      y1: 71.5014038,
                      x2: 89.8252258,
                      y2: 52.570694,
                    },
                    {
                      type: "line",
                      x1: 89.8252258,
                      y1: 52.570694,
                      x2: 57.2388916,
                      y2: 52.5706902,
                    },
                    {
                      type: "line",
                      x1: 57.2388916,
                      y1: 52.5706902,
                      x2: 57.238903,
                      y2: 71.5014038,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  ],
}
