import
{
  ContextMenuEventMock,
  DoubleTouchEventMock,
  LeftClickEventMock,
  RightClickEventMock,
  TouchEventMock
} from "../__mocks__/EventMock"
import
{
  DefaultConfiguration,
  OIPointerEventGrabber,
  TGrabberConfiguration,
} from "../../../src/iink"

describe("OIPointerEventGrabber.ts", () =>
{
  test("should create with default configuration", () =>
  {
    const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
    expect(grabber).toBeDefined()
  })

  describe("should attach & detach", () =>
  {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    svgElement.style.width = "100px"
    svgElement.style.height = "100px"
    document.body.appendChild(svgElement)

    const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
    grabber.attach(svgElement)
    grabber.onPointerDown = jest.fn()
    grabber.onPointerMove = jest.fn()
    grabber.onPointerUp = jest.fn()

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })

    const pointerMoveEvt = new LeftClickEventMock("pointermove", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerMoveEvt.pointerId = pointerDownEvt.pointerId

    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerUpEvt.pointerId = pointerDownEvt.pointerId

    test("should not listen pointermove event if no pointerdown before", () =>
    {
      svgElement.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toBeCalledTimes(0)
    })

    test("should not listen pointerup event if no pointerdown before", () =>
    {
      svgElement.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).toBeCalledTimes(0)
    })

    test("should listen pointerdown event", () =>
    {
      svgElement.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).toBeCalledTimes(1)
    })

    test("should listen pointermove event if pointerdown before", () =>
    {
      svgElement.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toBeCalledTimes(1)
    })

    test("should listen pointerup event if pointerdown before", () =>
    {
      svgElement.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).toBeCalledTimes(1)
    })

    test("should not listen pointerdown event if stopPointerEvent called", () =>
    {
      svgElement.dispatchEvent(pointerDownEvt)
      grabber.stopPointerEvent()
      svgElement.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toBeCalledTimes(0)
    })

    test("should call detach if already attach", () =>
    {
      const g = new OIPointerEventGrabber(DefaultConfiguration.grabber)
      g.onPointerDown = jest.fn()
      g.onPointerMove = jest.fn()
      g.onPointerUp = jest.fn()
      g.detach = jest.fn()
      g.attach(svgElement)
      g.attach(svgElement)
      expect(g.detach).toBeCalledTimes(1)
    })

    test("should not listen pointerdown event after detach", () =>
    {
      grabber.detach()
      svgElement.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
    })

    test("should not listen pointermove event after detach", () =>
    {
      grabber.detach()
      svgElement.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).not.toBeCalled()
    })

    test("should not listen pointerup event after detach", () =>
    {
      grabber.detach()
      svgElement.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).not.toBeCalled()
    })
  })

  describe("Should extract TPointer from event", () =>
  {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    svgElement.style.width = "100px"
    svgElement.style.height = "100px"
    document.body.appendChild(svgElement)

    const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
    grabber.onPointerDown = jest.fn()
    grabber.attach(svgElement)

    test("should extract TPointer from mouseEvent", () =>
    {
      const mouseDownEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      svgElement.dispatchEvent(mouseDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          mouseDownEvt,
          expect.objectContaining({
            x: mouseDownEvt.clientX,
            y: mouseDownEvt.clientY,
            p: mouseDownEvt.pressure
          })
        )
    })

    test("should extract TPointer from touchEvent", () =>
    {
      const touchDownEvt = new TouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      svgElement.dispatchEvent(touchDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          touchDownEvt,
          expect.objectContaining({
            x: touchDownEvt.changedTouches[0].clientX,
            y: touchDownEvt.changedTouches[0].clientY,
            p: touchDownEvt.pressure
          })
        )
    })
  })

  describe("Should use configuration", () =>
  {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    svgElement.style.width = "100px"
    svgElement.style.height = "100px"
    document.body.appendChild(svgElement)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 2705,
      clientY: 1989,
      pressure: 1
    })

    test("should not round values with default configuration", () =>
    {
      const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(svgElement)

      svgElement.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          pointerDownEvt,
          expect.objectContaining({
            x: pointerDownEvt.clientX,
            y: pointerDownEvt.clientY,
            p: pointerDownEvt.pressure
          })
        )
      grabber.detach()
    })

    test("should round values from configuration", () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultConfiguration.grabber, xyFloatPrecision: 2 }
      const grabber = new OIPointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(svgElement)

      grabber.onPointerDown = jest.fn()

      svgElement.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          pointerDownEvt,
          expect.objectContaining({
            x: Math.round(pointerDownEvt.clientX / 100) * 100,
            y: Math.round(pointerDownEvt.clientY / 100) * 100,
            p: pointerDownEvt.pressure
          })
        )
    })

    test("should not round values from configuration if negative precision", () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultConfiguration.grabber, xyFloatPrecision: -2 }
      const grabber = new OIPointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(svgElement)

      grabber.onPointerDown = jest.fn()

      svgElement.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown)
        .toBeCalledWith(
          pointerDownEvt,
          expect.objectContaining({
            x: pointerDownEvt.clientX,
            y: pointerDownEvt.clientY,
            p: pointerDownEvt.pressure
          })
        )
    })
  })

  describe("Should ignore Event", () =>
  {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    svgElement.style.width = "100px"
    svgElement.style.height = "100px"
    document.body.appendChild(svgElement)

    const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
    grabber.attach(svgElement)
    grabber.onPointerDown = jest.fn()

    test("should not listen right click event", () =>
    {
      const pointerDownEvt = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      svgElement.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach()
    })

    test("should not listen double touch event", () =>
    {
      const pointerDownEvt = new DoubleTouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      svgElement.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach()
    })
  })

  describe("Context menu", () =>
  {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    svgElement.style.width = "100px"
    svgElement.style.height = "100px"
    document.body.appendChild(svgElement)

    const grabber = new OIPointerEventGrabber(DefaultConfiguration.grabber)
    grabber.attach(svgElement)
    grabber.onContextMenu = jest.fn()

    test("should call onContextMenu", () =>
    {
      const pointerDownEvt = new ContextMenuEventMock({
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      svgElement.dispatchEvent(pointerDownEvt)
      expect(grabber.onContextMenu).toHaveBeenCalledTimes(1)
      grabber.detach()
    })
  })

})
