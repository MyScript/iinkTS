// @ts-check
/**
 * Turns the lines a student wrote into what the page shows: a mark per line, a hint on the first
 * wrong one, and whether the exercise is solved.
 *
 * The last line is only judged once the student paused or pressed Check. Judging it while it is
 * being written flashes a red mark on `2x =` before the right side exists, and even a line that
 * already reads as a final answer may not be: `x = 12` reads `x = 1` until the 2 is drawn.
 *
 * A reasoning that holds but stops before the result (`P = (4 + 6) × 2`) is not solved: its last
 * line keeps its check mark and asks for the calculation to be finished.
 */

import { checkLines } from "../../assets/js/math/evaluator.js"
import { isSolved } from "./exercises.js"
import { diagnose, hintFor } from "./hints.js"
import { UNFINISHED } from "./strings.js"

/**
 * @typedef {import("../../assets/js/math/evaluator.js").TExpression} TExpression
 * @typedef {import("../../assets/js/math/lines.js").TLine} TLine
 * @typedef {import("./exercises.js").TExercise} TExercise
 * @typedef {"correct" | "wrong" | "pending" | "unchecked" | "after-error"} TMarkStatus
 * @typedef {{ line: TLine, status: TMarkStatus, hint?: string }} TMark
 * @typedef {{ marks: TMark[], solved: boolean }} TJudgement
 */

/**
 * The recognizer reads a quickly written `A` or `P` as `a` or `p` now and then: in either case
 * the letter stands for the unknown the exercise asks for.
 * @param {TExpression} expression
 * @param {string} variable
 * @returns {TExpression}
 */
function spelledAs(expression, variable) {
  if (expression.type === "variable" && expression.label?.toLowerCase() === variable.toLowerCase()) {
    return { ...expression, label: variable }
  }
  const { operands } = expression
  return operands ? { ...expression, operands: operands.map((operand) => spelledAs(operand, variable)) } : expression
}

/**
 * The line gives the unknown asked for, `P = …`, whatever its right side.
 * @param {TExpression | undefined} expression
 * @param {string} variable
 */
function isAbout(expression, variable) {
  const left = expression?.type === "=" ? expression.operands?.[0] : undefined
  return left?.type === "variable" && left.label === variable
}

/**
 * @param {TLine} line
 * @param {TMarkStatus} status
 * @param {string} [hint]
 * @returns {TMark}
 */
function markOf(line, status, hint) {
  return hint === undefined ? { line, status } : { line, status, hint }
}

/**
 * @param {TLine[]} lines in reading order
 * @param {TExercise} exercise
 * @param {{ finished: boolean }} options `finished`: the student is done with the last line
 * @returns {TJudgement}
 */
export function judge(lines, exercise, { finished }) {
  const { variable } = exercise.answer
  const expressions = lines.map((line) => spelledAs(line.expression, variable))
  const check = checkLines(expressions, exercise.solution)
  const lastPending = !finished
  let errorSeen = false
  const marks = lines.map((line, index) => {
    if (errorSeen) return markOf(line, "after-error")
    if (lastPending && index === lines.length - 1) return markOf(line, "pending")
    const { verdict } = check.verdicts[index]
    if (verdict !== "wrong") return markOf(line, verdict)
    errorSeen = true
    const mistake = diagnose(expressions[index], expressions[index - 1], exercise.solution, exercise.traps)
    return markOf(line, "wrong", hintFor(mistake, exercise.hint))
  })
  const solved = !lastPending && isSolved(exercise, check)
  const last = marks[marks.length - 1]
  if (!solved && last?.status === "correct" && isAbout(expressions[expressions.length - 1], variable)) {
    marks[marks.length - 1] = markOf(last.line, "correct", UNFINISHED(variable))
  }
  return { marks, solved }
}
