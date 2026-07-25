import strokes from "./json/helloMultipleStrokes.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["h", "he", "hel", "hell", "hello"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "hello",
      words: [
        {
          label: "hello",
          candidates: ["hello", "kello", "helloo", "hellor", "hello"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}
