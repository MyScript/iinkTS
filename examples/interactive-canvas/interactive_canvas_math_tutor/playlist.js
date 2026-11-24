// @ts-check
/**
 * Which exercise comes next. Kept apart from `exercises.js`, which the demo set imports to build
 * its exercises: the two importing each other would be a cycle, and under native ES modules
 * the demo set would then run before `strings.js` is initialized.
 */

import { DEMO_EXERCISES } from "./demo-exercises.js"
import { generateExercise } from "./exercises.js"

/**
 * The demo exercises of a level come first, in order; generated ones follow.
 * @param {import("./exercises.js").TLevel} level
 * @param {number} played how many exercises of this level were already played
 * @param {() => number} [random]
 * @returns {import("./exercises.js").TExercise}
 */
export function nextExercise(level, played, random = Math.random) {
  const demo = DEMO_EXERCISES.filter((exercise) => exercise.level === level)
  return played < demo.length ? demo[played] : generateExercise(level, random)
}
