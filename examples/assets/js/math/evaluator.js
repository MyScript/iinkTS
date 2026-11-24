// @ts-check
/**
 * Arithmetic over the JIIX math expression tree, and the per-line check built on it.
 *
 * A line is checked by substituting the exercise's known solution: `2x + 3 = 7` with `x = 2` gives
 * `7 = 7`. No symbolic algebra is needed, only arithmetic on both sides.
 */

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} TBox
 * @typedef {{
 *   type: string,
 *   label?: string,
 *   value?: number | string,
 *   operands?: TExpression[],
 *   "bounding-box"?: TBox,
 * }} TExpression
 * @typedef {Record<string, number>} TScope
 * @typedef {"correct" | "wrong" | "unchecked"} TVerdict
 * @typedef {{ verdict: TVerdict, left?: number, right?: number }} TLineCheck
 * @typedef {{ variable: string, value: number }} TAnswer
 * @typedef {{ verdicts: TLineCheck[], firstWrong: number, answer?: TAnswer, solved: boolean }} TLinesCheck
 */

const RELATIVE_EPSILON = 1e-9

/** @type {Record<string, number>} */
const SYMBOLS = { π: Math.PI, e: Math.E }

/**
 * The server reads π as a variable that carries a rounded value (`3.14159265`): it is
 * recognised by its label and worth Math.PI, so that `9π` equals the exact solution.
 * @param {TExpression} expression
 * @returns {boolean}
 */
function isPi(expression) {
  return (expression.type === "variable" || expression.type === "symbol") && expression.label === "π"
}

/**
 * @param {number | undefined} value
 * @returns {number | undefined}
 */
function finite(value) {
  return value !== undefined && Number.isFinite(value) ? value : undefined
}

/**
 * @param {(number | undefined)[]} values
 * @returns {values is number[]}
 */
function allDefined(values) {
  return values.every((value) => value !== undefined)
}

/** @type {Record<string, (values: number[]) => number | undefined>} */
const OPERATIONS = {
  "+": (values) => values.reduce((sum, value) => sum + value, 0),
  "-": (values) =>
    values.length === 1 ? -values[0] : values.slice(1).reduce((rest, value) => rest - value, values[0]),
  "×": (values) => values.reduce((product, value) => product * value, 1),
  "/": (values) => (values.length === 2 && values[1] !== 0 ? values[0] / values[1] : undefined),
  fraction: (values) => (values[1] !== 0 ? values[0] / values[1] : undefined),
  superscript: (values) => Math.pow(values[0], values[1]),
  power: (values) => Math.pow(values[0], values[1]),
  "square root": (values) => (values[0] >= 0 ? Math.sqrt(values[0]) : undefined),
  root: (values) => (values[1] !== 0 ? Math.pow(values[0], 1 / values[1]) : undefined),
  group: (values) => (values.length === 1 ? values[0] : undefined),
}

/**
 * The numeric value of an expression, or undefined when it cannot be computed (unknown
 * variable, unsupported operation, division by zero…).
 * @param {TExpression} expression
 * @param {TScope} [scope] values of the variables
 * @returns {number | undefined}
 */
export function evaluate(expression, scope = {}) {
  if (!expression.type) {
    console.warn(`expression unknow: ${expression}`)
    return
  }
  if (isPi(expression)) return Math.PI
  switch (expression.type) {
    case "number":
      return typeof expression.value === "number" ? expression.value : undefined
    case "variable":
      return expression.label !== undefined ? scope[expression.label] : undefined
    case "symbol":
      return expression.label !== undefined ? SYMBOLS[expression.label] : undefined
  }
  const operation = OPERATIONS[expression.type]
  const values = (expression.operands ?? []).map((operand) => evaluate(operand, scope))
  if (!operation || values.length === 0 || !allDefined(values)) return undefined
  return finite(operation(values))
}

/**
 * Half a unit of the last digit written: `0.33` stands for anything that rounds to it.
 * An integer gets no such slack, `3` is not an approximation of `2.6`.
 * @param {TExpression} expression
 * @returns {number}
 */
