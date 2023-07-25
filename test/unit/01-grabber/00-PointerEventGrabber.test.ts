import { TGrabberConfiguration } from "../../../src/@types/configuration/GrabberConfiguration"
import { IGrabber } from "../../../src/@types/grabber/Grabber"
import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { PointerEventGrabber } from "../../../src/grabber/PointerEventGrabber"
import { DoubleTouchEventFake, LeftClickEventFake, RightClickEventFake, TouchEventFake } from "../utils/PointerEventFake"

describe('PointerEventGrabber.ts', () =>
{

  test('should create with default configuration', () =>
  {
    const grabber: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
    expect(grabber).toBeDefined()
  })

  describe('should attach & detach', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.width = '100px'
    wrapperHTML.style.height = '100px'
    document.body.appendChild(wrapperHTML)

    const grabber: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()
    grabber.onPointerMove = jest.fn()
    grabber.onPointerUp = jest.fn()

    const pointerDownEvt = new LeftClickEventFake('pointerdown', {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })

    const pointerMoveEvt = new LeftClickEventFake('pointermove', {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerMoveEvt.pointerId = pointerDownEvt.pointerId

    const pointerUpEvt = new LeftClickEventFake('pointerup', {
      pointerType: "pen",
      clientX: 15,
      clientY: 15,
      pressure: 1
    })
    pointerUpEvt.pointerId = pointerDownEvt.pointerId

    test('should listen pointerdown event', () =>
    {
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).toBeCalledTimes(1)
    })

    test('should listen pointermove event', () =>
    {
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).toBeCalledTimes(1)
    })

    test('should listen pointerup event', () =>
    {
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).toBeCalledTimes(1)
    })

    test('should call detach if already attach', () =>
    {
      const g: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
      g.onPointerDown = jest.fn()
      g.onPointerMove = jest.fn()
      g.onPointerUp = jest.fn()
      g.detach = jest.fn()
      g.attach(wrapperHTML)
      g.attach(wrapperHTML)
      expect(g.detach).toBeCalledTimes(1)
    })

    test('should not listen pointerdown event after detach', () =>
    {
      grabber.detach(wrapperHTML)
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
    })

    test('should not listen pointermove event after detach', () =>
    {
      grabber.detach(wrapperHTML)
      wrapperHTML.dispatchEvent(pointerMoveEvt)
      expect(grabber.onPointerMove).not.toBeCalled()
    })

    test('should not listen pointerup event after detach', () =>
    {
      grabber.detach(wrapperHTML)
      wrapperHTML.dispatchEvent(pointerUpEvt)
      expect(grabber.onPointerUp).not.toBeCalled()
    })
  })

  describe('Should extract TPointer from event', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.width = '100px'
    wrapperHTML.style.height = '100px'
    document.body.appendChild(wrapperHTML)

    const grabber: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
    grabber.onPointerDown = jest.fn()
    grabber.attach(wrapperHTML)

    test('should extract TPointer from mouseEvent', () =>
    {
      const mouseDownEvt = new LeftClickEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      wrapperHTML.dispatchEvent(mouseDownEvt)

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

    test('should extract TPointer from touchEvent', () =>
    {
      const touchDownEvt = new TouchEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 2705,
        clientY: 1989,
        pressure: 1
      })

      wrapperHTML.dispatchEvent(touchDownEvt)

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

  describe('Should use configuration', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.width = '100px'
    wrapperHTML.style.height = '100px'
    document.body.appendChild(wrapperHTML)

    const pointerDownEvt = new LeftClickEventFake('pointerdown', {
      pointerType: "pen",
      clientX: 2705,
      clientY: 1989,
      pressure: 1
    })

    test('should not round values with default configuration', () =>
    {
      const grabber: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      wrapperHTML.dispatchEvent(pointerDownEvt)

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

    test('should round values from configuration', () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultConfiguration.grabber, xyFloatPrecision: 2 }
      const grabber: IGrabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

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

    test('should not round values from configuration if negative precision', () =>
    {
      const grabberConfig: TGrabberConfiguration = { ...DefaultConfiguration.grabber, xyFloatPrecision: -2 }
      const grabber: IGrabber = new PointerEventGrabber(grabberConfig)
      grabber.onPointerDown = jest.fn()
      grabber.onPointerMove = jest.fn()
      grabber.onPointerUp = jest.fn()
      grabber.attach(wrapperHTML)

      grabber.onPointerDown = jest.fn()

      wrapperHTML.dispatchEvent(pointerDownEvt)

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

  describe('Should ignore Event', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.width = '100px'
    wrapperHTML.style.height = '100px'
    document.body.appendChild(wrapperHTML)

    const grabber: IGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
    grabber.attach(wrapperHTML)
    grabber.onPointerDown = jest.fn()

    test('should not listen right click event', () =>
    {
      const pointerDownEvt = new RightClickEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach(wrapperHTML)
    })

    test('should not listen right click event', () =>
    {
      const pointerDownEvt = new DoubleTouchEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      wrapperHTML.dispatchEvent(pointerDownEvt)
      expect(grabber.onPointerDown).not.toBeCalled()
      grabber.detach(wrapperHTML)
    })
  })

})
