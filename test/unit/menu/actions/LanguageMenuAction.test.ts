import fetchMock from "jest-fetch-mock"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { LanguageMenuAction } from "@/iink"

describe("LanguageMenuAction.ts", () => {
  beforeAll(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ""
    fetchMock.resetMocks()
  })

  test("should build a trigger and populate the language select asynchronously", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ result: { en_US: "English", fr_FR: "French" } }))
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.querySelector("#ms-menu-action-language-trigger")).toBeTruthy()
    const select = wrapper.querySelector("select") as HTMLSelectElement
    expect(select.options).toHaveLength(2)
  })

  test("should leave the select empty, not fail, when the language list cannot be fetched", async () => {
    fetchMock.mockResponseOnce("Service Unavailable", { status: 503 })
    const unhandled = jest.fn()
    process.on("unhandledRejection", unhandled)
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()
    await new Promise((resolve) => setTimeout(resolve, 0))

    process.off("unhandledRejection", unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    expect((wrapper.querySelector("select") as HTMLSelectElement).options).toHaveLength(0)
  })

  test("should update the recognition language when a language is picked", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ result: { en_US: "English", fr_FR: "French" } }))
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    await new Promise((resolve) => setTimeout(resolve, 0))
    const select = wrapper.querySelector("select") as HTMLSelectElement

    select.value = "fr_FR"
    select.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.updateRecognitionConfiguration).toHaveBeenCalledWith({ lang: "fr_FR" })
  })

  test("should toggle the select panel open on trigger pointerdown", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ result: {} }))
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-action-language-trigger") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the panel on outside pointerdown", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ result: {} }))
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should not throw and remove the element on destroy()", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ result: {} }))
    const canvas = createCanvasMock()
    const item = new LanguageMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
