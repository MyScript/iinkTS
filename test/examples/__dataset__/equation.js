import strokes from "./json/equation.json" with { type: "json" }

export default {
  strokes,
  exports: {
    LATEX: ["y", "y-", "y=", "y=3", "y=30", "y=3x", "y=3x-", "y=3x+", "y=3x+2"],
    MATHML: {
      STANDARD:
        '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi> y </mi><mo> = </mo><mn> 3 </mn><mi> x </mi><mo> + </mo><mn> 2 </mn></math>',
    },
  },
}
