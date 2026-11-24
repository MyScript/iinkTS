import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/demo-exercises.js"
import type { TExpression } from "../../../../../examples/assets/js/math/evaluator.js"
import { measureExercise } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/exercises.js"
import { judge } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/judge.js"
import { HINTS, UNFINISHED } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/strings.js"

import { add, eq, missing, mul, num, pi, twoXPlusThreeEqualsSeven, v } from "../../assets/js/math/fixtures"

describe("interactive_canvas_math_tutor/judge", () => {
  const exercise = DEMO_EXERCISES.flatMap((e) => (e.kind === "equation" && e.tex === "2x + 3 = 7" ? [e] : []))[0]
  const toLines = (...expressions: TExpression[]) =>
    expressions.map((expression, index) => ({
      id: `line-${index}`,
      label: "",
      box: { x: 0, y: index * 15, width: 40, height: 10 },
      expression,
    }))
  const statuses = (result: ReturnType<typeof judge>) => result.marks.map((mark) => mark.status)

  const twoXEqualsFour = eq(mul(num(2), v("x")), num(4))
  const twoXEqualsTen = eq(mul(num(2), v("x")), num(10))

  test("should wait before judging a last line still being written", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen), exercise, { finished: false })
    expect(statuses(result)).toEqual(["correct", "pending"])
    expect(result.solved).toBe(false)
  })

  test("should judge the last line once the student is done", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen), exercise, { finished: true })
    expect(statuses(result)).toEqual(["correct", "wrong"])
  })

  test("should wait on a final answer too, its digits may not all be written yet", () => {
    // `x = 12` reads `x = 1` until the 2 is drawn: judging it then flashed a wrong mark
    const lines = toLines(twoXPlusThreeEqualsSeven, twoXEqualsFour, eq(v("x"), num(2)))
    const writing = judge(lines, exercise, { finished: false })
    expect(statuses(writing)).toEqual(["correct", "correct", "pending"])
    expect(writing.solved).toBe(false)

    const done = judge(lines, exercise, { finished: true })
    expect(statuses(done)).toEqual(["correct", "correct", "correct"])
    expect(done.solved).toBe(true)
  })

  test("should explain the first wrong line and leave the next ones unmarked", () => {
    const result = judge(toLines(twoXPlusThreeEqualsSeven, twoXEqualsTen, eq(v("x"), num(5))), exercise, {
      finished: true,
    })
    expect(statuses(result)).toEqual(["correct", "wrong", "after-error"])
    expect(result.marks[1].hint).toBe(HINTS.sign)
    expect(result.marks[0].hint).toBeUndefined()
    expect(result.marks[2].hint).toBeUndefined()
    expect(result.solved).toBe(false)
  })

  test("should fall back on the exercise hint when the mistake is not a typical one", () => {
    const result = judge(toLines(eq(mul(num(2), v("x")), num(57))), exercise, { finished: true })
    expect(result.marks[0].hint).toBe(exercise.hint)
  })

  test("should leave a line it cannot read unchecked", () => {
    const result = judge(toLines(add(num(1), num(2)), twoXEqualsFour), exercise, { finished: false })
    expect(statuses(result)).toEqual(["unchecked", "pending"])
  })

  test("should leave a line with a side left blank unchecked", () => {
    // `x =` paused before its result: the server sends the empty side, it used to stop the judging
    const result = judge(toLines(twoXPlusThreeEqualsSeven, eq(v("x"), missing)), exercise, { finished: true })
    expect(statuses(result)).toEqual(["correct", "unchecked"])
    expect(result.solved).toBe(false)
  })

  test("should not be solved without any line", () => {
    expect(judge([], exercise, { finished: true })).toEqual({ marks: [], solved: false })
  })

  describe("unfinished result", () => {
    const rectangle = measureExercise("r", { type: "rectangle", width: 6, height: 4 }, "perimeter")
    const formula = eq(v("P"), mul(add(num(6), num(4)), num(2)))

    test("should keep the check mark on a line that holds, and ask for the result", () => {
      const result = judge(toLines(formula), rectangle, { finished: true })
      expect(result.marks[0]).toMatchObject({ status: "correct", hint: UNFINISHED("P") })
      expect(result.solved).toBe(false)
    })

    test("should not ask while the line is still being written", () => {
      expect(judge(toLines(formula), rectangle, { finished: false }).marks[0].hint).toBeUndefined()
    })

    test("should drop the request once the result is written", () => {
      const result = judge(toLines(formula, eq(v("P"), num(20))), rectangle, { finished: true })
      expect(result.marks.map((mark) => mark.hint)).toEqual([undefined, undefined])
      expect(result.solved).toBe(true)
    })

    test("should not ask on a line about something else", () => {
      // An intermediate step of an equation is not an unfinished answer
      expect(judge(toLines(twoXPlusThreeEqualsSeven), exercise, { finished: true }).marks[0].hint).toBeUndefined()
    })
  })

  describe("unknown read in the other case", () => {
    // The recognizer reads a quickly written `A` or `P` as `a` or `p` now and then
    const perimeter = measureExercise("p", { type: "rectangle", width: 6, height: 4 }, "perimeter")
    const area = measureExercise("a", { type: "rectangle", width: 6, height: 4 }, "area")

    test("should solve the exercise whatever the case of its unknown", () => {
      expect(judge(toLines(eq(v("p"), num(20))), perimeter, { finished: true }).solved).toBe(true)
      expect(judge(toLines(eq(v("a"), mul(num(6), num(4))), eq(v("a"), num(24))), area, { finished: true })).toMatchObject({
        solved: true,
        marks: [{ status: "correct" }, { status: "correct" }],
      })
      expect(judge(toLines(twoXPlusThreeEqualsSeven, eq(v("X"), num(2))), exercise, { finished: true }).solved).toBe(true)
    })

    test("should still check the line and spot its mistake", () => {
      expect(statuses(judge(toLines(eq(v("a"), num(25))), area, { finished: true }))).toEqual(["wrong"])
    })

    test("should ask for the result, naming the unknown as the exercise does", () => {
      const result = judge(toLines(eq(v("p"), mul(add(num(6), num(4)), num(2)))), perimeter, { finished: true })
      expect(result.marks[0]).toMatchObject({ status: "correct", hint: UNFINISHED("P") })
    })
  })

  describe("typical mistakes of a shape", () => {
    const hintOf = (shape: Parameters<typeof measureExercise>[1], quantity: "perimeter" | "area", written: TExpression) =>
      judge(toLines(written), measureExercise("m", shape, quantity), { finished: true }).marks[0].hint
    const rectangle = { type: "rectangle", width: 3, height: 4 } as const

    test("should spot a perimeter that counts each side once, or that is the area", () => {
      // `P = 3 + 4` is wrong already: the line is checked with P = 14
      expect(hintOf(rectangle, "perimeter", eq(v("P"), add(num(3), num(4))))).toBe(HINTS["half-perimeter"])
      expect(hintOf(rectangle, "perimeter", eq(v("P"), num(12)))).toBe(HINTS.area)
    })

    test("should spot an area that is the perimeter", () => {
      expect(hintOf(rectangle, "area", eq(v("A"), num(14)))).toBe(HINTS["perimeter-for-area"])
    })

    test("should spot a doubled side for a squared one", () => {
      expect(hintOf({ type: "square", side: 5 }, "area", eq(v("A"), num(10)))).toBe(HINTS.square)
    })

    test("should spot a triangle area not halved, and a perimeter missing the hypotenuse", () => {
      const triangle: Parameters<typeof measureExercise>[1] = { type: "right-triangle", legs: [3, 4] }
      expect(hintOf(triangle, "area", eq(v("A"), num(12)))).toBe(HINTS["triangle-half"])
      expect(hintOf(triangle, "perimeter", eq(v("P"), num(7)))).toBe(HINTS["missing-side"])
    })

    test("should spot a circumference computed with the radius instead of the diameter", () => {
      expect(hintOf({ type: "circle", radius: 3 }, "perimeter", eq(v("P"), mul(num(3), pi)))).toBe(
        HINTS["radius-for-diameter"]
      )
    })
  })
})
