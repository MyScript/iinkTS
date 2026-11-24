// @ts-check
/**
 * The shapes of the Geometry track, drawn next to the prompt with their values, and what can be
 * asked about them: each shape knows how to compute its perimeter and its area, and which wrong
 * values are typical of it.
 */

import { FIGURE_UI } from "./strings.js"

/**
 * @typedef {{ x: number, y: number }} TPoint
 * @typedef {{ points: TPoint[], closed: boolean }} TPath
 * @typedef {{ center: TPoint, radius: number }} TCircle
 * @typedef {{ at: TPoint, text: string, away: TPoint }} TLabel drawn next to `at`, pushed away from `away`
 * @typedef {{ corner: TPoint, sides: [TPoint, TPoint] }} TRightAngle
 * @typedef {{ paths: TPath[], circles: TCircle[], dots: TPoint[], labels: TLabel[], rightAngles: TRightAngle[] }} TFigure
 * @typedef {(
 *   | { type: "square", side: number }
 *   | { type: "rectangle", width: number, height: number }
 *   | { type: "circle", radius: number }
 *   | { type: "right-triangle", legs: [number, number] }
 *   | { type: "triangle", sides: [number, number, number] }
 * )} TShapeSpec
 * @typedef {"perimeter" | "area"} TQuantity
 * @typedef {import("./hints.js").TTrap} TTrap
 */

const SVG_NS = "http://www.w3.org/2000/svg"
/** Size of the longest side of a shape next to the prompt, in pixels */
const PROMPT_SIZE = 72
/** Room around a shape next to the prompt, for its labels */
const PROMPT_MARGIN = 24
/** How far a label sits from what it names, in pixels */
const LABEL_OFFSET = 12
/** Side of the right-angle square, in pixels */
const RIGHT_ANGLE_SIZE = 8

/** @returns {TFigure} */
function emptyFigure() {
  return { paths: [], circles: [], dots: [], labels: [], rightAngles: [] }
}

/**
 * @param {TPoint} a
 * @param {TPoint} b
 * @returns {TPoint}
 */
function middle(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * @param {TPoint[]} points
 * @returns {TPoint}
 */
function centroid(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

/**
 * A closed polygon with a value written next to some of its sides.
 * @param {TPoint[]} corners
 * @param {(string | undefined)[]} sideLabels label of side `i`, from corner `i` to corner `i + 1`
 * @returns {TFigure}
 */
function polygonFigure(corners, sideLabels) {
  const center = centroid(corners)
  const figure = emptyFigure()
  figure.paths.push({ points: corners, closed: true })
  sideLabels.forEach((text, side) => {
    if (text !== undefined) {
      figure.labels.push({ at: middle(corners[side], corners[(side + 1) % corners.length]), text, away: center })
    }
  })
  return figure
}

/**
 * A triangle with the given sides, the first one as its base.
 * @param {[number, number, number]} sides base, then the sides from its right and left ends
 * @returns {TPoint[]}
 */
export function triangleCorners([base, right, left]) {
  const x = (left * left - right * right + base * base) / (2 * base)
  return [
    { x: 0, y: 0 },
    { x: base, y: 0 },
    { x, y: -Math.sqrt(Math.max(0, left * left - x * x)) },
  ]
}

/**
 * The figure of a Geometry 2 shape, in the shape's own units.
 * @param {TShapeSpec} shape
 * @returns {TFigure}
 */
export function shapeFigure(shape) {
  switch (shape.type) {
    case "square":
    case "rectangle": {
      const [width, height] = shape.type === "square" ? [shape.side, shape.side] : [shape.width, shape.height]
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ]
      const figure = polygonFigure(corners, [undefined, undefined, String(width), String(height)])
      figure.rightAngles.push({ corner: corners[3], sides: [corners[0], corners[2]] })
      return figure
    }
    case "circle": {
      const center = { x: 0, y: 0 }
      const edge = { x: shape.radius, y: 0 }
      const figure = emptyFigure()
      figure.circles.push({ center, radius: shape.radius })
      figure.dots.push(center)
      figure.paths.push({ points: [center, edge], closed: false })
      figure.labels.push({
        at: middle(center, edge),
        text: FIGURE_UI.radius(shape.radius),
        away: { x: shape.radius / 2, y: 1 },
      })
      return figure
    }
    case "right-triangle": {
      const [vertical, horizontal] = shape.legs
      const corners = [
        { x: 0, y: 0 },
        { x: 0, y: vertical },
        { x: horizontal, y: vertical },
      ]
      const figure = polygonFigure(corners, [String(vertical), String(horizontal), undefined])
      figure.rightAngles.push({ corner: corners[1], sides: [corners[0], corners[2]] })
      return figure
    }
    case "triangle":
      return polygonFigure(triangleCorners(shape.sides), shape.sides.map(String))
  }
}

/**
 * @param {TShapeSpec} shape
 * @returns {number}
 */
function hypotenuse(shape) {
  return shape.type === "right-triangle" ? Math.hypot(...shape.legs) : 0
}

/**
 * The value asked for, and the wrong values typical of this shape: a student who writes one of
 * them made the mistake it names.
 * @param {TShapeSpec} shape
 * @param {TQuantity} quantity
 * @returns {{ value: number, traps: TTrap[] }}
 */
export function measure(shape, quantity) {
  /**
   * @param {number} value
   * @param {[TTrap["mistake"], number][]} wrong
   */
  const result = (value, wrong) => ({
    value,
    traps: wrong.map(([mistake, written]) => ({ mistake, expected: value, written })),
  })
  switch (shape.type) {
    case "square": {
      const { side } = shape
      return quantity === "perimeter"
        ? result(4 * side, [["area", side * side]])
        : result(side * side, [
            ["perimeter-for-area", 4 * side],
            ["square", 2 * side],
          ])
    }
    case "rectangle": {
      const { width, height } = shape
      return quantity === "perimeter"
        ? result(2 * (width + height), [
            ["half-perimeter", width + height],
            ["area", width * height],
          ])
        : result(width * height, [["perimeter-for-area", 2 * (width + height)]])
    }
    case "circle": {
      const { radius } = shape
      return quantity === "perimeter"
        ? result(2 * Math.PI * radius, [
            ["radius-for-diameter", Math.PI * radius],
            ["area", Math.PI * radius * radius],
          ])
        : result(Math.PI * radius * radius, [["perimeter-for-area", 2 * Math.PI * radius]])
    }
    case "right-triangle": {
      const [a, b] = shape.legs
      return quantity === "perimeter"
        ? result(a + b + hypotenuse(shape), [["missing-side", a + b]])
        : result((a * b) / 2, [
            ["triangle-half", a * b],
            ["perimeter-for-area", a + b + hypotenuse(shape)],
          ])
    }
    case "triangle":
      return result(
        shape.sides.reduce((sum, side) => sum + side, 0),
        []
      )
  }
}

/**
 * @param {string} name
 * @param {Record<string, string | number>} attributes
 * @param {string} [text]
 * @returns {SVGElement}
 */
function svgElement(name, attributes, text) {
  const element = document.createElementNS(SVG_NS, name)
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)))
  if (text !== undefined) element.textContent = text
  return element
}

