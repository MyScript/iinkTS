import strokes from "./json/helloStrike.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "text/plain": ["hello", ""],
  },
}
