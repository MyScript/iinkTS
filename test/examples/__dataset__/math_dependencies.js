import strokes from "./json/math_dependencies.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 20.9604168,
        y: 25.7229156,
        width: 55.7104111,
        height: 42.4812469,
      },
      elements: [
        {
          id: "raw-content/51",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/57",
              "bounding-box": {
                x: 20.9604168,
                y: 25.7229156,
                width: 39.5708313,
                height: 13.90625,
              },
              operands: [
                {
                  type: "variable",
                  id: "raw-content/63",
                  label: "x",
                  "bounding-box": {
                    x: 20.9604168,
                    y: 32.0729141,
                    width: 16.552084,
                    height: 7.55625153,
                  },
                },
                {
                  type: "number",
                  id: "raw-content/87",
                  label: "2",
                  value: 2,
                  "bounding-box": {
                    x: 51.9166641,
                    y: 25.7229156,
                    width: 8.61458588,
                    height: 13.1124992,
                  },
                },
              ],
            },
          ],
          label: "x=2",
          "bounding-box": {
            x: 20.9604168,
            y: 25.7229156,
            width: 39.5708313,
            height: 13.90625,
          },
        },
        {
          id: "raw-content/94",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/145",
              "bounding-box": {
                x: 22.5479164,
                y: 53.2395821,
                width: 54.1229134,
                height: 14.9645805,
              },
              operands: [
                {
                  type: "+",
                  id: "raw-content/119",
                  "bounding-box": {
                    x: 22.5479164,
                    y: 53.2395821,
                    width: 43.2749977,
                    height: 14.9645805,
                  },
                  operands: [
                    {
                      type: "×",
                      id: "raw-content/107",
                      "solver-output": true,
                      "bounding-box": {
                        x: 22.5479164,
                        y: 53.2395821,
                        width: 22.3729172,
                        height: 14.9645805,
                      },
                      operands: [
                        {
                          type: "number",
                          id: "raw-content/100",
                          label: "3",
                          value: 3,
                          "bounding-box": {
                            x: 22.5479164,
                            y: 53.2395821,
                            width: 9.9375,
                            height: 14.9645805,
                          },
                        },
                        {
                          type: "variable",
                          id: "raw-content/106",
                          label: "x",
                          value: 2,
                          "bounding-box": {
                            x: 34.71875,
                            y: 59.0604134,
                            width: 10.2020836,
                            height: 7.02708817,
                          },
                        },
                      ],
                    },
                    {
                      type: "number",
                      id: "raw-content/138",
                      label: "2",
                      value: 2,
                      "bounding-box": {
                        x: 57.7374992,
                        y: 53.7687492,
                        width: 8.08541489,
                        height: 11.5249977,
                      },
                    },
                  ],
                },
                null,
              ],
            },
          ],
          label: "3x+2=",
          "bounding-box": {
            x: 22.5479164,
            y: 53.2395821,
            width: 54.1229134,
            height: 14.9645805,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
