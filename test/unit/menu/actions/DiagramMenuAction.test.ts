import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { DiagramMenuAction } from "@/iink"

describe("DiagramMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a submenu with a follow-connected-edges checkbox", () => {
    const canvas = createCanvasMock()
    canvas.connector.connectorConfiguration = { followConnectedEdges: false }
    const item = new DiagramMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-diagram-trigger")).toBeTruthy()
    const checkbox = wrapper.querySelector("#ms-menu-action-diagram-follow-connected-edges-input") as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  test("should toggle canvas.connector.connectorConfiguration.followConnectedEdges", () => {
    const canvas = createCanvasMock()
    canvas.connector.connectorConfiguration = { followConnectedEdges: false }
    const item = new DiagramMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-diagram-follow-connected-edges-input") as HTMLInputElement

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.connector.connectorConfiguration.followConnectedEdges).toBe(true)
  })
})
