// @ts-check
/**
 * Recognizes a few typical mistakes on a wrong line, by comparing the value the student wrote
 * with the value expected, in the light of the line above.
 */

import { evaluate } from "../../assets/js/math/evaluator.js"
import { HINTS } from "./strings.js"

/**
 * @typedef {import("../../assets/js/math/evaluator.js").TExpression} TExpression
 * @typedef {import("../../assets/js/math/evaluator.js").TScope} TScope
 * @typedef {"sign" | "division" | "square-root" | "slip" | TShapeMistake} TMistake
 * @typedef {"half-perimeter" | "area" | "perimeter-for-area" | "square" | "radius-for-diameter" | "triangle-half" | "missing-side"} TShapeMistake
 * @typedef {{ mistake: TMistake, expected: number, written: number }} TTrap a wrong value typical of
 *   one exercise: writing `written` where `expected` was due
 */

const EPSILON = 1e-9

/**
 * @param {number} a
 * @param {number} b
 */
function same(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
}

/**
 * A usable factor or term: computed, and neither zero nor a mere sign
 * @param {number | undefined} value
 * @returns {value is number}
 */
function isMeaningful(value) {
  return value !== undefined && value !== 0
}

/**
 * The terms added or subtracted at the top of an expression, with their sign.
 * @param {TExpression} expression
 * @param {number} [sign]
 * @returns {{ expression: TExpression, sign: number }[]}
 */
function additiveTerms(expression, sign = 1) {
  const operands = expression.operands ?? []
  if (expression.type === "+") return operands.flatMap((operand) => additiveTerms(operand, sign))
  if (expression.type === "-" && operands.length === 1) return additiveTerms(operands[0], -sign)
  if (expression.type === "-") {
    return [
      ...additiveTerms(operands[0], sign),
      ...operands.slice(1).flatMap((operand) => additiveTerms(operand, -sign)),
    ]
  }
  return [{ expression, sign }]
}

/**
 * Constant terms of a line, the ones that can move from one side to the other.
 * @param {TExpression} line
 * @returns {number[]}
 */
function constantTerms(line) {
  return (line.operands ?? [])
    .flatMap((member) => additiveTerms(member))
    .map((term) => evaluate(term.expression))
    .filter(isMeaningful)
}

/**
 * Numeric coefficients of the products in a line (the `2` of `2x`).
 * @param {TExpression} expression
 * @returns {number[]}
 */
function coefficients(expression) {
  const operands = expression.operands ?? []
  const own =
    expression.type === "×"
      ? operands.filter((operand) => operand.type === "number").map((operand) => evaluate(operand))
      : []
  return [...own, ...operands.flatMap(coefficients)].filter(isMeaningful).filter((value) => Math.abs(value) !== 1)
}

/**
 * @param {number} written
 * @param {number} expected
 * @param {TExpression | undefined} previous
 * @returns {boolean}
 */
function isSignMistake(written, expected, previous) {
  if (expected !== 0 && same(written, -expected)) return true
  const terms = previous ? constantTerms(previous) : []
  return terms.some((term) => same(written, expected + 2 * term) || same(written, expected - 2 * term))
}

/**
 * @param {number} written
 * @param {number} expected
 * @param {TExpression | undefined} previous
 * @returns {boolean}
 */
function isDivisionMistake(written, expected, previous) {
  const factors = previous ? coefficients(previous) : []
  return factors.some((factor) => same(written, expected * factor) || same(written, expected * factor * factor))
}

/**
 * @param {number} written
 * @param {number} expected
 */
function isSquareRootMistake(written, expected) {
  return Math.abs(expected) > 1 && same(written, expected * expected)
}

/**
 * @param {number} written
 * @param {number} expected
 */
function isSlip(written, expected) {
  return Math.abs(written - expected) <= Math.max(1, 0.1 * Math.abs(expected))
}

/**
 * The mistake behind a wrong `left = right` line, if it is a typical one. `right` is what the
 * student wrote; `left`, with the solution substituted, is what it should have been.
 * @param {TExpression} line the wrong line
 * @param {TExpression | undefined} previous the line above, if any
 * @param {TScope} solution
 * @param {TTrap[]} [traps] the exercise's own typical mistakes, checked first
 * @returns {TMistake | undefined}
 */
export function diagnose(line, previous, solution, traps = []) {
  if (line.type !== "=" || line.operands?.length !== 2) return undefined
  const expected = evaluate(line.operands[0], solution)
  const written = evaluate(line.operands[1])
  if (expected === undefined || written === undefined) return undefined
  const trap = traps.find((candidate) => same(expected, candidate.expected) && same(written, candidate.written))
  if (trap) return trap.mistake
  if (isSignMistake(written, expected, previous)) return "sign"
  if (isDivisionMistake(written, expected, previous)) return "division"
  if (isSquareRootMistake(written, expected)) return "square-root"
  if (isSlip(written, expected)) return "slip"
  return undefined
}

/**
 * The hint to show: the diagnosed mistake first, then the one written for the exercise.
 * @param {TMistake | undefined} mistake
 * @param {string | undefined} exerciseHint
 * @returns {string}
 */
export function hintFor(mistake, exerciseHint) {
  if (mistake) return HINTS[mistake]
  return exerciseHint ?? HINTS.generic
}
