import type { TPartialDeep } from "@/core"

import type { TPenNib } from "./PenNib"
/**
 * @group Styles
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px
 * @property pen The instrument the stroke is drawn with — see {@link PEN_NIBS}. Part of the style, not of the
 * tool, so a document reopened later redraws each stroke with the nib it was written with rather
 * than with whatever nib happens to be selected.
 * @property penAngle Edge angle in degrees for a broad-edge nib; overrides the nib's own. See {@link PEN_NIBS}.
 * @property penSmoothing Overrides how many pointers the nib's width is averaged over.
 * @property penSpeed Overrides how sharply speed thins the line.
 */
export type TStyle = {
  [key: string]: string | number | undefined
  width: number
  color: string
  opacity?: number
  fill?: string
  pen?: TPenNib
  penAngle?: number
  penSmoothing?: number
  penSpeed?: number
}

/**
 * @group Styles
 * @source
 */
export const DefaultStyle: TStyle = {
  width: 2,
  color: "#000000",
  //   opacity: 1,
  //   fill: "transparent",
} as const

/**
 * Merges a partial style onto {@link DefaultStyle} and coerces `width`/`opacity` to numbers —
 * every symbol type's `create()` did this identically before extraction.
 * @group Styles
 */
export function mergeSymbolStyle(style?: TPartialDeep<TStyle>): TStyle {
  const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
  if (mergedStyle.opacity) {
    mergedStyle.opacity = +mergedStyle.opacity
  }
  mergedStyle.width = +mergedStyle.width
  return mergedStyle
}
