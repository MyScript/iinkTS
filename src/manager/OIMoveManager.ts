import { OIBehaviors } from "../behaviors"
import { OISVGRenderer } from "../renderer"

/**
 * @group Manager
 */
export class OIMoveManager
{
  behaviors: OIBehaviors
  origin?: {
    left: number,
    top: number,
    x: number,
    y: number
  }

  constructor(behaviors: OIBehaviors)
  {
    this.behaviors = behaviors
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  start(evt: PointerEvent): void
  {
    this.origin = {
      left: this.renderer.parent.scrollLeft,
      top: this.renderer.parent.scrollTop,
      x: evt.clientX,
      y: evt.clientY,
    }
  }

  continue(evt: PointerEvent): void
  {
    if (!this.origin) {
      throw new Error("Can't move cause origin is undefined")
    }
    const dx = evt.clientX - this.origin.x
    const dy = evt.clientY - this.origin.y

    this.renderer.parent.scrollTop = this.origin.top - dy
    this.renderer.parent.scrollLeft = this.origin.left - dx
  }

  async end(evt: PointerEvent): Promise<void>
  {
    this.continue(evt)
    this.origin = undefined
  }
}
