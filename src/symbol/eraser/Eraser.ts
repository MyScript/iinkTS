import type { TBox, TPointer } from "@/core"
import { BoxOps, createUUID } from "@/core"
import type { TStyle } from "@/style"
import { mergeSymbolStyle } from "@/style"

import { SymbolType } from "../Symbol"
/**
 * @group Symbol
 */
export type TEraser = {
  id: string
  type: SymbolType.Eraser
  style: TStyle
  pointers: TPointer[]
}

/**
 * @group Symbol
 */
export const EraserOps = {
  create(width = 5): TEraser {
    const style = mergeSymbolStyle({
      color: "grey",
      fill: "none",
      opacity: 0.2,
      width,
    })
    return {
      type: SymbolType.Eraser,
      id: `${SymbolType.Eraser}-${createUUID()}`,
      style,
      pointers: [],
    }
  },

  getBounds(eraser: TEraser): TBox {
    return BoxOps.createFromPoints(eraser.pointers)
  },
}
