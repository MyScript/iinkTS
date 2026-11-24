// @ts-check
/**
 * The lines a student wrote, read from the JIIX export.
 *
 * The server sends one `Math` element per written line (IIC-2096 spike), not one block whose
 * `expressions` would be the lines, and in no guaranteed order: the reading order comes from
 * the boxes.
 *
 * A side not written yet comes as an empty slot: `A =` before its result. A line written without
 * its left side, `= 24` under `A = 6 × 4`, goes on from the line above and reads `A = 24`.
 */

/**
 * @typedef {import("./evaluator.js").TBox} TBox
 * @typedef {import("./evaluator.js").TExpression} TExpression
 * @typedef {Omit<TExpression, "operands"> & { operands?: (TJiixExpression | null)[] }} TJiixExpression
 * @typedef {{ type: string, id: string, label?: string, "bounding-box"?: TBox, expressions?: TJiixExpression[] }} TJiixElement
 * @typedef {{ elements?: TJiixElement[] }} TJiix
 * @typedef {{ id: string, label: string, box: TBox, expression: TExpression }} TLine
 * @typedef {Omit<TLine, "expression"> & { expression: TJiixExpression }} TWrittenLine
 */

/**
 * Top to bottom; two lines whose tops are less than half a line apart sit on the same row and
 * read left to right.
 * @param {{ box: TBox }} a
 * @param {{ box: TBox }} b
 */
function readingOrder(a, b) {
  const sameRow = Math.abs(a.box.y - b.box.y) < Math.min(a.box.height, b.box.height) / 2
  return sameRow ? a.box.x - b.box.x : a.box.y - b.box.y
}

/**
 * A side left blank cannot be computed: the evaluator gets an expression it does not know.
 * @returns {TExpression}
 */
function missing() {
  return { type: "missing" }
}

/**
 * @param {TJiixExpression | null | undefined} expression
 * @returns {TExpression}
 */
function complete(expression) {
  if (!expression) return missing()
  const { operands, ...node } = expression
  return operands ? { ...node, operands: operands.map(complete) } : node
}

/**
 * @param {TJiixExpression} expression
 * @param {TExpression | undefined} above the line above, already read
 * @returns {TExpression}
 */
function continued(expression, above) {
  const [left, ...rest] = expression.operands ?? []
  if (expression.type !== "=" || left !== null || !above) return complete(expression)
  const aboveLeft = above.type === "=" ? above.operands?.[0] : above
  return { ...complete(expression), operands: [aboveLeft ?? missing(), ...rest.map(complete)] }
}

/**
 * @param {TJiixElement} element
 * @returns {TWrittenLine | undefined}
 */
function toLine(element) {
  const expression = element.expressions?.[0]
  const box = element["bounding-box"]
  if (element.type !== "Math" || !expression || !box) return undefined
  return { id: element.id, label: element.label ?? "", box, expression }
}

/**
 * @param {TWrittenLine | undefined} line
 * @returns {line is TWrittenLine}
 */
function isLine(line) {
  return line !== undefined
}

/**
 * @param {TJiix | undefined} jiix
 * @returns {TLine[]}
 */
export function linesFromJiix(jiix) {
  const written = (jiix?.elements ?? []).map(toLine).filter(isLine).sort(readingOrder)
  /** @type {TLine[]} */
  const lines = []
  written.forEach(({ expression, ...line }) =>
    lines.push({ ...line, expression: continued(expression, lines[lines.length - 1]?.expression) })
  )
  return lines
}
