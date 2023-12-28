import { IGrabber } from "./IGrabber"
import { PointerEventGrabber } from "./PointerEventGrabber"

/**
 * @group Grabber
 */
export class OIPointerEventGrabber extends PointerEventGrabber implements IGrabber
{
  stopPointerEvent(): void
  {
    this.activePointerId = undefined
  }
}
