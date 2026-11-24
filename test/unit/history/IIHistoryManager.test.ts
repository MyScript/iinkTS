import { CanvasEventMock } from "../__mocks__/CanvasEventMock"
import { buildIIStroke } from "../helpers"
import { THistoryConfiguration, getInitialHistoryContext, IIHistoryManager, IIModel, DefaultHistoryConfiguration } from "@/iink"

describe("IIHistoryManager.ts", () => {
  const event = new CanvasEventMock(document.createElement("div"))

  test("should instanciate IIHistoryManager", () => {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    expect(manager).toBeDefined()
  })

  describe("init", () => {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    test("should initialize HistoryContext", () => {
      const context = getInitialHistoryContext()
      expect(manager.context).toStrictEqual(context)
    })
    test("should init stack without actions and no model", () => {
      manager.init(new IIModel())

      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)
      expect(manager.stack[manager.context.stackIndex]).toEqual({})
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("empty context", () => {
    test("should reflect the live model passed to init, not the stack content", () => {
      const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
      const model = new IIModel()
      manager.init(model)
      expect(manager.context.empty).toStrictEqual(true)

      const stroke = buildIIStroke()
      model.addSymbol(stroke)
      manager.push({ added: [stroke] })
      expect(manager.context.empty).toStrictEqual(false)

      model.removeSymbol(stroke.id)
      manager.push({ erased: [stroke] })
      expect(manager.context.empty).toStrictEqual(true)
    })
  })

  describe("push", () => {
    const configuration: THistoryConfiguration = { maxStackSize: 5 }
    const manager = new IIHistoryManager(configuration, event)
    manager.init(new IIModel())

    test("should not push item to stack without actions and not emitChanged", () => {
      expect(manager.stack).toHaveLength(1)

      manager.push({})

      expect(manager.stack).toHaveLength(1)
      expect(manager.event.emitChanged).toHaveBeenCalledTimes(0)
    })

    test("should push changes to stack with action added and emitChanged", () => {
      const stroke = buildIIStroke()
      manager.push({ added: [stroke] })

      expect(manager.context.stackIndex).toStrictEqual(1)
      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual({ added: [stroke] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should splice end of stack if stackIndex not last and emitChanged", () => {
      const NB_STROKE = 5
      for (let i = 0; i < NB_STROKE; i++) {
        manager.push({ added: [buildIIStroke()] })
      }
      expect(manager.context.stackIndex).toStrictEqual(configuration.maxStackSize - 1)
      expect(manager.stack).toHaveLength(configuration.maxStackSize)

      manager.context.stackIndex = 0

      const stroke = buildIIStroke()
      manager.push({ added: [stroke] })

      expect(manager.context.stackIndex).toEqual(1)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual({ added: [stroke] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should shift the first element of the stack when maxStackSize is exceeded and emitChanged", () => {
      const NB_STROKE = 10
      for (let i = 0; i < NB_STROKE; i++) {
        manager.push({ added: [buildIIStroke()] })
      }

      manager.push({})
      expect(manager.context.stackIndex + 1).toStrictEqual(configuration.maxStackSize)

      expect(manager.stack).toHaveLength(configuration.maxStackSize)
      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("undo", () => {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    manager.init(new IIModel())

    test("should define canUndo to false and canRedo to false", () => {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
    })

    test("should invert added action", () => {
      const stroke = buildIIStroke()
      manager.push({ added: [stroke] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ erased: [stroke] })
    })

    test("should define canUndo to false and canRedo to true", () => {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(true)
    })

    test("should invert erased action", () => {
      const stroke = buildIIStroke()
      manager.push({ erased: [stroke] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ added: [stroke] })
    })

    test("should invert replaced action", () => {
      const oldStroke = buildIIStroke()
      const newStroke = buildIIStroke()
      manager.push({ replaced: { newSymbols: [newStroke], oldSymbols: [oldStroke] } })
      const reversed = manager.undo()
      expect(reversed).toEqual({ replaced: { newSymbols: [oldStroke], oldSymbols: [newStroke] } })
    })

    test("should invert a variable change alone by swapping its values", () => {
      manager.push({ variables: [{ strokeIds: ["s1"], name: "x", before: 2, after: 4 }] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ variables: [{ strokeIds: ["s1"], name: "x", before: 4, after: 2 }] })
    })

    test("should invert updated by swapping each pair", () => {
      const before = buildIIStroke()
      const after = buildIIStroke()
      manager.push({ updated: [{ before, after }] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ updated: [{ before: after, after: before }] })
    })

    /**
     * The reason `updated` is a list of pairs and not two parallel lists: one undoable step gathers
     * symbols from more than one source — a transform records the symbols dragged *and* the
     * connected edges recomputed from them — and two lists that fell out of step paired the wrong
     * symbols together on undo, silently.
     */
    test("should keep every pair together through a reversal", () => {
      const a = buildIIStroke()
      const aMoved = buildIIStroke()
      const b = buildIIStroke()
      const bMoved = buildIIStroke()
      manager.push({
        updated: [
          { before: a, after: aMoved },
          { before: b, after: bMoved },
        ],
      })

      const reversed = manager.undo()

      expect(reversed.updated).toEqual([
        { before: aMoved, after: a },
        { before: bMoved, after: b },
      ])
    })

    /**
     * A restyle used to have its own form, carrying the styles before and after. It is a change to
     * the symbol's record like any other now, so the pair carries it with no extra machinery — and
     * a font change, which also moves the text's geometry, comes back whole rather than needing the
     * `oldFontSizes` list the old form had to keep alongside.
     */
    test("should invert a restyle, which is now just a pair", () => {
      const before = buildIIStroke()
      before.style = { ...before.style, color: "red" }
      const after = buildIIStroke()
      after.id = before.id
      after.style = { ...after.style, color: "blue" }
      manager.push({ updated: [{ before, after }] })

      const reversed = manager.undo()

      expect(reversed.updated).toEqual([{ before: after, after: before }])
      expect(reversed.updated![0].after.style.color).toBe("red")
    })
  })

  describe("redo", () => {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    manager.init(new IIModel())

    test("should return the next changes as pushed", () => {
      const stroke = buildIIStroke()
      manager.push({ added: [stroke] })
      manager.undo()
      const next = manager.redo()

      expect(manager.context.stackIndex).toStrictEqual(1)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual(next)
      expect(next).toEqual({ added: [stroke] })

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
    })
  })
})
