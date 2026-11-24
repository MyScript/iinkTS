// @ts-check
/**
 * Every text the Math Tutor shows, in one place so the demo can be translated without touching
 * the code.
 */

/**
 * @typedef {import("./shapes.js").TShapeSpec} TShapeSpec
 * @typedef {import("./shapes.js").TQuantity} TQuantity
 */

/** Hints shown under a wrong line, keyed by the mistake `diagnose` recognized */
export const HINTS = {
  sign: "Watch the sign: a term changes sign when it moves to the other side.",
  division: "Divide both sides by the coefficient of the unknown.",
  "square-root": "Almost there: you still need to take the square root.",
  slip: "Your method is right, check the arithmetic on this line.",
  "half-perimeter": "A rectangle has four sides: count each length twice.",
  area: "That is the area. The perimeter goes all around the shape.",
  "perimeter-for-area": "That is the perimeter. The area is the space inside the shape.",
  square: "side² means side × side, not 2 × side.",
  "radius-for-diameter": "The circumference is 2πr: π times the diameter, not the radius.",
  "triangle-half": "A triangle is half a rectangle: divide base × height by 2.",
  "missing-side": "The perimeter goes all around: add the hypotenuse too. Pythagoras gives it.",
  generic: "This line does not follow from the one above. Check it step by step.",
}

/**
 * The last line holds but is not a result yet: `P = (4 + 6) × 2` instead of `P = 20`.
 * @param {string} variable
 */
export const UNFINISHED = (variable) =>
  `Right so far. Now finish the calculation: ${variable} = one number (π can stay, as in 8π).`

/** The shape names, as the prompts use them */
const SHAPE_NAMES = {
  square: "square",
  rectangle: "rectangle",
  circle: "circle",
  "right-triangle": "right triangle",
  triangle: "triangle",
}

/** What the student is asked to do, per kind of exercise */
export const PROMPTS = {
  equation: "Solve for x. Write each step on its own line.",
  /**
   * @param {TShapeSpec["type"]} shape
   * @param {TQuantity} quantity
   */
  measure: (shape, quantity) => {
    const asked =
      quantity === "area" ? "area A" : shape === "circle" ? "perimeter P (its circumference)" : "perimeter P"
    return `Find the ${asked} of this ${SHAPE_NAMES[shape]}. Write each step on its own line.`
  },
}

/** Hints written for generated exercises, when no typical mistake is recognized */
export const EXERCISE_HINTS = {
  /** @param {number} b */
  moveConstant: (b) => (b > 0 ? `Subtract ${b} from both sides.` : `Add ${-b} to both sides.`),
  /** @param {number} a */
  divide: (a) => `Divide both sides by ${a}.`,
  /**
   * @param {number} a
   * @param {number} b
   */
  twoSteps: (a, b) => `First ${b > 0 ? `subtract ${b} from` : `add ${-b} to`} both sides, then divide by ${a}.`,
}

/**
 * The formula to use, per shape and quantity
 * @type {Record<TShapeSpec["type"], Partial<Record<TQuantity, string>>>}
 */
export const FORMULA_HINTS = {
  square: { perimeter: "A square has four equal sides: P = 4 × side.", area: "A = side × side." },
  rectangle: { perimeter: "P = 2 × length + 2 × width.", area: "A = length × width." },
  circle: { perimeter: "P = 2πr.", area: "A = πr²." },
  "right-triangle": {
    perimeter: "Find the hypotenuse with Pythagoras (c² = a² + b²), then add the three sides.",
    area: "A = (base × height) / 2: the two sides of the right angle are the base and the height.",
  },
  triangle: { perimeter: "Add the three sides." },
}

/** Page chrome */
export const UI = {
  title: "Math Tutor",
  /** @param {number} level */
  level: (level) => `Level ${level}`,
  tracks: { algebra: "Algebra", geometry: "Geometry" },
  levelNames: {
    "algebra-1": "One step",
    "algebra-2": "Two steps",
    "geometry-1": "Perimeter",
    "geometry-2": "Area",
  },
  check: "Check",
  next: "Next exercise",
  restart: "Start over",
  margin: "What the machine reads",
  solved: "Solved! Well done.",
  /** @param {number} count */
  stars: (count) => `${count} solved`,
  rotate: "Turn your tablet to landscape to start.",
  marks: { correct: "✓", wrong: "✗", unchecked: "?", pending: "…", "after-error": "" },
}

/** Text of the figures */
export const FIGURE_UI = {
  /** @param {number} radius */
  radius: (radius) => `r = ${radius}`,
  /**
   * @param {TShapeSpec} shape
   * @returns {string}
   */
  describe: (shape) => {
    switch (shape.type) {
      case "square":
        return `Square with side ${shape.side}`
      case "rectangle":
        return `Rectangle ${shape.width} by ${shape.height}`
      case "circle":
        return `Circle with radius ${shape.radius}`
      case "right-triangle":
        return `Right triangle with sides ${shape.legs[0]} and ${shape.legs[1]} around the right angle`
      case "triangle":
        return `Triangle with sides ${shape.sides.join(", ")}`
    }
  },
}
