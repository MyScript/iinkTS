/**
 * @group Style
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px

 */
export type TStyle = {
  width?: number
  color?: string
  opacity?: number
  fill?: string
}

/**
 * @group Style
 */
export const DefaultStyle: TStyle = {
  width: 4,
  color: "#000000",
  opacity: 1,
  fill: "transparent",
} as const
