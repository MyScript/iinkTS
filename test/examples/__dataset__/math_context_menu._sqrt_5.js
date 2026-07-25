import strokes from "./json/math_context_menu._sqrt_5.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 32.0729141,
        y: 32.6020813,
        width: 47.7729187,
        height: 20.7854156,
      },
      elements: [
        {
          id: "raw-content/105",
          type: "Math",
          expressions: [
            {
              type: "=",
              id: "raw-content/131",
              "bounding-box": {
                x: 32.0729141,
                y: 32.6020813,
                width: 47.7729187,
                height: 20.7854156,
              },
              operands: [
                {
                  type: "square root",
                  id: "raw-content/111",
                  label: "√",
                  "bounding-box": {
                    x: 32.0729141,
                    y: 32.6020813,
                    width: 31.1041679,
                    height: 20.7854156,
                  },
                  operands: [
                    {
                      type: "number",
                      id: "raw-content/118",
                      label: "5",
                      value: 5,
                      "bounding-box": {
                        x: 46.625,
                        y: 38.4229164,
                        width: 10.7312469,
                        height: 12.0541649,
                      },
                    },
                  ],
                },
                null,
              ],
            },
          ],
          label: "\\sqrt{5}=",
          "bounding-box": {
            x: 32.0729141,
            y: 32.6020813,
            width: 47.7729187,
            height: 20.7854156,
          },
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
