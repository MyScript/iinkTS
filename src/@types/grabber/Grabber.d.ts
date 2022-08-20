import { TGrabberConfiguration } from '../configuration/GrabberConfiguration'

export interface IGrabber {
  setConfiguration(configuration: TGrabberConfiguration): void

  attach(domElement?: HTMLElement): void

  detach(domElement?: HTMLElement): void

  onPointerDown(evt: PointerEvent, point: TPoint): void

  onPointerMove(evt: PointerEvent, point: TPoint): void

  onPointerUp(evt: PointerEvent, point: TPoint): void
}