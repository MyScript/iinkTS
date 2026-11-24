import { diagnose, hintFor } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/hints.js"
import { HINTS } from "../../../../../examples/interactive-canvas/interactive_canvas_math_tutor/strings.js"

import { add, eq, mul, neg, num, sqrt, sub, sup, twoXPlusThreeEqualsSeven, v } from "../../assets/js/math/fixtures"

describe("interactive_canvas_math_tutor/hints", () => {
  const solution = { x: 2 }
  const twoXEqualsFour = eq(mul(num(2), v("x")), num(4))

  describe("diagnose", () => {
    test("should spot a sign error when a term changes side", () => {
      // 2x + 3 = 7 → 2x = 7 + 3 instead of 7 - 3
      expect(diagnose(eq(mul(num(2), v("x")), num(10)), twoXPlusThreeEqualsSeven, solution)).toBe("sign")
    })

    test("should spot a sign error on a subtracted term", () => {
      // 2x - 3 = 1 → 2x = 1 - 3 instead of 1 + 3
      const previous = eq(sub(mul(num(2), v("x")), num(3)), num(1))
      expect(diagnose(eq(mul(num(2), v("x")), neg(num(2))), previous, solution)).toBe("sign")
    })

    test("should spot a flipped sign on the answer", () => {
      expect(diagnose(eq(v("x"), neg(num(2))), twoXEqualsFour, solution)).toBe("sign")
    })

    test("should spot a coefficient left undivided", () => {
      // 2x = 4 → x = 4
      expect(diagnose(eq(v("x"), num(4)), twoXEqualsFour, solution)).toBe("division")
    })

    test("should spot a multiplication instead of a division", () => {
      // 2x = 4 → x = 8
      expect(diagnose(eq(v("x"), num(8)), twoXEqualsFour, solution)).toBe("division")
    })

    test("should spot a forgotten square root", () => {
      // c = √(3² + 4²) → c = 25
      const previous = eq(v("c"), sqrt(add(sup(num(3), num(2)), sup(num(4), num(2)))))
      expect(diagnose(eq(v("c"), num(25)), previous, { c: 5 })).toBe("square-root")
    })

    test("should name the exercise's own typical mistake first", () => {
      // Rectangle 3 × 4, P = 14: writing 7 or 12 is the half perimeter or the area
      const traps = [
        { mistake: "half-perimeter" as const, expected: 14, written: 7 },
        { mistake: "area" as const, expected: 14, written: 12 },
      ]
      const solution = { a: 3, b: 4, P: 14 }
      expect(diagnose(eq(v("P"), num(7)), undefined, solution, traps)).toBe("half-perimeter")
      expect(diagnose(eq(v("P"), num(12)), undefined, solution, traps)).toBe("area")
    })

    test("should not spring a trap on a line expecting another value", () => {
      // 2 × 6 = 12 is a wrong line too, but not one meant to give the perimeter
      const traps = [{ mistake: "area" as const, expected: 14, written: 12 }]
      expect(diagnose(eq(mul(num(2), num(3)), num(12)), undefined, {}, traps)).not.toBe("area")
    })

    test("should call a near miss an arithmetic slip", () => {
      expect(diagnose(eq(v("x"), num(19)), undefined, { x: 18 })).toBe("slip")
    })

    test("should not diagnose what it does not recognize", () => {
      expect(diagnose(eq(v("x"), num(57)), twoXEqualsFour, solution)).toBeUndefined()
    })

    test("should not diagnose a line it cannot read", () => {
      expect(diagnose(add(num(1), num(2)), undefined, solution)).toBeUndefined()
      expect(diagnose(eq(v("x"), v("y")), undefined, solution)).toBeUndefined()
    })
  })

  describe("hintFor", () => {
    test("should prefer the diagnosed hint", () => {
      expect(hintFor("sign", "Isolate x")).toBe(HINTS.sign)
    })

    test("should fall back on the hint written for the exercise", () => {
      expect(hintFor(undefined, "Isolate x")).toBe("Isolate x")
    })

    test("should fall back on a generic hint when nothing else applies", () => {
      expect(hintFor(undefined, undefined)).toBe(HINTS.generic)
    })
  })
})
