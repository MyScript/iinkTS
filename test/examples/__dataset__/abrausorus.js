import strokes from "./json/abrausorus.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["abrausorus"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "abrausorus",
      words: [
        {
          label: "abrausorus",
          candidates: ["abrausorus"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
