import strokes from "./json/helloInsert.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["hello"],
  },
}
