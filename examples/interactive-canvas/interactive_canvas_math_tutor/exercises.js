// @ts-check
/**
 * Exercises of the Math Tutor: how they are built, generated and picked.
 *
 * Algebra 1: one-step equation (`x + b = c` or `ax = c`).
 * Algebra 2: two-step equation (`ax + b = c`), solved over several lines.
 * Geometry 1: a shape next to the prompt, its perimeter to find.
 * Geometry 2: a shape next to the prompt, its area to find.
 *
 * Every exercise ends on its result: `P = 20`, not `P = (4 + 6) × 2`.
 */

import { measure } from "./shapes.js"
import { EXERCISE_HINTS, FORMULA_HINTS, PROMPTS } from "./strings.js"

/**
 * @typedef {import("../../assets/js/math/evaluator.js").TScope} TScope
 * @typedef {import("../../assets/js/math/evaluator.js").TAnswer} TAnswer
 * @typedef {import("../../assets/js/math/evaluator.js").TLinesCheck} TLinesCheck
 * @typedef {import("./hints.js").TTrap} TTrap
 * @typedef {import("./shapes.js").TShapeSpec} TShapeSpec
 * @typedef {import("./shapes.js").TQuantity} TQuantity
 * @typedef {"algebra" | "geometry"} TTrack
 * @typedef {"algebra-1" | "algebra-2" | "geometry-1" | "geometry-2"} TLevel
 * @typedef {{ id: string, level: TLevel, prompt: string, hint: string, solution: TScope, answer: TAnswer, traps?: TTrap[] }} TExerciseBase
 * @typedef {TExerciseBase & { kind: "equation", tex: string, params: { a: number, b: number, c: number } }} TEquationExercise
 * @typedef {TExerciseBase & { kind: "measure", shape: TShapeSpec, quantity: TQuantity }} TMeasureExercise
 * @typedef {TEquationExercise | TMeasureExercise} TExercise
 */

/** The levels in the order the page lists them, grouped by track */
export const LEVELS = /** @type {const} */ ([
  { level: "algebra-1", track: "algebra", number: 1 },
  { level: "algebra-2", track: "algebra", number: 2 },
  { level: "geometry-1", track: "geometry", number: 1 },
  { level: "geometry-2", track: "geometry", number: 2 },
])

/** Integer-sided right triangles, small enough to compute by hand */
export const PYTHAGOREAN_TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
]

/** Triangles that are neither right nor flat */
export const SCALENE_TRIANGLES = /** @type {[number, number, number][]} */ ([
  [5, 6, 7],
  [6, 4, 8],
  [7, 8, 9],
  [8, 5, 5],
  [10, 6, 7],
])

/** Side, width or radius of a generated shape */
export const SHAPE_SIZES = { min: 2, max: 12 }

let generatedCount = 0

/**
 * `ax + b = c`, written the way a teacher would: no `1x`, no `+ -3`, no `+ 0`.
 * @param {number} a
 * @param {number} b
 * @param {number} c
 */
export function formatLinear(a, b, c) {
  const unknown = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`
  const constant = b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${-b}`
  return `${unknown}${constant} = ${c}`
}

/**
 * @param {string} id
 * @param {"algebra-1" | "algebra-2"} level
 * @param {number} a
 * @param {number} b
 * @param {number} x the solution
 * @param {string} hint
 * @returns {TEquationExercise}
 */
export function linearExercise(id, level, a, b, x, hint) {
  const c = a * x + b
  return {
    id,
    level,
    kind: "equation",
    prompt: PROMPTS.equation,
    tex: formatLinear(a, b, c),
    params: { a, b, c },
    solution: { x },
    answer: { variable: "x", value: x },
    hint,
  }
}

/**
 * The perimeter is `P` on Geometry 1, the area `A` on Geometry 2: the student writes no other
 * letter, so `a` and `A` never have to be told apart in handwriting.
 * @param {string} id
 * @param {TShapeSpec} shape
 * @param {TQuantity} quantity
 * @param {string} [hint] defaults to the formula
 * @returns {TMeasureExercise}
 */
