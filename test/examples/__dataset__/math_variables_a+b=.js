import strokes from "./json/math_variables_a+b=.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 33.9249992,
        y: 35.2479172,
        width: 46.9791679,
        height: 17.3458328,
      },
      elements: [
        {
          id: "raw-content/60",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/101",
              "bounding-box": {
                x: 33.9249992,
                y: 35.2479172,
                width: 46.9791679,
                height: 17.3458328,
              },
              operands: [
                {
                  type: "+",
                  id: "raw-content/82",
                  "bounding-box": {
                    x: 33.9249992,
                    y: 35.2479172,
                    width: 36.9249992,
                    height: 17.3458328,
                  },
                  operands: [
                    {
                      type: "variable",
                      id: "raw-content/66",
                      label: "A",
                      "bounding-box": {
                        x: 33.9249992,
                        y: 36.0416641,
                        width: 9.40833282,
                        height: 15.4937515,
                      },
                    },
                    {
                      type: "variable",
                      id: "raw-content/94",
                      label: "B",
                      "bounding-box": {
                        x: 59.8541641,
                        y: 35.2479172,
                        width: 10.9958344,
                        height: 17.3458328,
                      },
                    },
                  ],
                },
                null,
              ],
            },
          ],
          label: "A+B=",
          "bounding-box": {
            x: 33.9249992,
            y: 35.2479172,
            width: 46.9791679,
            height: 17.3458328,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
