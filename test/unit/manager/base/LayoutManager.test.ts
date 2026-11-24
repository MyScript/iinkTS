import { CanvasLayer, LayoutManager, LoggerCategory, LoggerManager, slotAnchor, slotOpenTowards, slotOrientation, TLayoutConfiguration, TLayoutOccupant } from "@/iink"

const INTERACTIVE_OCCUPANTS = ["action", "style", "tool", "state", "minimap"]

describe("LayoutManager.ts", () => {
  function build(configuration?: TLayoutConfiguration, occupants: string[] = INTERACTIVE_OCCUPANTS) {
    const layers = new CanvasLayer(document.createElement("div"))
    return { layers, layout: new LayoutManager(layers, occupants, configuration) }
  }

  describe("placement", () => {
    test("should place every occupant in its default slot", () => {
      const { layout } = build()
      expect(layout.slotOf("action")).toBe("top-left")
      expect(layout.slotOf("style")).toBe("top-right")
      expect(layout.slotOf("tool")).toBe("bottom-center")
      expect(layout.slotOf("state")).toBe("bottom-left")
      expect(layout.slotOf("minimap")).toBe("bottom-right")
    })

    test("should move an occupant out of its default slot, the others keeping theirs", () => {
      const { layout } = build({ "bottom-center": ["action", "tool"] })
      // Moved: not in its default slot as well, which a merged array would have kept
      expect(layout.slotOf("action")).toBe("bottom-center")
      expect(layout.slotOf("tool")).toBe("bottom-center")
      expect(layout.slotOf("style")).toBe("top-right")
    })

    test("should keep only the first slot naming an occupant twice, with a warning", () => {
      const warn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CANVAS), "warn")
      const { layout } = build({ "top-center": ["tool"], "bottom-center": ["tool"] })
      expect(layout.slotOf("tool")).toBe("top-center")
      expect(warn).toHaveBeenCalledWith("layout", '"tool" is already placed: ignored in "bottom-center"')
      warn.mockRestore()
    })

    test("should ignore, with a warning, an occupant this canvas lacks", () => {
      const warn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CANVAS), "warn")
      const { layout } = build({ "top-center": ["action"] }, ["state"])
      expect(layout.slotOf("action")).toBeUndefined()
      expect(warn).toHaveBeenCalledWith("layout", 'No "action" in this canvas: ignored in "top-center"')
      warn.mockRestore()
    })

    test("should place none of the default menus in a canvas without menus", () => {
      const { layout } = build(undefined, ["state"])
      expect(layout.slotOf("action")).toBeUndefined()
      expect(layout.slotOf("state")).toBe("bottom-left")
    })

    test("should empty a slot configured with no occupant", () => {
      const { layout } = build({ "top-right": [] })
      expect(layout.slotOf("style")).toBeUndefined()
    })
  })

  describe("render", () => {
    test("should build only the slots holding occupants, with a host per occupant in table order", () => {
      const { layers, layout } = build({ "bottom-center": ["action", "tool"] })
      layout.render()

      const slots = layers.ui.root.querySelectorAll(".ms-layout-slot")
      expect(Array.from(slots).map((slot) => slot.className)).toEqual([
        "ms-layout-slot ms-layout-top-right",
        "ms-layout-slot ms-layout-bottom-left",
        "ms-layout-slot ms-layout-bottom-center",
        "ms-layout-slot ms-layout-bottom-right",
      ])
      const bottomCenter = layers.ui.root.querySelector(".ms-layout-bottom-center")!
      expect(Array.from(bottomCenter.children)).toEqual([layout.host("action"), layout.host("tool")])
    })

    test("should move the connection state into its slot", () => {
      const { layers, layout } = build({ "top-center": ["state"] })
      layout.render()
      expect(layers.ui.state.root.parentElement).toBe(layout.host("state"))
      expect(layout.host("state")?.parentElement?.classList.contains("ms-layout-top-center")).toBe(true)
    })

    test("should have no host before render nor for an occupant this canvas lacks", () => {
      const { layout } = build(undefined, ["state"])
      expect(layout.host("state")).toBeUndefined()
      layout.render()
      expect(layout.host("action")).toBeUndefined()
    })

    test("should remove its slots on destroy", () => {
      const { layers, layout } = build()
      layout.render()
      layout.destroy()
      expect(layers.ui.root.querySelector(".ms-layout-slot")).toBeNull()
      expect(layout.host("tool")).toBeUndefined()
    })
  })
})

