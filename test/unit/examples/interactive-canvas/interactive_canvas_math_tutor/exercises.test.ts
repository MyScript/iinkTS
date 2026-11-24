import { DEMO_EXERCISES } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/demo-exercises.js"
import {
  formatLinear,
  generateExercise,
  isSolved,
  LEVELS,
  measureExercise,
  SHAPE_SIZES,
} from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/exercises.js"
import type { TExercise } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/exercises.js"
import { checkLines } from "../../../../../examples/assets/js/math/evaluator.js"
import { measure } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/shapes.js"

import { add, eq, mul, num, op, pi, twoXPlusThreeEqualsSeven, v } from "../../assets/js/math/fixtures"

/** Deterministic stand-in for Math.random, cycling through the given values */
function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length]
}

/** The exercise can be solved as stated: its answer is the one the statement leads to */
function expectConsistent(exercise: TExercise): void {
  expect(exercise.prompt.length).toBeGreaterThan(0)
  expect(exercise.hint.length).toBeGreaterThan(0)
  switch (exercise.kind) {
    case "equation": {
      const { a, b, c } = exercise.params
      expect(a * exercise.solution.x + b).toBe(c)
      expect(exercise.answer).toEqual({ variable: "x", value: exercise.solution.x })
      expect(exercise.tex).toBe(formatLinear(a, b, c))
      return
    }
    case "measure": {
      const { value } = measure(exercise.shape, exercise.quantity)
      expect(exercise.answer).toEqual({ variable: exercise.quantity === "area" ? "A" : "P", value })
      expect(exercise.solution).toEqual({ [exercise.answer.variable]: value })
      expect(exercise.level).toBe(exercise.quantity === "perimeter" ? "geometry-1" : "geometry-2")
    }
  }
}

