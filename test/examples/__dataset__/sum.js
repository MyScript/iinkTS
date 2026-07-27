import strokes from "./json/sum.json" with { type: "json" }

export default {
  strokes,
  exports: {
    LATEX: ["3", "3-", "3+", "3+1", "3+1-", "3+1=", "3+1=4"],
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 65.1458282,
        y: 84.9895782,
        width: 25.0187531,
        height: 8.61458588,
      },
      elements: [
        {
          id: "raw-content/16",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/31",
              "bounding-box": {
                x: 65.1458282,
                y: 84.9895782,
                width: 25.0187531,
                height: 8.61458588,
              },
              operands: [
                {
                  type: "+",
                  id: "raw-content/30",
                  "bounding-box": {
                    x: 65.1458282,
                    y: 84.9895782,
                    width: 16.8166656,
                    height: 8.61458588,
                  },
                  operands: [
                    {
                      type: "number",
                      id: "raw-content/28",
                      label: "3",
                      value: 3,
                      "bounding-box": {
                        x: 65.1458282,
                        y: 85.2541656,
                        width: 6.49791718,
                        height: 8.0854187,
                      },
                    },
                    {
                      type: "number",
                      id: "raw-content/29",
                      label: "1",
                      value: 1,
                      "bounding-box": {
                        x: 79.6979141,
                        y: 84.9895782,
                        width: 2.26457977,
                        height: 8.61458588,
                      },
                    },
                  ],
                },
                null,
              ],
            },
          ],
          label: "3+1=",
          "bounding-box": {
            x: 65.1458282,
            y: 84.9895782,
            width: 25.0187531,
            height: 8.61458588,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
