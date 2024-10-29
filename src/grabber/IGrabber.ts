import { TPointer } from "../symbol"

/**
 * @group Grabber
 */
export interface IGrabber
{
  attach(element: HTMLElement | SVGElement): void

  detach(): void

  onPointerDown(evt: PointerEvent, point: TPointer): void

  onPointerMove(evt: PointerEvent, point: TPointer): void

  onPointerUp(evt: PointerEvent, point: TPointer): void
}
