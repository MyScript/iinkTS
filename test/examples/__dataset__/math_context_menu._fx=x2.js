import strokes from "./json/math_context_menu._fx=x2.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 39.4812508,
        y: 32.6020813,
        width: 69.2041626,
        height: 21.84375,
      },
      elements: [
        {
          id: "raw-content/13",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/39",
              "bounding-box": {
                x: 39.4812508,
                y: 32.6020813,
                width: 69.2041626,
                height: 21.84375,
              },
              operands: [
                {
                  type: "×",
                  id: "raw-content/32",
                  "solver-output": true,
                  "bounding-box": {
                    x: 39.4812508,
                    y: 35.5125008,
                    width: 31.3687477,
                    height: 18.9333305,
                  },
                  operands: [
                    {
                      type: "variable",
                      id: "raw-content/19",
                      label: "f",
                      "bounding-box": {
                        x: 39.4812508,
                        y: 36.8354149,
                        width: 10.2020798,
                        height: 15.4937515,
                      },
                    },
                    {
                      type: "fence",
                      id: "raw-content/31",
                      "open symbol": "(",
                      "close symbol": ")",
                      operands: [
                        {
                          type: "variable",
                          id: "raw-content/45",
                          label: "x",
                          "bounding-box": {
                            x: 55.3562469,
                            y: 42.65625,
                            width: 12.3187485,
                            height: 7.8208313,
                          },
                        },
                      ],
                      "bounding-box": {
                        x: 50.8583336,
                        y: 35.5125008,
                        width: 19.9916649,
                        height: 18.9333305,
                      },
                    },
                  ],
                },
                {
                  type: "power",
                  id: "raw-content/90",
                  "bounding-box": {
                    x: 89.7520828,
                    y: 32.6020813,
                    width: 18.9333344,
                    height: 18.1395836,
                  },
                  operands: [
                    {
                      type: "variable",
                      id: "raw-content/69",
                      label: "x",
                      "bounding-box": {
                        x: 89.7520828,
                        y: 42.3916664,
                        width: 11.7895813,
                        height: 8.34999847,
                      },
                    },
                    {
                      type: "number",
                      id: "raw-content/89",
                      label: "2",
                      value: 2,
                      "bounding-box": {
                        x: 99.8062439,
                        y: 32.6020813,
                        width: 8.87917328,
                        height: 8.87916946,
                      },
                    },
                  ],
                },
              ],
            },
          ],
          label: "f\\left( x\\right) =x^{2}",
          "bounding-box": {
            x: 39.4812508,
            y: 32.6020813,
            width: 69.2041626,
            height: 21.84375,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
