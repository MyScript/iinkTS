import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { AbstractWriterManager, TPointer, TPointerInfo, TStyle, TSymbol } from "@/iink"

class TestWriterManager extends AbstractWriterManager {
  protected createCurrentSymbol(_pointer: TPointer, style: TStyle): TSymbol {
    return buildIIStroke({ style })
  }
  protected updateCurrentSymbol(): TSymbol {
    return this.currentSymbol as TSymbol
  }
  async end(): Promise<void> {
    // no-op test double
  }
}

describe("AbstractWriterManager.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let manager: TestWriterManager

  beforeEach(() => {
    canvas = createCanvasMock()
    manager = new TestWriterManager(asCanvas(canvas))
  })

  test("should expose renderer as a convenience getter for canvas.renderer", () => {
    expect(manager.renderer).toBe(canvas.renderer)
  })

  test("should wire the grabber callbacks and attach it to the layer on attach()", () => {
    const attachSpy = jest.spyOn(manager.grabber, "attach")
    const layer = document.createElement("div")

    manager.attach(layer)

    expect(attachSpy).toHaveBeenCalledWith(layer)
    expect(manager.grabber.onPointerDown).toBeInstanceOf(Function)
    expect(manager.grabber.onPointerMove).toBeInstanceOf(Function)
    expect(manager.grabber.onPointerUp).toBeInstanceOf(Function)
  })

  test("should detach the grabber on detach()", () => {
    const detachSpy = jest.spyOn(manager.grabber, "detach")

    manager.detach()

    expect(detachSpy).toHaveBeenCalledTimes(1)
  })

  test("should create and draw the current symbol on start()", () => {
    const info = { pointer: { dt: 1, p: 1, x: 1, y: 1 } } as TPointerInfo

    manager.start(info)

    expect(manager.currentSymbol).toBeDefined()
    expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentSymbol)
  })

  test("should update and draw the current symbol on continue()", () => {
    const info = { pointer: { dt: 1, p: 1, x: 1, y: 1 } } as TPointerInfo
    manager.start(info)

    manager.continue(info)

    expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentSymbol)
  })
})
