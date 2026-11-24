import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ZoomMenuAction } from "@/iink"

describe("ZoomMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build zoom-in/level/zoom-out buttons, showing the initial zoom as a percentage", () => {
    const canvas = createCanvasMock()
    const item = new ZoomMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-zoom-in")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-zoom-out")).toBeTruthy()
    expect((wrapper.querySelector("#ms-menu-action-zoom-level") as HTMLButtonElement).textContent).toEqual("100%")
  })

  test("should zoom in by a factor of 1.2 on zoom-in click", () => {
    const canvas = createCanvasMock()
    const item = new ZoomMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const zoomInButton = wrapper.querySelector("#ms-menu-action-zoom-in") as HTMLButtonElement

    zoomInButton.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.renderer.setZoom).toHaveBeenCalledWith(1.2)
  })

  test("should zoom out by a factor of 1.2 on zoom-out click", () => {
    const canvas = createCanvasMock()
    const item = new ZoomMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const zoomOutButton = wrapper.querySelector("#ms-menu-action-zoom-out") as HTMLButtonElement

    zoomOutButton.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.renderer.setZoom).toHaveBeenCalledWith(1 / 1.2)
  })

  test("should reset the zoom to 1 on zoom-level click", () => {
    const canvas = createCanvasMock()
    const item = new ZoomMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const zoomLevelButton = wrapper.querySelector("#ms-menu-action-zoom-level") as HTMLButtonElement

    zoomLevelButton.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.renderer.setZoom).toHaveBeenCalledWith(1)
  })

  test("should refresh the displayed zoom percentage on update()", () => {
    const canvas = createCanvasMock()
    const item = new ZoomMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    const zoomLevelButton = wrapper.querySelector("#ms-menu-action-zoom-level") as HTMLButtonElement
    ;(canvas.renderer.getZoom as jest.Mock).mockReturnValue(1.5)

    item.update()

    expect(zoomLevelButton.textContent).toEqual("150%")
  })
})
