import strokes from "./json/helloOneStroke.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["hello"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "hello",
      words: [
        {
          label: "hello",
          candidates: ["hello", "helto", "helts", "kelto", "felto"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
