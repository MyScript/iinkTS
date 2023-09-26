import { TPointer } from "../math"

export interface IGrabber {
  attach(domElement?: HTMLElement): void

  detach(domElement?: HTMLElement): void

  onPointerDown(evt: PointerEvent, point: TPointer): void

  onPointerMove(evt: PointerEvent, point: TPointer): void

  onPointerUp(evt: PointerEvent, point: TPointer): void
}
