import { CanvasEventMock } from "../__mocks__/CanvasEventMock"
import { buildStrokeV2 } from "../helpers"
import { THistoryConfiguration, getInitialHistoryContext, IHistoryManager, DefaultHistoryConfiguration } from "@/iink"

describe("IHistoryManager.ts", () => {
  const event = new CanvasEventMock(document.createElement("div"))

  test("should instanciate IHistoryManager", () => {
    const manager = new IHistoryManager(DefaultHistoryConfiguration, event)
    expect(manager).toBeDefined()
  })

  describe("init", () => {
    const manager = new IHistoryManager(DefaultHistoryConfiguration, event)
    test("should initialize HistoryContext", () => {
      const context = getInitialHistoryContext()
      expect(manager.context).toStrictEqual(context)
    })
    test("should init stack without actions and no model", () => {
      manager.init()

      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)
      expect(manager.stack[manager.context.stackIndex]).toEqual({})
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("push", () => {
    const configuration: THistoryConfiguration = { maxStackSize: 5 }
    const manager = new IHistoryManager(configuration, event)
    manager.init()

    test("should not push item to stack without actions and not emitChanged", () => {
      expect(manager.stack).toHaveLength(1)

      manager.push({})

      expect(manager.stack).toHaveLength(1)
      expect(manager.event.emitChanged).toHaveBeenCalledTimes(0)
    })

    test("should push changes to stack with action added and emitChanged", () => {
      const stroke = buildStrokeV2()
      manager.push({ added: [stroke] })

      expect(manager.context.stackIndex).toStrictEqual(1)
      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(false)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual({ added: [stroke] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should splice end of stack if stackIndex not last and emitChanged", () => {
      const NB_STROKE = 5
      for (let i = 0; i < NB_STROKE; i++) {
        manager.push({ added: [buildStrokeV2()] })
      }
      expect(manager.context.stackIndex).toStrictEqual(configuration.maxStackSize - 1)
      expect(manager.stack).toHaveLength(configuration.maxStackSize)

      manager.context.stackIndex = 0

      const stroke = buildStrokeV2()
      manager.push({ added: [stroke] })

      expect(manager.context.stackIndex).toEqual(1)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual({ added: [stroke] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should shift the first element of the stack when maxStackSize is exceeded and emitChanged", () => {
      const NB_STROKE = 10
      for (let i = 0; i < NB_STROKE; i++) {
        manager.push({ added: [buildStrokeV2()] })
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
    const manager = new IHistoryManager(DefaultHistoryConfiguration, event)
    manager.init()

    test("should define canUndo to false and canRedo to false", () => {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
    })

    test("should invert added action", () => {
      const stroke = buildStrokeV2()
      manager.push({ added: [stroke] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ removed: [stroke] })
    })

    test("should define canUndo to false and canRedo to true", () => {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(true)
    })

    test("should invert removed action", () => {
      const stroke = buildStrokeV2()
      manager.push({ removed: [stroke] })
      const reversed = manager.undo()
      expect(reversed).toEqual({ added: [stroke] })
    })
  })

  describe("redo", () => {
    const manager = new IHistoryManager(DefaultHistoryConfiguration, event)
    manager.init()

    test("should return the next changes as pushed", () => {
      const stroke = buildStrokeV2()
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
