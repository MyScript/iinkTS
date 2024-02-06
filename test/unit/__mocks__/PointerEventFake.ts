type EventFakeProps = {
  clientX: number
  clientY: number
  pressure: number
  pointerType: string
  pointerId?: number
}

type CompleteEventFakeProps = EventFakeProps & {
  button: number
  buttons: number
}

type TouchListFake = ({ clientX: number, clientY: number })[]

export class PointerEventFake extends Event
{
  clientX: number
  clientY: number
  pressure: number
  pointerType: string
  button: number
  buttons: number
  pointerId: number
  constructor(type: string, props: CompleteEventFakeProps)
  {
    super(type, props as EventInit)
    this.clientX = props.clientX
    this.clientY = props.clientY
    this.pointerType = props.pointerType
    this.pressure = props.pressure
    this.button = props.button
    this.buttons = props.buttons
    this.pointerId = props.pointerId || Math.floor(Math.random() * 100)
  }
}

export class LeftClickEventFake extends PointerEventFake
{
  constructor(type: string, props: EventFakeProps)
  {
    super(type, {
      ...props,
      button: 0,
      buttons: 1
    })
  }
}

export class RightClickEventFake extends PointerEventFake
{
  constructor(type: string, props: EventFakeProps)
  {
    super(type, {
      ...props,
      button: 1,
      buttons: 1
    })
  }
}

export class TouchEventFake extends PointerEventFake
{
  changedTouches: TouchListFake
  constructor(type: string, props: EventFakeProps)
  {
    super(type, {
      ...props,
      button: 0,
      buttons: 1
    })
    this.changedTouches = [{
      clientX: props.clientX,
      clientY: props.clientY,
    }]
  }
}

export class DoubleTouchEventFake extends PointerEventFake
{
  changedTouches: TouchListFake
  constructor(type: string, props: EventFakeProps)
  {
    super(type, {
      ...props,
      button: 0,
      buttons: 2
    })
    this.changedTouches = [{
      clientX: props.clientX,
      clientY: props.clientY,
    }]
  }
}
