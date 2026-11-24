// @ts-check
/**
 * The exercises played first, in this order, for a guided demo. Each level then continues with
 * generated exercises.
 */

import { linearExercise, measureExercise } from "./exercises.js"

/** @type {import("./exercises.js").TExercise[]} */
export const DEMO_EXERCISES = [
  linearExercise("demo-algebra-1-1", "algebra-1", 1, 5, 7, "Which number plus 5 gives 12? Subtract 5 from both sides."),
  linearExercise("demo-algebra-1-2", "algebra-1", 3, 0, 6, "3 times what gives 18? Divide both sides by 3."),
  linearExercise("demo-algebra-2-1", "algebra-2", 2, 3, 2, "Get 2x alone first, then find x."),
  linearExercise("demo-algebra-2-2", "algebra-2", 5, -4, 3, "Move the -4 to the other side first: it becomes +4."),
  measureExercise("demo-geometry-1-1", { type: "rectangle", width: 6, height: 4 }, "perimeter"),
  measureExercise("demo-geometry-1-2", { type: "square", side: 5 }, "perimeter"),
  measureExercise("demo-geometry-1-3", { type: "triangle", sides: [5, 6, 7] }, "perimeter"),
  measureExercise(
    "demo-geometry-1-4",
    { type: "circle", radius: 3 },
    "perimeter",
    "P = 2πr = 2 × π × 3: finish with P = 6π."
  ),
  measureExercise("demo-geometry-1-5", { type: "right-triangle", legs: [3, 4] }, "perimeter"),
  measureExercise("demo-geometry-2-1", { type: "rectangle", width: 6, height: 4 }, "area"),
  measureExercise("demo-geometry-2-2", { type: "square", side: 5 }, "area"),
  measureExercise("demo-geometry-2-3", { type: "right-triangle", legs: [6, 8] }, "area"),
  measureExercise("demo-geometry-2-4", { type: "circle", radius: 3 }, "area", "A = πr² = π × 3²: finish with A = 9π."),
]
