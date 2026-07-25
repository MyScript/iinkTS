import strokes from "./json/paris.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["paris"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "paris",
      words: [
        {
          label: "paris",
          candidates: ["paris"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
