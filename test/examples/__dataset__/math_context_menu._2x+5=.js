import strokes from "./json/math_context_menu._2x+5=.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 39.2166672,
        y: 32.8666649,
        width: 59.1499939,
        height: 20.2562485,
      },
      elements: [
        {
          type: "Math",
          expressions: [
            {
              type: "=",
              "bounding-box": {
                x: 39.2166672,
                y: 32.8666649,
                width: 59.1499939,
                height: 20.2562485,
              },
              operands: [
                {
                  type: "×",
                  "solver-output": true,
                  "bounding-box": {
                    x: 39.2166672,
                    y: 32.8666649,
                    width: 26.6062469,
                    height: 20.2562485,
                  },
                  operands: [
                    {
                      type: "variable",
                      label: "f",
                      "bounding-box": {
                        x: 39.2166672,
                        y: 33.6604156,
                        width: 9.9375,
                        height: 17.875,
                      },
                    },
                    {
                      type: "fence",
                      id: "raw-content/124",
                      "open symbol": "(",
                      "close symbol": ")",
                      operands: [
                        {
                          type: "variable",
                          label: "x",
                          "bounding-box": {
                            x: 51.1229134,
                            y: 42.1270828,
                            width: 12.5833359,
                            height: 7.8208313,
                          },
                        },
                      ],
                      "bounding-box": {
                        x: 48.7416649,
                        y: 32.8666649,
                        width: 17.0812492,
                        height: 20.2562485,
                      },
                    },
                  ],
                },
                {
                  type: "power",
                  "bounding-box": {
                    x: 82.34375,
                    y: 33.1312485,
                    width: 16.0229111,
                    height: 15.4937515,
                  },
                  operands: [
                    {
                      type: "variable",
                      label: "x",
                      "bounding-box": {
                        x: 82.34375,
                        y: 40.5395813,
                        width: 12.3187485,
                        height: 8.0854187,
                      },
                    },
                    {
                      type: "number",
                      label: "2",
                      value: 2,
                      "bounding-box": {
                        x: 90.8104172,
                        y: 33.1312485,
                        width: 7.5562439,
                        height: 7.02708435,
                      },
                    },
                  ],
                },
              ],
            },
          ],
          label: "f\\left( x\\right) =x^{2}",
          "bounding-box": {
            x: 39.2166672,
            y: 32.8666649,
            width: 59.1499939,
            height: 20.2562485,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
