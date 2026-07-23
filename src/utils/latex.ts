const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
}

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
}

function wrapOperandIfNeedsGrouping(operand: string): string {
  const trimmed = operand.trim()
  // "/" is included because a converted nested fraction (e.g. "x/y") is ambiguous
  // without grouping when embedded under a sqrt or as another fraction's operand.
  return /[+\-/]/.test(trimmed) ? `(${trimmed})` : trimmed
}

function findMatchingBraceEnd(text: string, openBraceIndex: number): number {
  let depth = 0
  for (let i = openBraceIndex; i < text.length; i++) {
    if (text[i] === "{") {
      depth++
    } else if (text[i] === "}") {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return -1
}

/**
 * Scans `latex` for `\name{arg1}{arg2}...` commands (one of `commandNames`, brace-balanced
 * so nested commands like `\sqrt{\dfrac{x}{y}}` are captured whole) and replaces each with
 * `render(args)`. Unmatched text is copied through unchanged.
 */
function replaceCommandWithBalancedArgs(
  latex: string,
  commandNames: string[],
  argCount: number,
  render: (args: string[]) => string
): string {
  let result = ""
  let i = 0
  while (i < latex.length) {
    const command = commandNames.find((name) => latex.startsWith(`\\${name}{`, i))
    if (!command) {
      result += latex[i]
      i++
      continue
    }
    let cursor = i + 1 + command.length
    const args: string[] = []
    while (args.length < argCount && latex[cursor] === "{") {
      const end = findMatchingBraceEnd(latex, cursor)
      if (end === -1) {
        break
      }
      args.push(latex.slice(cursor + 1, end))
      cursor = end + 1
    }
    if (args.length !== argCount) {
      result += latex[i]
      i++
      continue
    }
    result += render(args)
    i = cursor
  }
  return result
}

function replaceGreekLetters(latex: string): string {
  return latex
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\lambda/g, "λ")
    .replace(/\\Lambda/g, "Λ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\Sigma/g, "Σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\Omega/g, "Ω")
}

function replaceMathOperators(latex: string): string {
  return latex
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "∑")
    .replace(/\\prod/g, "∏")
    .replace(/\\sqrt/g, "√")
    .replace(/\\infty/g, "∞")
    .replace(/\\partial/g, "∂")
    .replace(/\\nabla/g, "∇")
    .replace(/\\times */g, "×")
    .replace(/\\neq */g, "≠")
    .replace(/\\leq */g, "≤")
    .replace(/\\geq */g, "≥")
}

function replaceSqrt(latex: string): string {
  // \sqrt{expr} - the radicand is converted recursively (so nested \frac/\sqrt render
  // correctly) then parenthesized only when needed, otherwise \sqrt{x+y} and \sqrt{x}+y
  // would collapse to the same ambiguous "√x+y".
  return replaceCommandWithBalancedArgs(
    latex,
    ["sqrt"],
    1,
    ([operand]) => `√${wrapOperandIfNeedsGrouping(convertToUnicodeMath(operand))}`
  )
}

function replaceSuperscripts(latex: string): string {
  return latex
    .replace(/\^{([0-9]+)}/g, (_, num: string) =>
      num
        .split("")
        .map((d: string) => SUPERSCRIPT_DIGITS[d] || d)
        .join("")
    )
    .replace(/\^([0-9])/g, (_, num: string) => SUPERSCRIPT_DIGITS[num] || num)
}

function replaceSubscripts(latex: string): string {
  return latex
    .replace(/_{([0-9]+)}/g, (_, num: string) =>
      num
        .split("")
        .map((d: string) => SUBSCRIPT_DIGITS[d] || d)
        .join("")
    )
    .replace(/_([0-9])/g, (_, num: string) => SUBSCRIPT_DIGITS[num] || num)
}

function replaceFractions(latex: string): string {
  // Fractions - simplified rendering as a/b. Operands are converted recursively (so a
  // nested \frac/\sqrt renders correctly) then parenthesized only when needed; simple
  // numbers/variables stay bare.
  return replaceCommandWithBalancedArgs(
    latex,
    ["dfrac", "frac"],
    2,
    ([num, den]) =>
      `${wrapOperandIfNeedsGrouping(convertToUnicodeMath(num))}/${wrapOperandIfNeedsGrouping(convertToUnicodeMath(den))}`
  )
}

function stripLeftRightDelimiters(latex: string): string {
  // \left/\right sizing commands - keep the delimiter, drop the command itself
  return latex
    .replace(/\\left\s*\\?\./g, "")
    .replace(/\\right\s*\\?\./g, "")
    .replace(/\\left\s*/g, "")
    .replace(/\\right\s*/g, "")
}

function cleanupBracesAndSpacing(latex: string): string {
  return (
    latex
      // Remove remaining braces
      .replace(/[{}]/g, "")
      // Clean up backslashes for simple commands
      .replace(/\\/g, "")
      // Drop stray spacing left by \left/\right delimiters
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
  )
}

function convertToUnicodeMath(latex: string): string {
  let result = replaceGreekLetters(latex)
  result = replaceSqrt(result)
  result = replaceMathOperators(result)
  result = replaceSuperscripts(result)
  result = replaceSubscripts(result)
  result = replaceFractions(result)
  result = stripLeftRightDelimiters(result)
  result = cleanupBracesAndSpacing(result)
  return result
}

/**
 * @group Utilities
 * @summary Convert a LaTeX math string into a flat UnicodeMath-compatible linear string
 * @param latex - LaTeX source, e.g. a JIIX math block label
 * @returns Plain text using unicode symbols/sub/superscripts, safe to paste into a Word equation field
 */
export function latexToUnicodeMath(latex?: string): string {
  if (typeof latex !== "string") {
    return "N/A"
  }
  return convertToUnicodeMath(latex)
}
