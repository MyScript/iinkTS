import { DoubleTouchEventMock, LeftClickEventMock, RightClickEventMock, TouchEventMock } from "../__mocks__/EventMock"
import { bumpSvgTransformVersion, DefaultGrabberConfiguration, PointerEventGrabber, TGrabberConfiguration, TGrabberInputMode } from "@/iink"

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

    test("should time each coalesced sample from its own event, not from one clock read", () => {
      // The bug this guards: reading the clock inside the handler while replaying a batch stamped
      // every sample in it with the same instant, so the recognizer saw them as simultaneous.
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      g.onPointerDown = jest.fn()
      const moves: number[] = []
      g.onPointerMove = (info) => moves.push(info.pointer.dt)
      g.attach(wrapperHTML)

      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1, timeStamp: 1000 })
      )
      const batched = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1,
        timeStamp: 1012,
        coalescedEvents: [
          new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 4, clientY: 4, pressure: 1, timeStamp: 1004 }),
          new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 7, clientY: 7, pressure: 1, timeStamp: 1008.5 }),
          new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 10, clientY: 10, pressure: 1, timeStamp: 1012 }),
        ],
      })
      wrapperHTML.dispatchEvent(batched)

      // Counted from the pointerdown at 1000, and sub-millisecond gaps survive.
      expect(moves).toEqual([4, 8.5, 12])
      g.detach()
    })

    test("should count every pointer of a gesture from that gesture's own pointerdown", () => {
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      const downs: number[] = []
      const moves: number[] = []
      g.onPointerDown = (info) => downs.push(info.pointer.dt)
      g.onPointerMove = (info) => moves.push(info.pointer.dt)
      g.onPointerUp = jest.fn()
      g.attach(wrapperHTML)

      const stroke = (downAt: number, moveAt: number) => {
        wrapperHTML.dispatchEvent(
          new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1, timeStamp: downAt })
        )
        wrapperHTML.dispatchEvent(
          new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: 5, clientY: 5, pressure: 1, timeStamp: moveAt })
        )
        wrapperHTML.dispatchEvent(
          new LeftClickEventMock("pointerup", { pointerType: "pen", clientX: 5, clientY: 5, pressure: 1, timeStamp: moveAt })
        )
      }
      stroke(1000, 1020)
      stroke(5000, 5030)

      // The second stroke restarts at 0 rather than carrying on from the first: where it sits on
      // the timeline is the stroke's `creationTime`, reported alongside as `gestureStartTime`.
      expect(downs).toEqual([0, 0])
      expect(moves).toEqual([20, 30])
      g.detach()
    })

    test("should report the gesture's epoch origin so a symbol can anchor its pointers", () => {
      const g = new PointerEventGrabber(DefaultGrabberConfiguration)
      let start = -1
      g.onPointerDown = (info) => {
        start = info.gestureStartTime
      }
      g.attach(wrapperHTML)
      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1, timeStamp: 1234.5 })
      )
      expect(start).toBeCloseTo(performance.timeOrigin + 1234.5, 3)
      g.detach()
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

  describe("Should filter pointer types with inputMode", () => {
    const wrapperHTML: HTMLElement = document.createElement("div")
    document.body.appendChild(wrapperHTML)

    function createGrabber(inputMode?: TGrabberInputMode): PointerEventGrabber {
      const grabber = new PointerEventGrabber({ ...DefaultGrabberConfiguration, ...(inputMode && { inputMode }) })
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)
      return grabber
    }

    function dispatch(type: string, pointerType: string, timeStamp = 0): void {
      wrapperHTML.dispatchEvent(new LeftClickEventMock(type, { pointerType, clientX: 10, clientY: 10, pressure: 1, timeStamp }))
    }

    test("should accept every pointer type by default", () => {
      expect(DefaultGrabberConfiguration.inputMode).toBe("any")
      const grabber = createGrabber()
      dispatch("pointerdown", "touch")
      dispatch("pointerup", "touch")
      dispatch("pointerdown", "mouse")
      dispatch("pointerup", "mouse")
      dispatch("pointerdown", "pen")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(3)
      grabber.detach()
    })

    test("should only accept pen with inputMode pen", () => {
      const grabber = createGrabber("pen")
      dispatch("pointerdown", "touch")
      dispatch("pointerdown", "mouse")
      expect(grabber.onPointerDown).not.toHaveBeenCalled()
      dispatch("pointerdown", "pen")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(1)
      grabber.detach()
    })

    test("should accept touch with inputMode auto until a pen is seen", () => {
      const grabber = createGrabber("auto")
      dispatch("pointerdown", "touch")
      dispatch("pointerup", "touch")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(1)
      dispatch("pointerdown", "pen")
      dispatch("pointerup", "pen")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(2)
      dispatch("pointerdown", "touch")
      dispatch("pointerdown", "mouse")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(2)
      grabber.detach()
    })

    test("should keep the pen stroke when a palm lands during it", () => {
      // The bug this guards: an accepted palm took over `pointerType`, so the pen moves that
      // followed were dropped and the stroke was cut short.
      const grabber = createGrabber("auto")
      dispatch("pointerdown", "pen")
      dispatch("pointerdown", "touch")
      dispatch("pointermove", "pen")
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(1)
      expect(grabber.onPointerMove).toHaveBeenCalledTimes(1)
      grabber.detach()
    })

    test("should not reset the pen gesture time origin on a rejected palm", () => {
      const grabber = createGrabber("pen")
      const moves: number[] = []
      grabber.onPointerMove = (info) => moves.push(info.pointer.dt)
      dispatch("pointerdown", "pen", 1000)
      dispatch("pointerdown", "touch", 1500)
      dispatch("pointermove", "pen", 1100)
      expect(moves).toEqual([100])
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

    test("should recompute the CTM when the layer capture is reparented without a version bump", () => {
      // Simulates moving the same layerCapture/svg to a different container
      // (e.g. switching between multiple inputs sharing one editor instance).
      // The svg reference and its transform version are unchanged, so the
      // version-keyed cache alone can't detect this move.
      const otherContainer = document.createElement("div")
      document.body.appendChild(otherContainer)
      otherContainer.appendChild(wrapperHTML)
      grabber.attach(wrapperHTML)

      const downEvt = new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 4, clientY: 4, pressure: 1 })
      wrapperHTML.dispatchEvent(downEvt)

      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)
      grabber.detach()
    })
  })

  describe("should look the capture svg up once, not per pointer sample", () => {
    const createSvg = (): SVGSVGElement => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
      svg.getScreenCTM = jest.fn(() => ({ inverse: () => ({}) }) as unknown as DOMMatrix)
      svg.createSVGPoint = jest.fn(() => ({ x: 0, y: 0, matrixTransform: () => ({ x: 1, y: 2 }) }) as unknown as DOMPoint)
      return svg
    }
    const move = (wrapper: HTMLElement, x: number) =>
      wrapper.dispatchEvent(
        new LeftClickEventMock("pointermove", { pointerType: "pen", clientX: x, clientY: x, pressure: 1 })
      )

    test("should not query the svg again on each pointermove", () => {
      const wrapperHTML = document.createElement("div")
      document.body.appendChild(wrapperHTML)
      wrapperHTML.appendChild(createSvg())
      const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
      grabber.attach(wrapperHTML)
      grabber.onPointerMove = jest.fn()
      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 })
      )
      const querySpy = jest.spyOn(wrapperHTML, "querySelector")
      move(wrapperHTML, 1)
      move(wrapperHTML, 2)
      move(wrapperHTML, 3)
      expect(querySpy).not.toHaveBeenCalled()
      expect(grabber.onPointerMove).toHaveBeenCalledTimes(3)
      grabber.detach()
    })

    test("should pick up a capture svg that replaced the cached one", () => {
      const wrapperHTML = document.createElement("div")
      document.body.appendChild(wrapperHTML)
      const oldSvg = createSvg()
      wrapperHTML.appendChild(oldSvg)
      const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
      grabber.attach(wrapperHTML)
      grabber.onPointerMove = jest.fn()
      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 })
      )
      const newSvg = createSvg()
      wrapperHTML.replaceChild(newSvg, oldSvg)
      move(wrapperHTML, 1)
      expect(newSvg.getScreenCTM).toHaveBeenCalledTimes(1)
      grabber.detach()
    })
  })

  describe("pointer capture", () => {
    const setup = () => {
      const wrapperHTML = document.createElement("div")
      document.body.appendChild(wrapperHTML)
      wrapperHTML.setPointerCapture = jest.fn()
      const grabber = new PointerEventGrabber(DefaultGrabberConfiguration)
      grabber.attach(wrapperHTML)
      grabber.onPointerDown = jest.fn()
      return { wrapperHTML, grabber }
    }

    test("should capture the pointer of a gesture so the page outside the canvas never receives it", () => {
      const { wrapperHTML, grabber } = setup()
      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerId: 7, pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 })
      )
      expect(wrapperHTML.setPointerCapture).toHaveBeenCalledWith(7)
      grabber.detach()
    })

    test("should not capture the pointer of a click that opens no gesture", () => {
      const { wrapperHTML, grabber } = setup()
      wrapperHTML.dispatchEvent(
        new RightClickEventMock("pointerdown", { pointerType: "mouse", clientX: 0, clientY: 0, pressure: 1 })
      )
      expect(wrapperHTML.setPointerCapture).not.toHaveBeenCalled()
      grabber.detach()
    })

    test("should still open the gesture when the pointer can not be captured", () => {
      const { wrapperHTML, grabber } = setup()
      wrapperHTML.setPointerCapture = jest.fn(() => {
        throw new DOMException("No active pointer with the given id is found.", "NotFoundError")
      })
      wrapperHTML.dispatchEvent(
        new LeftClickEventMock("pointerdown", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 })
      )
      expect(grabber.onPointerDown).toHaveBeenCalledTimes(1)
      grabber.detach()
    })
  })
})
