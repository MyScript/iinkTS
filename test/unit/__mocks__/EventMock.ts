type EventMockProps = {
  clientX: number
  clientY: number
  pressure: number
  pointerType: string
  pointerId?: number
}

type CompleteEventMockProps = EventMockProps & {
  button: number
  buttons: number
}

type TouchListFake = ({ clientX: number, clientY: number })[]

type EventChangeFakeProps = {
  target: EventTarget
}

export class EventMock extends Event
{
  clientX: number
  clientY: number
  pressure: number
  pointerType: string
  button: number
  buttons: number
  pointerId: number
  constructor(type: string, props: CompleteEventMockProps)
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

export class LeftClickEventMock extends EventMock
{
  constructor(type: string, props: EventMockProps)
  {
    super(type, {
      ...props,
      button: 0,
      buttons: 1
    })
  }
}

export class ContextMenuEventMock extends EventMock
{
  constructor(props: EventMockProps)
  {
    super("contextmenu", {
      ...props,
      button: 2,
      buttons: 2
    })
  }
}

export class RightClickEventMock extends EventMock
{
  constructor(type: string, props: EventMockProps)
  {
    super(type, {
      ...props,
      button: 1,
      buttons: 1
    })
  }
}

export class TouchEventMock extends EventMock
{
  changedTouches: TouchListFake
  constructor(type: string, props: EventMockProps)
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

export class DoubleTouchEventMock extends EventMock
{
  changedTouches: TouchListFake
  constructor(type: string, props: EventMockProps)
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
export class ChangeEventMock extends Event
{
  constructor(props: EventChangeFakeProps)
  {
    super("change", props as EventInit)
  }
}
