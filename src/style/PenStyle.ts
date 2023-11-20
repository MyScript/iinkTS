/**
 * @group Style
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
export type TPenStyle = {
  color?: string
  width?: number
  "-myscript-pen-width"?: number
  "-myscript-pen-fill-style"?: string
  "-myscript-pen-fill-color"?: string
}

/**
 * @group Style
 */
export const DefaultPenStyle: TPenStyle = {

}