export function measureExercise(id, shape, quantity, hint) {
  const variable = quantity === "area" ? "A" : "P"
  const { value, traps } = measure(shape, quantity)
  return {
    id,
    level: quantity === "perimeter" ? "geometry-1" : "geometry-2",
    kind: "measure",
    prompt: PROMPTS.measure(shape.type, quantity),
    shape,
    quantity,
    solution: { [variable]: value },
    answer: { variable, value },
    hint: hint ?? FORMULA_HINTS[shape.type][quantity] ?? "",
    traps,
  }
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} random
 */
function randomInt(min, max, random) {
  return min + Math.floor(random() * (max - min + 1))
}

/**
 * @template T
 * @param {readonly T[]} items
 * @param {() => number} random
 * @returns {T}
 */
function pick(items, random) {
  return items[randomInt(0, items.length - 1, random)]
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} random
 */
function randomNonZero(min, max, random) {
  const value = randomInt(min, max - 1, random)
  return value >= 0 ? value + 1 : value
}

/**
 * @param {"algebra-1" | "algebra-2"} level
 * @param {() => number} random
 * @returns {TEquationExercise}
 */
function generateLinear(level, random) {
  const id = `generated-${++generatedCount}`
  if (level === "algebra-2") {
    const a = randomInt(2, 9, random)
    const b = randomNonZero(-9, 9, random)
    return linearExercise(id, level, a, b, randomNonZero(-9, 9, random), EXERCISE_HINTS.twoSteps(a, b))
  }
  if (random() < 0.5) {
    const b = randomNonZero(-12, 12, random)
    return linearExercise(id, level, 1, b, randomNonZero(-12, 12, random), EXERCISE_HINTS.moveConstant(b))
  }
  const a = randomInt(2, 9, random)
  return linearExercise(id, level, a, 0, randomNonZero(-12, 12, random), EXERCISE_HINTS.divide(a))
}

/**
 * A rectangle always has two different sides: with equal ones it is the square.
 * @param {readonly TShapeSpec["type"][]} types
 * @param {() => number} random
 * @returns {TShapeSpec}
 */
function randomShape(types, random) {
  const { min, max } = SHAPE_SIZES
  switch (pick(types, random)) {
    case "square":
      return { type: "square", side: randomInt(min, max, random) }
    case "rectangle": {
      const width = randomInt(min, max, random)
      const other = randomInt(min, max - 1, random)
      return { type: "rectangle", width, height: other >= width ? other + 1 : other }
    }
    case "circle":
      return { type: "circle", radius: randomInt(1, 10, random) }
    case "right-triangle": {
      const [a, b] = pick(PYTHAGOREAN_TRIPLES, random)
      return { type: "right-triangle", legs: [a, b] }
    }
    default:
      return { type: "triangle", sides: pick(SCALENE_TRIANGLES, random) }
  }
}

/** Every shape has a perimeter to find */
const PERIMETER_SHAPES = /** @type {const} */ (["square", "rectangle", "circle", "right-triangle", "triangle"])
/** A triangle that is not right gives no height: its area cannot be found from its sides alone */
const AREA_SHAPES = /** @type {const} */ (["square", "rectangle", "circle", "right-triangle"])

/**
 * @param {TLevel} level
 * @param {() => number} [random]
 * @returns {TExercise}
 */
export function generateExercise(level, random = Math.random) {
  if (level === "algebra-1" || level === "algebra-2") return generateLinear(level, random)
  const id = `generated-${++generatedCount}`
  return level === "geometry-1"
    ? measureExercise(id, randomShape(PERIMETER_SHAPES, random), "perimeter")
    : measureExercise(id, randomShape(AREA_SHAPES, random), "area")
}

/**
 * Solved when the reasoning holds and ends on the exercise's own unknown.
 * @param {TExercise} exercise
 * @param {TLinesCheck} check
 */
export function isSolved(exercise, check) {
  return check.solved && check.answer?.variable === exercise.answer.variable
}
