import strokes from "./json/math_variables_chained_var.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 36.3062477,
        y: 33.3958321,
        width: 77.1416626,
        height: 86.1374969,
      },
      elements: [
        {
          id: "raw-content/231",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/237",
              "bounding-box": {
                x: 36.3062477,
                y: 33.3958321,
                width: 48.8312492,
                height: 21.5791664,
              },
              operands: [
                {
                  type: "variable",
                  id: "raw-content/243",
                  label: "x",
                  "bounding-box": {
                    x: 36.3062477,
                    y: 43.9791641,
                    width: 20.2562523,
                    height: 10.9958344,
                  },
                },
                {
                  type: "number",
                  id: "raw-content/261",
                  label: "3",
                  value: 3,
                  "bounding-box": {
                    x: 72.2895813,
                    y: 33.3958321,
                    width: 12.8479156,
                    height: 14.7000008,
                  },
                },
              ],
            },
          ],
          label: "x=3",
          "bounding-box": {
            x: 36.3062477,
            y: 33.3958321,
            width: 48.8312492,
            height: 21.5791664,
          },
        },
        {
          id: "raw-content/267",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/307",
              "bounding-box": {
                x: 36.5708313,
                y: 59.8541641,
                width: 76.8770828,
                height: 28.9875031,
              },
              operands: [
                {
                  type: "variable",
                  id: "raw-content/273",
                  label: "y",
                  "bounding-box": {
                    x: 36.5708313,
                    y: 69.1145782,
                    width: 18.1395836,
                    height: 19.7270889,
                  },
                },
                {
                  type: "+",
                  id: "raw-content/280",
                  "bounding-box": {
                    x: 69.6437454,
                    y: 59.8541641,
                    width: 43.8041687,
                    height: 17.875,
                  },
                  operands: [
                    {
                      type: "variable",
                      id: "raw-content/293",
                      label: "x",
                      value: 3,
                      "bounding-box": {
                        x: 69.6437454,
                        y: 67.7916641,
                        width: 18.9333344,
                        height: 9.9375,
                      },
                    },
                    {
                      type: "number",
                      id: "raw-content/321",
                      label: "1",
                      value: 1,
                      "bounding-box": {
                        x: 103.510414,
                        y: 59.8541641,
                        width: 9.9375,
                        height: 15.2291641,
                      },
                    },
                  ],
                },
              ],
            },
          ],
          label: "y=x+1",
          "bounding-box": {
            x: 36.5708313,
            y: 59.8541641,
            width: 76.8770828,
            height: 28.9875031,
          },
        },
        {
          id: "raw-content/329",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/419",
              "bounding-box": {
                x: 39.2166672,
                y: 89.2229156,
                width: 35.3374939,
                height: 30.3104172,
              },
              operands: [
                {
                  type: "power",
                  id: "raw-content/389",
                  "bounding-box": {
                    x: 39.2166672,
                    y: 89.2229156,
                    width: 20.7854156,
                    height: 30.3104172,
                  },
                  operands: [
                    {
                      type: "variable",
                      id: "raw-content/335",
                      label: "y",
                      value: 4,
                      "bounding-box": {
                        x: 39.2166672,
                        y: 95.0437469,
                        width: 19.9916649,
                        height: 24.4895859,
                      },
                    },
                    {
                      type: "number",
                      id: "raw-content/388",
                      label: "2",
                      value: 2,
                      "bounding-box": {
                        x: 54.2979164,
                        y: 89.2229156,
                        width: 5.70416641,
                        height: 8.87916565,
                      },
                    },
                  ],
                },
                null,
              ],
            },
          ],
          label: "y^{2}=",
          "bounding-box": {
            x: 39.2166672,
            y: 89.2229156,
            width: 35.3374939,
            height: 30.3104172,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
