import type { TBox, TPoint } from "@/symbol"

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#stroke-item | Stroke item}
 */
export type TJIIXStrokeItem = {
  type: "stroke"
  id: string
  "full-id"?: string
  timestamp?: string
  X?: number[]
  Y?: number[]
  F?: number[]
  T?: number[]
}

/**
 * @group Exports
 */
export type TJIIXBase = {
  "bounding-box"?: TBox
  items?: TJIIXStrokeItem[]
}

/**
 * @group Exports
 */
export type TJIIXElementBase<T = string> = TJIIXBase & {
  id: string
  type: T
  /** IDs of child elements */
  children?: string[]
  /** Positions of children in the content */
  "children-pos"?: number[]
  /** ID of parent element */
  parent?: string
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
export type TJIIXWord = TJIIXBase & {
  id?: string
  label: string
  candidates?: string[]
  "first-char"?: number
  "last-char"?: number
  /** References to child elements (e.g., Math elements) */
  refs?: string[]
  /** Reflow label for mixed content */
  "reflow-label"?: string
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
export type TJIIXChar = TJIIXBase & {
  label: string
  candidates?: string[]
  word: number
  grid: TPoint[]
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
export type TJIIXLine = {
  "baseline-y": number
  "first-char"?: number
  "last-char"?: number
  "x-height": number
  "bounding-box"?: TBox
}
