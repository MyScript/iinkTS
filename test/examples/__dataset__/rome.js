import strokes from "./json/rome.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["rome"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "rome",
      words: [
        {
          label: "rome",
          candidates: ["rome"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
