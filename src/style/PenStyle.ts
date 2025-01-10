import { PartialDeep } from "../utils"
import { TStyle } from "./Style"

/**
 * @group Style
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
export type TPenStyle = PartialDeep<TStyle> & {
  "-myscript-pen-width"?: number
  "-myscript-pen-fill-style"?: string
  "-myscript-pen-fill-color"?: string
}

/**
 * @group Style
 * @source
 */
export const DefaultPenStyle: TPenStyle = {
}
