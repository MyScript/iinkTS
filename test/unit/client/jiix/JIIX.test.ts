import { parseExportedJIIX, TExportWire } from "@/iink"

describe("Export.ts", () => {
  describe("parseExportedJIIX", () => {
    test("should parse the JIIX the websocket protocols send as a JSON string", () => {
      const wire: TExportWire = { "application/vnd.myscript.jiix": JSON.stringify({ type: "Text", label: "a" }) }
      expect(parseExportedJIIX(wire)).toEqual({ "application/vnd.myscript.jiix": { type: "Text", label: "a" } })
    })

    test("should leave the message it reads untouched", () => {
      const jiix = JSON.stringify({ type: "Text", label: "a" })
      const wire: TExportWire = { "application/vnd.myscript.jiix": jiix }
      parseExportedJIIX(wire)
      expect(wire).toEqual({ "application/vnd.myscript.jiix": jiix })
    })

    test("should keep the other exports as they are", () => {
      expect(parseExportedJIIX({ "text/plain": "a" })).toEqual({ "text/plain": "a" })
    })
  })
})
