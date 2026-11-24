import { Modal, TModalConfig } from "@/iink"

describe("Modal.ts", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should create modal with basic config", () => {
    const config: TModalConfig = {
      title: "Test Modal",
      fields: [
        {
          id: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter name",
        },
      ],
      buttons: [
        {
          label: "OK",
          variant: "primary",
          onClick: jest.fn(),
        },
      ],
    }

    const modal = new Modal(config)
    expect(modal).toBeDefined()
  })

  test("should create modal with multiple field types", () => {
    const config: TModalConfig = {
      title: "Test Modal",
      fields: [
        {
          id: "name",
          label: "Name",
          type: "text",
          defaultValue: "John",
        },
        {
          id: "age",
          label: "Age",
          type: "number",
          defaultValue: 25,
        },
        {
          id: "country",
          label: "Country",
          type: "select",
          options: [
            { value: "fr", label: "France" },
            { value: "us", label: "USA" },
          ],
          defaultValue: "fr",
        },
      ],
      buttons: [
        {
          label: "Submit",
          variant: "primary",
          onClick: jest.fn(),
        },
      ],
    }

    const modal = new Modal(config)
    expect(modal).toBeDefined()
  })

  describe("open()", () => {
    test("should open modal and add to DOM", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [
          {
            label: "Close",
            variant: "secondary",
            onClick: jest.fn(),
          },
        ],
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector(".ms-modal-backdrop") as HTMLDivElement
      expect(backdrop).toBeTruthy()
      expect(backdrop.style.display).toBe("block")

      const modalElements = document.querySelectorAll(".ms-modal, .ms-modal-backdrop")
      expect(modalElements.length).toBeGreaterThan(1)
    })

    test("should focus first input after opening", (done) => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "name",
            label: "Name",
            type: "text",
          },
        ],
        buttons: [
          {
            label: "OK",
            variant: "primary",
            onClick: jest.fn(),
          },
        ],
      }

      const modal = new Modal(config)
      modal.open()

      setTimeout(() => {
        const input = document.querySelector("#name") as HTMLInputElement
        expect(input).toBeTruthy()
        expect(document.activeElement).toBe(input)
        done()
      }, 100)
    })

    test("should not open if already open", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()
      const initialCount = document.querySelectorAll(".ms-modal, .ms-modal-backdrop").length

      modal.open()
      const finalCount = document.querySelectorAll(".ms-modal, .ms-modal-backdrop").length

      expect(initialCount).toBe(finalCount)
    })
  })

  describe("close()", () => {
    test("should close modal", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector(".ms-modal-backdrop") as HTMLDivElement
      expect(backdrop.style.display).toBe("block")

      modal.close()
      expect(backdrop.style.display).toBe("none")
    })

    test("should not close if already closed", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.close()

      // Should not throw error
      expect(() => modal.close()).not.toThrow()
    })
  })

  describe("destroy()", () => {
    test("should remove modal from DOM", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      expect(document.body.children.length).toBeGreaterThan(0)

      modal.destroy()

      expect(document.body.children.length).toBe(1) // Only container remains
    })
  })

  describe("button callbacks", () => {
    test("should call onClick when button is clicked", async () => {
      const onClick = jest.fn()
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [{ id: "name", label: "Name", type: "text", defaultValue: "John" }],
        buttons: [{ label: "Submit", variant: "primary", onClick }],
      }

      const modal = new Modal(config)
      modal.open()

      const submitButton = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent === "Submit"
      ) as HTMLButtonElement
      expect(submitButton).toBeTruthy()
      submitButton.click()

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(onClick).toHaveBeenCalled()
    })

    test("should handle async button onClick", async () => {
      const onClick = jest.fn().mockResolvedValue(undefined)
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [{ label: "Async", variant: "primary", onClick }],
      }

      const modal = new Modal(config)
      modal.open()

      const asyncButton = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent === "Async"
      ) as HTMLButtonElement
      expect(asyncButton).toBeTruthy()
      asyncButton.click()

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(onClick).toHaveBeenCalled()
    })
  })

  describe("custom content", () => {
    test("should render custom content", () => {
      const customDiv = document.createElement("div")
      customDiv.id = "custom-content"
      customDiv.textContent = "Custom content here"

      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        customContent: customDiv,
      }

      const modal = new Modal(config)
      modal.open()

      const found = document.querySelector("#custom-content")
      expect(found).toBeTruthy()
      expect(found?.textContent).toBe("Custom content here")
    })
  })

  describe("field rendering", () => {
    test("should render text input with default value", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [{ id: "email", label: "Email", type: "text", defaultValue: "test@example.com" }],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      const input = document.querySelector("#email") as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.value).toBe("test@example.com")
    })

    test("should render number input with default value", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [{ id: "age", label: "Age", type: "number", defaultValue: 30 }],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      const input = document.querySelector("#age") as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.value).toBe("30")
    })

    test("should render select with correct default value", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
            defaultValue: "inactive",
          },
        ],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      const select = document.querySelector("#status") as HTMLSelectElement
      expect(select).toBeTruthy()
      expect(select.value).toBe("inactive")
    })
  })

  describe("backdrop interaction", () => {
    test("should close modal when clicking backdrop", () => {
      const config: TModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector(".ms-modal-backdrop") as HTMLDivElement
      expect(backdrop).toBeTruthy()

      backdrop.click()

      expect(backdrop.style.display).toBe("none")
    })
  })
})
