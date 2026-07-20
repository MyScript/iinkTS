import { DoubleTouchEventMock, LeftClickEventMock, RightClickEventMock, TouchEventMock } from "../__mocks__/EventMock"
import {
  bumpSvgTransformVersion,
  DefaultGrabberConfiguration,
  PointerEventGrabber,
  TGrabberConfiguration,
} from "@/iink"

describe("PointerEventGrabber.ts", () => {
  test("should create with default configuration", () => {
    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    expect(grabber).toBeDefined()
  })

  describe("should attach & detach", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()
    grabber.onPointerMove = jest.fn()
    grabber.onPointerUp = jest.fn()

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })

    const pointerMoveEvt = new LeftClickEventMock("pointermove", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1,
    })
    pointerMoveEvt.pointerId = pointerDownEvt.pointerId

    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1,
    })
    pointerUpEvt.pointerId = pointerDownEvt.pointerId

    test("should listen pointerdown event", () => {
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(1)
    })

    test("should listen pointermove event", () => {
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toHaveBeenCalledTimes(1)
    })

    test("should listen pointerup event", () => {
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).toHaveBeenCalledTimes(1)
    })

    test("should call onPointerMove once per coalesced point instead of only the last one", () => {
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      g.onPointerDown = jest.fn()
      g.onPointerMove = jest.fn()
      g.onPointerUp = jest.fn()
      g.attach(wrapperHTML)

      const downEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 0,
        clientY: 0,
        pressure: 1,
      })
      wrapperHTML.dispatchEvent(downEvt)

      const coalesced1 = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 5,
        pressure: 1,
      })
      const coalesced2 = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1,
      })
      const batchedMoveEvt = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1,
        coalescedEvents: [coalesced1, coalesced2],
      })

      wrapperHTML.dispatchEvent(batchedMoveEvt)

      expect(g.onPointerMove).toHaveBeenCalledTimes(2)
      expect(g.onPointerMove).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ pointer: expect.objectContaining({ x: 5, y: 5 }) })
      )
      expect(g.onPointerMove).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ pointer: expect.objectContaining({ x: 10, y: 10 }) })
      )
      g.detach()
    })

    test("should call detach if already attach", () => {
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      g.onPointerDown = jest.fn()
      g.onPointerMove = jest.fn()
      g.onPointerUp = jest.fn()
      g.detach = jest.fn()
      g.attach(wrapperHTML)
      g.attach(wrapperHTML)
      expect(g.detach).toHaveBeenCalledTimes(1)
    })

    test("should not listen pointerdown event after detach", () => {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toHaveBeenCalled()
    })

    test("should not listen pointermove event after detach", () => {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).not.toHaveBeenCalled()
    })

    test("should not listen pointerup event after detach", () => {
      grabber.detach()
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).not.toHaveBeenCalled()
    })
  })

  describe("Should extract TPointer from event", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.onPointerDown = jest.fn()
    grabber.attach(wrapperHTML)

    test("should extract TPointer from mouseEvent", () => {
      const mouseDownEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1,
      })

      wrapperHTML.dispatchEvent(mouseDownEvt)

      expect(grabber.onPointerDown).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: expect.objectContaining({
            x: mouseDownEvt.clientX,
            y: mouseDownEvt.clientY,
            p: mouseDownEvt.pressure,
          }),
        })
      )
    })

    test("should extract TPointer from touchEvent", () => {
      const touchDownEvt = new TouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1,
      })

      wrapperHTML.dispatchEvent(touchDownEvt)

      expect(grabber.onPointerDown).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: expect.objectContaining({
            x: touchDownEvt.changedTouches[0].clientX,
            y: touchDownEvt.changedTouches[0].clientY,
            p: touchDownEvt.pressure,
          }),
        })
      )
    })
  })

  describe("Should use configuration", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 2705,
      clientY: 1989,
      pressure: 1,
    })

    test("should not round values with default configuration", () => {
      const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: expect.objectContaining({
            x: pointerDownEvt.clientX,
            y: pointerDownEvt.clientY,
            p: pointerDownEvt.pressure,
          }),
        })
      )
      grabber.detach()
    })

    test("should round values from configuration", () => {
      const grabberConfig: TGrabberConfiguration = { ...DefaultGrabberConfiguration, xyFloatPrecision: 2 }
      const grabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: expect.objectContaining({
            x: Math.round(pointerDownEvt.clientX / 100) * 100,
            y: Math.round(pointerDownEvt.clientY / 100) * 100,
            p: pointerDownEvt.pressure,
          }),
        })
      )
    })

    test("should not round values from configuration if negative precision", () => {
      const grabberConfig: TGrabberConfiguration = { ...DefaultGrabberConfiguration, xyFloatPrecision: -2 }
      const grabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

      expect(grabber.onPointerDown).toHaveBeenCalledWith(
        expect.objectContaining({
          pointer: expect.objectContaining({
            x: pointerDownEvt.clientX,
            y: pointerDownEvt.clientY,
            p: pointerDownEvt.pressure,
          }),
        })
      )
    })
  })

  describe("Should ignore Event", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    wrapperHTML.style.width = "100px"
    wrapperHTML.style.height = "100px"
    document.body.appendChild(wrapperHTML)

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()

    test("should not listen right click event", () => {
      const pointerDownEvt = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toHaveBeenCalled()
      grabber.detach()
    })

    test("should not listen right click event", () => {
      const pointerDownEvt = new DoubleTouchEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toHaveBeenCalled()
      grabber.detach()
    })
  })

  describe("should cache getScreenCTM and only recompute it when the svg transform changes", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    document.body.appendChild(wrapperHTML)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
    wrapperHTML.appendChild(svg)

    const fakeCTM = { inverse: () => ({}) } as unknown as DOMMatrix
    svg.getScreenCTM = jest.fn(() => fakeCTM)
    svg.createSVGPoint = jest.fn(
      () =>
        ({
          x: 0,
          y: 0,
          matrixTransform: () => ({ x: 1, y: 2 }),
        }) as unknown as DOMPoint
    )

    const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()
    grabber.onPointerMove = jest.fn()
    grabber.onPointerUp = jest.fn()

    test("should reuse the cached CTM across pointerdown/pointermove while unchanged", () => {
      const downEvt = new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 })
      wrapperHTML.dispatchEvent(downEvt)

      const moveEvt1 = new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 1, clientY: 1, pressure: 1 })
      wrapperHTML.dispatchEvent(moveEvt1)
      const moveEvt2 = new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 2, clientY: 2, pressure: 1 })
      wrapperHTML.dispatchEvent(moveEvt2)

      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)
    })

    test("should recompute the CTM once the svg transform version changes", () => {
      // jest's clearMocks resets call counts between tests, so this counts only
      // calls made within this test - the grabber's own cache state (private
      // fields) persists across tests since it's the same instance.
      bumpSvgTransformVersion(svg)

      const moveEvt = new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 3, clientY: 3, pressure: 1 })
      wrapperHTML.dispatchEvent(moveEvt)

      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)
      grabber.detach()
    })
  })
})
