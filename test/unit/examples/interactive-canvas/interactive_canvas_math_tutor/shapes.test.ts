import { measure, shapeFigure, shapeSvg, triangleCorners } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/shapes.js"
import { FIGURE_UI } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/strings.js"

describe("interactive_canvas_math_tutor/shapes", () => {
  describe("measure", () => {
    test("should compute the perimeter and the area of each shape", () => {
      expect(measure({ type: "square", side: 5 }, "perimeter").value).toBe(20)
      expect(measure({ type: "square", side: 5 }, "area").value).toBe(25)
      expect(measure({ type: "rectangle", width: 6, height: 4 }, "perimeter").value).toBe(20)
      expect(measure({ type: "rectangle", width: 6, height: 4 }, "area").value).toBe(24)
      expect(measure({ type: "circle", radius: 3 }, "perimeter").value).toBeCloseTo(6 * Math.PI)
      expect(measure({ type: "circle", radius: 3 }, "area").value).toBeCloseTo(9 * Math.PI)
      expect(measure({ type: "right-triangle", legs: [3, 4] }, "perimeter").value).toBe(12)
      expect(measure({ type: "right-triangle", legs: [3, 4] }, "area").value).toBe(6)
      expect(measure({ type: "triangle", sides: [5, 6, 7] }, "perimeter").value).toBe(18)
    })

    test("should list the wrong values typical of the shape", () => {
      expect(measure({ type: "rectangle", width: 6, height: 4 }, "perimeter").traps).toEqual([
        { mistake: "half-perimeter", expected: 20, written: 10 },
        { mistake: "area", expected: 20, written: 24 },
      ])
      expect(measure({ type: "triangle", sides: [5, 6, 7] }, "perimeter").traps).toEqual([])
    })
  })

  describe("triangleCorners", () => {
    test("should place a triangle with the given sides", () => {
      const [a, b, c] = triangleCorners([5, 6, 7])
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(5)
      expect(Math.hypot(c.x - b.x, c.y - b.y)).toBeCloseTo(6)
      expect(Math.hypot(a.x - c.x, a.y - c.y)).toBeCloseTo(7)
    })
  })

  describe("shapeFigure", () => {
    test("should write the given values next to the sides, and mark the right angle", () => {
      const rectangle = shapeFigure({ type: "rectangle", width: 6, height: 4 })
      expect(rectangle.labels.map((label) => label.text)).toEqual(["6", "4"])
      expect(rectangle.rightAngles).toHaveLength(1)
      expect(shapeFigure({ type: "right-triangle", legs: [3, 4] }).labels.map((label) => label.text)).toEqual(["3", "4"])
      expect(shapeFigure({ type: "triangle", sides: [5, 6, 7] }).labels.map((label) => label.text)).toEqual(["5", "6", "7"])
    })

    test("should show the radius of a circle", () => {
      const circle = shapeFigure({ type: "circle", radius: 3 })
      expect(circle.circles).toEqual([{ center: { x: 0, y: 0 }, radius: 3 }])
      expect(circle.labels.map((label) => label.text)).toEqual([FIGURE_UI.radius(3)])
    })
  })

  describe("shapeSvg", () => {
    test("should draw the shape with its labels, described for screen readers", () => {
      const svg = shapeSvg({ type: "rectangle", width: 6, height: 4 })
      expect(Array.from(svg.querySelectorAll("text"), (text) => text.textContent)).toEqual(["6", "4"])
      expect(svg.querySelector(".tutor-given-right-angle")).not.toBeNull()
      expect(svg.getAttribute("role")).toBe("img")
      expect(svg.getAttribute("aria-label")).toBe("Rectangle 6 by 4")
    })

    test("should draw the longest side at the same size, whatever the values", () => {
      const width = (svg: SVGElement) => Number(svg.getAttribute("width"))
      expect(width(shapeSvg({ type: "square", side: 2 }))).toBe(width(shapeSvg({ type: "square", side: 12 })))
    })
  })
})