/**
 * @param {TPoint} from
 * @param {TPoint} towards
 * @param {number} length
 * @returns {TPoint} the vector of `length` from `from` towards `towards`
 */
function toward(from, towards, length) {
  const distance = Math.hypot(towards.x - from.x, towards.y - from.y) || 1
  return { x: ((towards.x - from.x) / distance) * length, y: ((towards.y - from.y) / distance) * length }
}

/** @param {TPoint[]} points */
function pointsAttribute(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

/**
 * Draws a figure into an SVG element.
 * @param {SVGElement} svg
 * @param {TFigure} figure
 * @param {(point: TPoint) => TPoint} project figure units to SVG pixels
 */
function drawFigure(svg, figure, project) {
  figure.paths.forEach((path) => {
    const points = pointsAttribute(path.points.map(project))
    svg.append(svgElement(path.closed ? "polygon" : "polyline", { class: "tutor-given-shape", points }))
  })
  figure.circles.forEach(({ center, radius }) => {
    const middlePoint = project(center)
    const edge = project({ x: center.x + radius, y: center.y })
    const r = Math.hypot(edge.x - middlePoint.x, edge.y - middlePoint.y)
    svg.append(svgElement("circle", { class: "tutor-given-shape", cx: middlePoint.x, cy: middlePoint.y, r }))
  })
  figure.dots
    .map(project)
    .forEach(({ x, y }) => svg.append(svgElement("circle", { class: "tutor-given-dot", cx: x, cy: y, r: 3 })))
  figure.rightAngles.forEach(({ corner, sides }) => {
    const at = project(corner)
    const u = toward(at, project(sides[0]), RIGHT_ANGLE_SIZE)
    const w = toward(at, project(sides[1]), RIGHT_ANGLE_SIZE)
    const square = [
      { x: at.x + u.x, y: at.y + u.y },
      { x: at.x + u.x + w.x, y: at.y + u.y + w.y },
      { x: at.x + w.x, y: at.y + w.y },
    ]
    svg.append(svgElement("polyline", { class: "tutor-given-right-angle", points: pointsAttribute(square) }))
  })
  figure.labels.forEach(({ at, text, away }) => {
    const point = project(at)
    const push = toward(project(away), point, LABEL_OFFSET)
    const attributes = {
      x: point.x + push.x,
      y: point.y + push.y,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    }
    svg.append(svgElement("text", { class: "tutor-given-label", ...attributes }, text))
  })
}

/**
 * The shape next to the prompt, its longest side always the same size.
 * @param {TShapeSpec} shape
 * @returns {SVGElement}
 */
export function shapeSvg(shape) {
  const figure = shapeFigure(shape)
  const points = [
    ...figure.paths.flatMap((path) => path.points),
    ...figure.circles.flatMap(({ center, radius }) => [
      { x: center.x - radius, y: center.y - radius },
      { x: center.x + radius, y: center.y + radius },
    ]),
  ]
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const [left, top] = [Math.min(...xs), Math.min(...ys)]
  const scale = PROMPT_SIZE / Math.max(Math.max(...xs) - left, Math.max(...ys) - top)
  const width = (Math.max(...xs) - left) * scale + 2 * PROMPT_MARGIN
  const height = (Math.max(...ys) - top) * scale + 2 * PROMPT_MARGIN
  const svg = svgElement("svg", {
    class: "tutor-given-figure",
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: "img",
    "aria-label": FIGURE_UI.describe(shape),
  })
  drawFigure(svg, figure, (point) => ({
    x: (point.x - left) * scale + PROMPT_MARGIN,
    y: (point.y - top) * scale + PROMPT_MARGIN,
  }))
  return svg
}
