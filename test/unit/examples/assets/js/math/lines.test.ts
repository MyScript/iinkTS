import { linesFromJiix } from "../../../../../../examples/assets/js/math/lines.js"
import type { TJiixExpression } from "../../../../../../examples/assets/js/math/lines.js"

import { eq, missing, mul, num, v } from "./fixtures"

describe("assets/js/math/lines", () => {
  const box = (x: number, y: number) => ({ x, y, width: 20, height: 8 })
  const math = (id: string, label: string, x: number, y: number) => ({
    type: "Math",
    id,
    label,
    "bounding-box": box(x, y),
    expressions: [eq(v("x"), num(Number(label.split("=")[1])))],
  })

  test("should make one line per Math element, top to bottom", () => {
    // The server sends one Math element per written line, in no particular order
    const jiix = { elements: [math("b", "x=2", 10, 40), math("a", "x=1", 10, 20), math("c", "x=3", 10, 60)] }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["a", "b", "c"])
  })

  test("should order lines on the same row from left to right", () => {
    const jiix = { elements: [math("right", "x=2", 60, 20), math("left", "x=1", 10, 21)] }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["left", "right"])
  })

  test("should keep the expression, label and box of each line", () => {
    const [line] = linesFromJiix({ elements: [math("a", "x=1", 10, 20)] })
    expect(line).toEqual({ id: "a", label: "x=1", box: box(10, 20), expression: eq(v("x"), num(1)) })
  })

  test("should skip shapes, text and Math elements without an expression", () => {
    const jiix = {
      elements: [
        { type: "Node", id: "triangle", kind: "triangle", "bounding-box": box(0, 0) },
        { type: "Text", id: "text", label: "hello", "bounding-box": box(0, 10) },
        { type: "Math", id: "empty", label: "", "bounding-box": box(0, 20), expressions: [] },
        math("a", "x=1", 10, 30),
      ],
    }
    expect(linesFromJiix(jiix).map((line) => line.id)).toEqual(["a"])
  })

  describe("a line written without its left side", () => {
    // What the server sends for `= 24`: the `=` keeps an empty slot where its left side would be
    const written = (id: string, label: string, y: number, expression: TJiixExpression) => ({
      type: "Math",
      id,
      label,
      "bounding-box": box(10, y),
      expressions: [expression],
    })
    const continued = (right: TJiixExpression) => ({ type: "=", operands: [null, right] })
    const expressions = (...elements: ReturnType<typeof written>[]) =>
      linesFromJiix({ elements }).map((line) => line.expression)

    test("should continue the line above, taking its left side", () => {
      const [, line] = linesFromJiix({
        elements: [written("a", "A=6\\times 4", 20, eq(v("A"), mul(num(6), num(4)))), written("b", "=24", 40, continued(num(24)))],
      })
      expect(line.expression).toEqual(eq(v("A"), num(24)))
      expect(line.label).toBe("=24")
    })

    test("should keep continuing down a chain of such lines", () => {
      const lines = expressions(
        written("a", "A=6\\times 4", 20, eq(v("A"), mul(num(6), num(4)))),
        written("b", "=4\\times 6", 40, continued(mul(num(4), num(6)))),
        written("c", "=24", 60, continued(num(24)))
      )
      expect(lines[2]).toEqual(eq(v("A"), num(24)))
    })

    test("should continue a calculation that is not an equality", () => {
      const lines = expressions(written("a", "6\\times 4", 20, mul(num(6), num(4))), written("b", "=24", 40, continued(num(24))))
      expect(lines[1]).toEqual(eq(mul(num(6), num(4)), num(24)))
    })

    test("should mark a side left blank as missing, with no line above to take it from", () => {
      const lines = expressions(written("a", "=24", 20, continued(num(24))), written("b", "A=", 40, { type: "=", operands: [v("A"), null] }))
      expect(lines).toEqual([eq(missing, num(24)), eq(v("A"), missing)])
    })
  })

  test("should accept a JIIX without elements", () => {
    expect(linesFromJiix({})).toEqual([])
    expect(linesFromJiix(undefined)).toEqual([])
  })
})