describe("interactive_canvas_math_tutor/exercises", () => {
  describe("formatLinear", () => {
    test("should write the equation the way a teacher would", () => {
      expect(formatLinear(2, 3, 7)).toBe("2x + 3 = 7")
      expect(formatLinear(5, -4, 11)).toBe("5x - 4 = 11")
      expect(formatLinear(1, 5, 12)).toBe("x + 5 = 12")
      expect(formatLinear(-1, 2, -3)).toBe("-x + 2 = -3")
      expect(formatLinear(3, 0, 18)).toBe("3x = 18")
    })
  })

  describe("demo set", () => {
    test("should cover every level, in the order the page lists them", () => {
      const order = LEVELS.map((entry) => entry.level)
      const levels = DEMO_EXERCISES.map((exercise) => exercise.level)
      expect(levels).toEqual([...levels].sort((x, y) => order.indexOf(x) - order.indexOf(y)))
      expect(new Set(levels)).toEqual(new Set(order))
    })

    test("should ask for the perimeter, then the area, of every kind of shape", () => {
      const asked = (quantity: string) =>
        new Set(DEMO_EXERCISES.flatMap((e) => (e.kind === "measure" && e.quantity === quantity ? [e.shape.type] : [])))
      expect(asked("perimeter")).toEqual(new Set(["square", "rectangle", "circle", "right-triangle", "triangle"]))
      expect(asked("area")).toEqual(new Set(["square", "rectangle", "circle", "right-triangle"]))
    })

    test("should only hold self-consistent exercises with unique ids", () => {
      DEMO_EXERCISES.forEach(expectConsistent)
      expect(new Set(DEMO_EXERCISES.map((exercise) => exercise.id)).size).toBe(DEMO_EXERCISES.length)
    })
  })

  describe("LEVELS", () => {
    test("should number the levels of each track from 1", () => {
      expect(LEVELS.map((entry) => `${entry.track} ${entry.number}`)).toEqual([
        "algebra 1",
        "algebra 2",
        "geometry 1",
        "geometry 2",
      ])
    })
  })

  describe("measureExercise", () => {
    test("should ask for P or A, never another letter", () => {
      expect(measureExercise("p", { type: "square", side: 5 }, "perimeter").answer).toEqual({ variable: "P", value: 20 })
      expect(measureExercise("a", { type: "square", side: 5 }, "area").answer).toEqual({ variable: "A", value: 25 })
    })

    test("should default to the formula of the shape as its hint", () => {
      expect(measureExercise("c", { type: "circle", radius: 3 }, "area").hint).toBe("A = πr².")
    })
  })

  describe("generateExercise", () => {
    test("should generate one-step equations on Algebra 1", () => {
      const exercise = generateExercise("algebra-1", sequence(0.5))
      expect(exercise.level).toBe("algebra-1")
      expect(exercise.kind === "equation" && (exercise.params.a === 1 || exercise.params.b === 0)).toBe(true)
    })

    test("should generate two-step equations on Algebra 2", () => {
      const exercise = generateExercise("algebra-2", sequence(0.9, 0.2, 0.7))
      expect(exercise.kind === "equation" && exercise.params.a !== 1 && exercise.params.b !== 0).toBe(true)
    })

    test("should ask for a perimeter on Geometry 1, an area on Geometry 2", () => {
      const perimeter = generateExercise("geometry-1", sequence(0.3, 0.5))
      expect(perimeter.kind === "measure" && perimeter.quantity).toBe("perimeter")
      const area = generateExercise("geometry-2", sequence(0.3, 0.5))
      expect(area.kind === "measure" && area.quantity).toBe("area")
    })

    test("should give a rectangle two different sides", () => {
      // 0.3 picks the rectangle, then the largest width and the largest other side
      const exercise = generateExercise("geometry-1", sequence(0.3, 0.99, 0.99))
      expect(exercise.kind === "measure" && exercise.shape).toEqual({
        type: "rectangle",
        width: SHAPE_SIZES.max,
        height: SHAPE_SIZES.max - 1,
      })
    })

    test("should never ask for the area of a triangle that is not right", () => {
      for (let seed = 0; seed < 50; seed++) {
        const exercise = generateExercise("geometry-2", sequence((seed * 0.37) % 1, (seed * 0.61) % 1))
        expect(exercise.kind === "measure" && exercise.shape.type).not.toBe("triangle")
      }
    })

    test("should always generate self-consistent exercises", () => {
      for (let seed = 0; seed < 200; seed++) {
        const random = sequence(((seed * 0.618) % 1) + 0, ((seed * 0.377) % 1) + 0, ((seed * 0.143) % 1) + 0)
        LEVELS.forEach(({ level }) => expectConsistent(generateExercise(level, random)))
      }
    })

    test("should give each generated exercise its own id", () => {
      const random = sequence(0.1, 0.5, 0.9, 0.3)
      expect(generateExercise("algebra-2", random).id).not.toBe(generateExercise("algebra-2", random).id)
    })
  })

  describe("isSolved", () => {
    const exercise = DEMO_EXERCISES.find((e) => e.kind === "equation" && e.tex === "2x + 3 = 7")!

    test("should accept a correct reasoning ending on the answer", () => {
      const lines = [twoXPlusThreeEqualsSeven, eq(mul(num(2), v("x")), num(4)), eq(v("x"), num(2))]
      expect(isSolved(exercise, checkLines(lines, exercise.solution))).toBe(true)
    })

    test("should refuse an answer to another variable", () => {
      // y = 2 holds nothing: y is not the unknown of this exercise
      expect(isSolved(exercise, checkLines([eq(v("y"), num(2))], exercise.solution))).toBe(false)
    })

    test("should only accept a perimeter once it is computed", () => {
      const rectangle = measureExercise("r", { type: "rectangle", width: 6, height: 4 }, "perimeter")
      const formula = eq(v("P"), mul(add(num(6), num(4)), num(2)))
      expect(isSolved(rectangle, checkLines([formula], rectangle.solution))).toBe(false)
      expect(isSolved(rectangle, checkLines([formula, eq(v("P"), num(20))], rectangle.solution))).toBe(true)
      // A chain counts by its last member
      expect(isSolved(rectangle, checkLines([eq(v("P"), add(num(12), num(8)), num(20))], rectangle.solution))).toBe(true)
    })

    test("should accept the area of a circle with π kept or rounded", () => {
      const circle = measureExercise("c", { type: "circle", radius: 3 }, "area")
      const withPi = [eq(v("A"), mul(pi, op("power", num(3), num(2)))), eq(v("A"), mul(num(9), pi))]
      expect(isSolved(circle, checkLines(withPi, circle.solution))).toBe(true)
      // π can stay, but the rest must be computed: π × 3² is not finished
      expect(isSolved(circle, checkLines(withPi.slice(0, 1), circle.solution))).toBe(false)
      expect(isSolved(circle, checkLines([eq(v("A"), num(28.27, "28.27"))], circle.solution))).toBe(true)
      expect(isSolved(circle, checkLines([eq(v("A"), num(28))], circle.solution))).toBe(false)
    })
  })
})

