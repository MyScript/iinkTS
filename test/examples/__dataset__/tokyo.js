import strokes from "./json/tokyo.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["t", "to", "tok", "toky", "tokyo"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "tokyo",
      words: [
        {
          label: "tokyo",
          candidates: ["tokyo"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