describe("slot geometry", () => {
  test.each([
    ["top-left", "horizontal", "down", "start"],
    ["top-center", "horizontal", "down", "center"],
    ["top-right", "horizontal", "down", "end"],
    ["middle-left", "vertical", "right", "start"],
    ["middle-right", "vertical", "left", "end"],
    ["bottom-left", "horizontal", "up", "start"],
    ["bottom-center", "horizontal", "up", "center"],
    ["bottom-right", "horizontal", "up", "end"],
  ] as const)("%s: %s bars opening %s, anchored at the %s", (slot, orientation, openTowards, anchor) => {
    expect(slotOrientation(slot)).toBe(orientation)
    expect(slotOpenTowards(slot)).toBe(openTowards)
    expect(slotAnchor(slot)).toBe(anchor)
  })
})

describe("LayoutManager at runtime", () => {
  const canvas = { name: "canvas" }

  function rendered(configuration?: TLayoutConfiguration, registered: TLayoutOccupant<typeof canvas>[] = []) {
    const layers = new CanvasLayer(document.createElement("div"))
    const layout = new LayoutManager(layers, INTERACTIVE_OCCUPANTS, configuration, canvas, registered)
    layout.render()
    return { layers, layout }
  }

  function badge(text: string): HTMLElement {
    const element = document.createElement("span")
    element.textContent = text
    return element
  }

  test("should move an occupant on set, keeping its host and content, and announce only that move", () => {
    const { layout } = rendered()
    const toolHost = layout.host("tool")!
    toolHost.appendChild(badge("tool content"))
    const moves: [string, string | undefined][] = []
    layout.onOccupantMoved((occupant, slot) => moves.push([occupant, slot]))

    layout.set({ "middle-left": ["tool"] })

    expect(layout.slotOf("tool")).toBe("middle-left")
    expect(layout.host("tool")).toBe(toolHost)
    expect(toolHost.textContent).toBe("tool content")
    expect(toolHost.parentElement?.classList.contains("ms-layout-middle-left")).toBe(true)
    expect(moves).toEqual([["tool", "middle-left"]])
  })

  test("should build a custom occupant into its slot, with the slot's context", () => {
    const { layout } = rendered()
    const factory = jest.fn(() => badge("mine"))

    layout.add("mine", factory, { slot: "middle-right" })

    expect(factory).toHaveBeenCalledWith(canvas, { slot: "middle-right", orientation: "vertical", openTowards: "left" })
    expect(layout.host("mine")?.textContent).toBe("mine")
  })

  test("should place a custom occupant next to another one of its slot", () => {
    const { layout } = rendered()
    layout.add("before-tool", () => badge("a"), { slot: "bottom-center", before: "tool" })
    layout.add("after-tool", () => badge("b"), { slot: "bottom-center", after: "tool" })
    expect(layout.occupantsOf("bottom-center")).toEqual(["before-tool", "tool", "after-tool"])
  })

  test("should rebuild a custom occupant moved to another slot, for that slot", () => {
    const { layout } = rendered()
    const factory = jest.fn((_canvas: typeof canvas, { slot }: { slot: string }) => badge(slot))
    layout.add("mine", factory, { slot: "top-center" })

    layout.set({ "middle-left": ["mine"] })

    expect(factory).toHaveBeenCalledTimes(2)
    expect(layout.host("mine")?.textContent).toBe("middle-left")
  })

  test("should refuse a key already taken, built-in or added", () => {
    const { layout } = rendered()
    expect(() => layout.add("tool", () => badge("x"))).toThrow('"tool" is already an occupant of the layout')
    layout.add("mine", () => badge("x"))
    expect(() => layout.add("mine", () => badge("x"))).toThrow('"mine" is already an occupant of the layout')
  })

  test("should show nothing, with a warning, for an occupant no slot places", () => {
    const warn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CANVAS), "warn")
    const { layout } = rendered()
    layout.add("orphan", () => badge("x"))
    expect(layout.host("orphan")).toBeUndefined()
    expect(warn).toHaveBeenCalledWith("layout", '"orphan" is not placed in any slot: not shown')
    // The table can place it later
    layout.set({ "top-center": ["orphan"] })
    expect(layout.host("orphan")?.textContent).toBe("x")
    warn.mockRestore()
  })

  test("should remove a custom occupant and its slot, and say whether there was one", () => {
    const { layers, layout } = rendered()
    layout.add("mine", () => badge("x"), { slot: "top-center" })
    expect(layout.remove("mine")).toBe(true)
    expect(layers.ui.root.querySelector(".ms-layout-top-center")).toBeNull()
    expect(layout.remove("mine")).toBe(false)
  })

  test("should keep rendering the layout when a factory throws", () => {
    const { layout } = rendered()
    layout.add("broken", () => {
      throw new Error("boom")
    }, { slot: "top-center" })
    expect(layout.host("tool")).toBeDefined()
  })

  test("should take the occupants declared at load and build them on the first render", () => {
    const factory = jest.fn(() => badge("declared"))
    const { layout } = rendered(undefined, [{ key: "declared", factory, slot: "top-center" }])
    expect(factory).toHaveBeenCalledTimes(1)
    expect(layout.host("declared")?.textContent).toBe("declared")
  })
})
