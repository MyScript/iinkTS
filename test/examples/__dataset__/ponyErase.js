import strokes from "./json/ponyErase.json" with { type: "json" }

export default {
  strokes,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "pony",
        words: [
          {
            label: "pony",
            candidates: ["pony", "Pony", "pong", "pory", "fony"],
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "ony",
        words: [
          {
            label: "ony",
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}
