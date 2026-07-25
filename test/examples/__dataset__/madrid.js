import strokes from "./json/madrid.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["madrid"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "madrid",
      words: [
        {
          label: "madrid",
          candidates: ["madrid"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
