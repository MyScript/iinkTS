import type { TBox } from "@/core"

import type { JIIXElementType } from "./JIIX"
import type { TJIIXBase, TJIIXElementBase } from "./JIIXCommon"

/**
 * @group Client/Export
 * @remarks Math element type in JIIX
 */
export enum JIIXMathExpressionType {
  Number = "number",
  Variable = "variable",
  Symbol = "symbol",
  Group = "group",
  Fraction = "fraction",
  Superscript = "superscript",
  Subscript = "subscript",
  Subsuperscript = "subsuperscript",
  SquareRoot = "square root",
  Root = "root",
  Power = "power",
  Underoverscript = "underoverscript",
  Add = "+",
  Subtract = "-",
  Multiply = "×",
  Divide = "/",
  Equal = "=",
  NotEqual = "≠",
  LessThan = "<",
  GreaterThan = ">",
  LessThanOrEqual = "≤",
  GreaterThanOrEqual = "≥",
}

/**
 * @group Client/Export
 * @remarks Union type for all possible math expression type values (derived from JIIXMathExpressionType enum)
 */
export type TJIIXMathExpressionTypeValue = JIIXMathExpressionType | string

/**
 * @group Client/Export
 * @remarks Symbol in a math expression
 */
export type TJIIXMathSymbol = {
  symbol: string
  candidates?: string[]
}

/**
 * @group Client/Export
 * @remarks Base type for math expressions
 */
export type TJIIXMathExpressionBase<T = TJIIXMathExpressionTypeValue> = TJIIXBase & {
  id: string
  type: T
}

/**
 * @group Client/Export
 * @remarks Number expression in math
 */
export type TJIIXMathNumber = TJIIXMathExpressionBase<JIIXMathExpressionType.Number> & {
  label: string
  value: number
  symbols?: TJIIXMathSymbol[]
}

/**
 * @group Client/Export
 * @remarks Variable expression in math (e.g., x, y, z)
 */
export type TJIIXMathVariable = TJIIXMathExpressionBase<JIIXMathExpressionType.Variable> & {
  label: string
  value?: number | string
}

/**
 * @group Client/Export
 * @remarks Symbol expression in math
 */
export type TJIIXMathSymbolExpression = TJIIXMathExpressionBase<JIIXMathExpressionType.Symbol> & {
  label: string
  symbols?: TJIIXMathSymbol[]
}

/**
 * @group Client/Export
 * @remarks Operator expression (binary or unary)
 */
export type TJIIXMathOperator = TJIIXMathExpressionBase<string> & {
  symbols?: TJIIXMathSymbol[]
  operands?: TJIIXMathExpression[]
}

/**
 * @group Client/Export
 * @remarks Group expression
 */
export type TJIIXMathGroup = TJIIXMathExpressionBase<JIIXMathExpressionType.Group> & {
  operands?: TJIIXMathExpression[]
}

/**
 * @group Client/Export
 * @remarks Fraction expression
 */
export type TJIIXMathFraction = TJIIXMathExpressionBase<JIIXMathExpressionType.Fraction> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression] // [numerator, denominator]
}

/**
 * @group Client/Export
 * @remarks Superscript expression (exponent)
 */
export type TJIIXMathSuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Superscript> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression] // [base, exponent]
}

/**
 * @group Client/Export
 * @remarks Subscript expression
 */
export type TJIIXMathSubscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subscript> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression] // [base, subscript]
}

/**
 * @group Client/Export
 * @remarks Subsuperscript expression (both subscript and superscript)
 */
export type TJIIXMathSubsuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subsuperscript> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression] // [base, subscript, superscript]
}

/**
 * @group Client/Export
 * @remarks Square root expression
 */
export type TJIIXMathSquareRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.SquareRoot> & {
  label?: string
  operands?: [TJIIXMathExpression]
}

/**
 * @group Client/Export
 * @remarks Root expression (nth root)
 */
export type TJIIXMathRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.Root> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression] // [radicand, index]
}

/**
 * @group Client/Export
 * @remarks Power expression (exponentiation)
 */
export type TJIIXMathPower = TJIIXMathExpressionBase<JIIXMathExpressionType.Power> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression] // [base, exponent]
}

/**
 * @group Client/Export
 * @remarks Underoverscript expression (e.g., integrals with bounds)
 */
export type TJIIXMathUnderoverscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Underoverscript> & {
  operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression] // [symbol, underscript, overscript]
}

/**
 * @group Client/Export
 * @remarks Union type for all math expressions
 */
export type TJIIXMathExpression =
  | TJIIXMathNumber
  | TJIIXMathVariable
  | TJIIXMathSymbolExpression
  | TJIIXMathOperator
  | TJIIXMathGroup
  | TJIIXMathFraction
  | TJIIXMathSuperscript
  | TJIIXMathSubscript
  | TJIIXMathSubsuperscript
  | TJIIXMathSquareRoot
  | TJIIXMathRoot
  | TJIIXMathPower
  | TJIIXMathUnderoverscript

/**
 * @group Client/Export
 * @remarks Math element that can be embedded in text or standalone
 */
export type TJIIXMathElement = TJIIXElementBase<JIIXElementType.Math> & {
  id: string
  "bounding-box"?: TBox
  label?: string
  expressions?: TJIIXMathExpression[]
}
