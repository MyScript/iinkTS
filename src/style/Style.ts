/**
 * @group Style
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px

 */
export type TStyle = {
  color?: string
  width?: number
  fill?: string
  opacity?: number
}

/**
 * @group Style
 */
export const DefaultStyle: TStyle = {
  color: "#000000",
  width: 1,
  opacity: 1
} as const
