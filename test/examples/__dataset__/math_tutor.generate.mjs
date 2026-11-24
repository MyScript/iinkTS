// Generates the Math Tutor E2E stroke datasets from synthetic glyphs (recognized reliably in
// the IIC-2100..2102 sessions). Replace the JSON files with real handwriting recorded on a
// tablet when available: the tests only depend on the recognized result.
import { writeFileSync } from "node:fs"

// Run from the repo root: node test/examples/__dataset__/math_tutor.generate.mjs
const out = new URL("./json", import.meta.url).pathname
const ellipse = (cx, cy, rx, ry, from = 0, to = 1) =>
  Array.from({ length: 25 }, (_, i) => {
    const t = (from + ((to - from) * i) / 24) * 2 * Math.PI
    return [cx + rx * Math.sin(t), cy - ry * Math.cos(t)]
  })
const G = {
  "2": [[[0, 10], [5, 2], [15, 0], [25, 5], [25, 15], [0, 40], [30, 40]]],
  x: [[[0, 12], [25, 40]], [[25, 12], [0, 40]]],
  "+": [[[0, 25], [26, 25]], [[13, 12], [13, 38]]],
  "=": [[[0, 20], [26, 20]], [[0, 32], [26, 32]]],
  "3": [[[0, 5], [20, 0], [26, 8], [10, 18], [26, 26], [22, 38], [0, 40]]],
  "7": [[[0, 0], [28, 0], [10, 40]]],
  "4": [[[18, 0], [0, 28], [30, 28]], [[20, 10], [20, 40]]],
  "1": [[[6, 8], [16, 0], [16, 40]]],
  "0": [ellipse(13, 20, 12, 20)],
  "5": [[[24, 0], [4, 0], [2, 18], [16, 15], [26, 24], [22, 37], [0, 38]]],
  a: [ellipse(12, 27, 11, 12), [[23, 14], [23, 40]]],
  b: [[[3, 0], [3, 40]], ellipse(13, 28, 10, 12, 0.75, 1.75)],
  c: [ellipse(13, 27, 12, 12, 0.12, -0.62)],
  P: [[[0, 0], [0, 40]], [[0, 0], [16, 0], [25, 6], [25, 14], [16, 20], [0, 20]]],
  A: [[[0, 40], [13, 0], [26, 40]], [[6, 24], [20, 24]]],
  "6": [[[22, 0], [10, 6], [3, 18], [2, 30], [8, 39], [18, 40], [25, 33], [24, 25], [15, 21], [6, 25], [3, 30]]],
  "×": [[[4, 16], [22, 34]], [[22, 16], [4, 34]]],
}

let clock = 1000
function strokeOf(points) {
  const pointers = []
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 3))
    for (let k = 0; k < n; k++) pointers.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  pointers.push(points[points.length - 1])
  clock += 120
  return { pointers: pointers.map(([x, y]) => ({ x: +x.toFixed(1), y: +y.toFixed(1), t: (clock += 8), p: 0.5 })) }
}
function write(text, x0, y0, advance = 42) {
  const strokes = []
  let x = x0
  for (const ch of text) {
    for (const glyph of G[ch]) strokes.push(strokeOf(glyph.map(([px, py]) => [x + px, y0 + py])))
    x += advance
  }
  return strokes
}
const datasets = {
  "math_tutor_level1_answer.json": write("x=7", 150, 80),
  "math_tutor_level2_step1.json": write("2x+3=7", 150, 80),
  "math_tutor_level2_wrong_step2.json": write("2x=10", 150, 160),
  "math_tutor_level2_step2.json": write("2x=4", 150, 160),
  "math_tutor_level2_answer.json": write("x=2", 150, 240),
  // The perimeter of the first demo rectangle, 6 by 4: first left to compute, then the result
  "math_tutor_geometry1_unfinished.json": write("P=10+10", 150, 80),
  "math_tutor_geometry1_answer.json": write("P=20", 150, 160),
  // Its area
  "math_tutor_geometry2_answer.json": write("A=24", 150, 80),
  // The same area computed, then its result written under the `=` without repeating `A`
  "math_tutor_geometry2_step.json": write("A=6×4", 150, 80),
  "math_tutor_geometry2_continued.json": write("=24", 192, 160),
}
for (const [name, strokes] of Object.entries(datasets)) writeFileSync(`${out}/${name}`, JSON.stringify(strokes))
console.log(Object.keys(datasets).join("\n"))
