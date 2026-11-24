import { CollapsibleWrapper } from "@/iink"

describe("CollapsibleWrapper.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a wrapper with the given id, title and content", () => {
    const content = document.createElement("p")
    content.textContent = "content"
    const wrapper = new CollapsibleWrapper(content, "Title", "test-id")

    const element = wrapper.getElement()

    expect(element.id).toEqual("test-id")
    expect(element.querySelector(".collapsible-header")?.textContent).toContain("Title")
    expect(element.querySelector(".collapsible-content")?.contains(content)).toBe(true)
  })

  test("should not be active by default and toggle 'active' on header click", () => {
    const wrapper = new CollapsibleWrapper(document.createElement("div"), "Title")
    const element = wrapper.getElement()
    expect(element.classList.contains("active")).toBe(false)

    const header = element.querySelector(".collapsible-header") as HTMLDivElement
    header.dispatchEvent(new Event("click", { bubbles: true }))

    expect(element.classList.contains("active")).toBe(true)
  })

  test("should set active state via setActive()", () => {
    const wrapper = new CollapsibleWrapper(document.createElement("div"), "Title")

    wrapper.setActive(true)
    expect(wrapper.getElement().classList.contains("active")).toBe(true)

    wrapper.setActive(false)
    expect(wrapper.getElement().classList.contains("active")).toBe(false)
  })

  test("should toggle active state via toggle()", () => {
    const wrapper = new CollapsibleWrapper(document.createElement("div"), "Title")

    wrapper.toggle()
    expect(wrapper.getElement().classList.contains("active")).toBe(true)

    wrapper.toggle()
    expect(wrapper.getElement().classList.contains("active")).toBe(false)
  })

  test("should remove the element from the DOM on destroy()", () => {
    const wrapper = new CollapsibleWrapper(document.createElement("div"), "Title")
    const element = wrapper.getElement()
    document.body.appendChild(element)

    wrapper.destroy()

    expect(document.body.contains(element)).toBe(false)
  })
})
