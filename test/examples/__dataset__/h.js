import strokes from "./json/h.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "h",
      words: [
        {
          label: "h",
          candidates: ["h", "k", "hh", "hr", "L"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
    "text/plain": "h",
  },
}