function roundingTolerance(expression) {
  if (expression.type !== "number" || !expression.label?.includes(".")) return 0
  const decimals = expression.label.split(".")[1].length
  return 0.5 * Math.pow(10, -decimals)
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} tolerance
 */
function areEqual(a, b, tolerance) {
  const epsilon = RELATIVE_EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
  return Math.abs(a - b) <= Math.max(epsilon, tolerance)
}

/**
 * Whether a line holds once the scope is substituted. Every member of a chain
 * (`3² + 4² = 9 + 16 = 25`) must be equal to the next one.
 * @param {TExpression} expression
 * @param {TScope} scope
 * @returns {TLineCheck}
 */
export function checkLine(expression, scope) {
  const members = expression.type === "=" ? (expression.operands ?? []) : []
  const values = members.map((member) => evaluate(member, scope))
  if (members.length < 2 || !allDefined(values)) return { verdict: "unchecked" }
  const holds = values.every(
    (value, index) =>
      index === 0 ||
      areEqual(
        values[index - 1],
        value,
        Math.max(roundingTolerance(members[index - 1]), roundingTolerance(members[index]))
      )
  )
  return { verdict: holds ? "correct" : "wrong", left: values[0], right: values[values.length - 1] }
}

/**
 * @param {TExpression} expression
 * @returns {boolean}
 */
function isInteger(expression) {
  return expression.type === "number" && typeof expression.value === "number" && Number.isInteger(expression.value)
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

/**
 * Whether a value is written as a result, with nothing left to compute: a number (`20`, `-3`,
 * `28.27`), a fraction in lowest terms (`1/2`), or a number of π (`8π`, `π`). `(4 + 6) × 2` or
 * `2 × 4 × π` hold the right value but are not finished.
 * @param {TExpression} expression
 * @returns {boolean}
 */
export function isFinalValue(expression) {
  const operands = expression.operands ?? []
  switch (expression.type) {
    case "number":
      return true
    case "variable":
    case "symbol":
      return isPi(expression)
    case "-":
      return operands.length === 1 && isFinalValue(operands[0])
    case "/":
    case "fraction": {
      const [numerator, denominator] = operands
      return (
        operands.length === 2 &&
        isInteger(numerator) &&
        isInteger(denominator) &&
        Math.abs(Number(denominator.value)) !== 1 &&
        gcd(Number(numerator.value), Number(denominator.value)) === 1
      )
    }
    case "×":
      return operands.length === 2 && operands.some(isPi) && operands.some((operand) => operand.type === "number")
    default:
      return false
  }
}

/**
 * Reads a final answer: a variable alone on the left, a result on the right (`x = -3`, `P = 20`,
 * `A = 9π`). A chain counts by its last member: `P = 12 + 8 = 20`.
 * @param {TExpression} expression
 * @returns {TAnswer | undefined}
 */
export function parseAnswer(expression) {
  const members = expression.type === "=" ? (expression.operands ?? []) : []
  const [left, right] = [members[0], members[members.length - 1]]
  if (members.length < 2 || left.type !== "variable" || left.label === undefined) return undefined
  const value = isFinalValue(right) ? evaluate(right) : undefined
  return value === undefined ? undefined : { variable: left.label, value }
}

/**
 * Checks a reasoning line by line. The exercise is solved when no line is wrong and the last one
 * is the right final answer.
 * @param {TExpression[]} lines in reading order
 * @param {TScope} solution
 * @returns {TLinesCheck}
 */
export function checkLines(lines, solution) {
  const verdicts = lines.map((line) => checkLine(line, solution))
  const firstWrong = verdicts.findIndex((line) => line.verdict === "wrong")
  const last = lines.length - 1
  const answer = last >= 0 ? parseAnswer(lines[last]) : undefined
  const solved = answer !== undefined && firstWrong === -1 && verdicts[last].verdict === "correct"
  return { verdicts, firstWrong, answer, solved }
}
