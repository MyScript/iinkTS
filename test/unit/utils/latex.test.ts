import { latexToUnicodeMath } from "@/iink"

describe("latexToUnicodeMath", () => {
  test("should leave simple fraction operands unparenthesized", () => {
    expect(latexToUnicodeMath("x=\\dfrac{1}{2}")).toBe("x=1/2")
  })

  test("should parenthesize fraction operands containing +/-", () => {
    expect(latexToUnicodeMath("\\frac{a+b}{c}")).toBe("(a+b)/c")
    expect(latexToUnicodeMath("\\frac{1}{c-d}")).toBe("1/(c-d)")
  })

  test("should convert greek letters to unicode", () => {
    expect(latexToUnicodeMath("\\alpha+\\beta")).toBe("α+β")
  })

  test("should convert superscript and subscript digits", () => {
    expect(latexToUnicodeMath("x^{2}")).toBe("x²")
    expect(latexToUnicodeMath("x_{1}")).toBe("x₁")
    expect(latexToUnicodeMath("x^2_1")).toBe("x²₁")
  })

  test("should strip \\left/\\right delimiters and keep the bracket", () => {
    expect(latexToUnicodeMath("\\left(\\dfrac{1}{2}\\right)")).toBe("(1/2)")
  })

  test("should handle nested fraction inside \\left/\\right with stray spacing", () => {
    expect(latexToUnicodeMath("x=\\dfrac{1}{2}\\left( \\dfrac{\\alpha }{2}\\right)")).toBe("x=1/2(α/2)")
  })

  test("should convert math operators", () => {
    expect(latexToUnicodeMath("\\int")).toBe("∫")
    expect(latexToUnicodeMath("\\sum")).toBe("∑")
    expect(latexToUnicodeMath("\\sqrt")).toBe("√")
  })

  test("should parenthesize sqrt operand only when it contains +/-", () => {
    expect(latexToUnicodeMath("\\sqrt{x+y}")).toBe("√(x+y)")
    expect(latexToUnicodeMath("\\sqrt{x}+y")).toBe("√x+y")
    expect(latexToUnicodeMath("\\sqrt{x}")).toBe("√x")
  })

  test("should return N/A for a nullable/non-string input", () => {
    expect(latexToUnicodeMath(undefined)).toBe("N/A")
  })

  test("should convert a fraction nested inside sqrt, parenthesizing the radicand", () => {
    expect(latexToUnicodeMath("\\sqrt{\\dfrac{x}{y}}")).toBe("√(x/y)")
  })

  test("should convert fractions nested in both operands of an outer fraction", () => {
    expect(latexToUnicodeMath("\\dfrac{\\dfrac{x}{y}}{\\dfrac{y}{x}}=")).toBe("(x/y)/(y/x)=")
  })
})
