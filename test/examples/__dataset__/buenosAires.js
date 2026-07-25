import strokes from "./json/buenosAires.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["buenos aires"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "buenos aires",
      words: [
        {
          label: "buenos aires",
          candidates: ["buenos aires"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
