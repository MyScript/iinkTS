import { delay } from "../helpers"
import
{
  TPointer,
  THistoryConfiguration,
  getInitialHistoryContext,
  HistoryManager,
  Model,
  DefaultHistoryConfiguration,
  DefaultPenStyle
} from "../../../src/iink"
import { EditorEventMock } from "../__mocks__/EditorEventMock"

describe("HistoryManager.ts", () =>
{
  const event = new EditorEventMock(document.createElement("div"))
  test("should instanciate HistoryManager", () =>
  {
    const manager = new HistoryManager(DefaultHistoryConfiguration, event)
    expect(manager).toBeDefined()
  })

  test("should initialize HistoryContext", () =>
  {
    const manager = new HistoryManager(DefaultHistoryConfiguration, event)
    const context = getInitialHistoryContext()
    expect(manager.context).toStrictEqual(context)
  })

  describe("push", () =>
  {
    const configuration: THistoryConfiguration = { maxStackSize: 5 }
    const model1 = new Model(27, 5)
    const model2 = new Model(42, 72)
    const model3 = new Model(42, 72)
    const manager = new HistoryManager(configuration, event)

    test("should add model to stack and emitChanged", () =>
    {
      manager.push(model1)

      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)
      expect(manager.stack[manager.context.stackIndex]).toEqual(model1)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(model1)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should add 2nd model to stack and emitChanged", () =>
    {
      model2.initCurrentStroke({ t: 1, p: 0.5, x: 1, y: 1 }, "pen", DefaultPenStyle)
      model2.endCurrentStroke({ t: 15, p: 0.5, x: 10, y: 1 })
      manager.push(model2)

      expect(manager.context.stackIndex).toStrictEqual(1)
      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(false)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual(model2)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(model2)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should splice end of stack if stackIndex no last and emitChanged", () =>
    {
      const NB_STROKE = 4
      for (let i = 0; i < NB_STROKE; i++) {
        model3.initCurrentStroke({ t: i * 5, p: 1, x: i * 10, y: 10 }, "pen", DefaultPenStyle)
        model3.endCurrentStroke({ t: i * 10, p: 1, x: i * 10, y: 10 })
        manager.push(model3)
      }
      expect(manager.context.stackIndex).toStrictEqual(NB_STROKE)
      expect(manager.stack).toHaveLength(NB_STROKE + 1)

      manager.context.stackIndex = 0

      const p1: TPointer = { t: 27, p: 0.5, x: 1989, y: 2022 }
      model3.initCurrentStroke(p1, "pen", DefaultPenStyle)

      const p2: TPointer = { t: 75, p: 1, x: 200, y: 10 }
      model3.endCurrentStroke(p2)

      manager.push(model3)

      expect(manager.context.stackIndex).toEqual(1)
      expect(manager.stack).toHaveLength(2)

      expect(manager.stack[manager.context.stackIndex]).toEqual(model3)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(model3)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should shift the first element of the stack when maxStackSize is exceeded and emitChanged", () =>
    {
      const NB_STROKE = 10
      for (let i = 0; i < NB_STROKE; i++) {
        const p1: TPointer = { t: i * 42, p: 0.5, x: i / 2, y: i * 20 }
        model3.initCurrentStroke(p1, "pen", DefaultPenStyle)

        const p2: TPointer = { t: i * 10, p: 1, x: i * 10, y: 10 }
        model3.endCurrentStroke(p2)

        manager.push(model3)
      }

      manager.push(model3)
      expect(manager.context.stackIndex + 1).toStrictEqual(configuration.maxStackSize)

      expect(manager.stack).toHaveLength(configuration.maxStackSize)
      expect(manager.stack[manager.context.stackIndex]).toEqual(model3)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(model3)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("undo", () =>
  {
    const model = new Model(27, 5)
    const manager = new HistoryManager(DefaultHistoryConfiguration, event)
    manager.push(model)
    test("should get the previous model and emitChanged", () =>
    {
      model.initCurrentStroke({ t: 1, p: 0.5, x: 1, y: 1 }, "pen", DefaultPenStyle)
      model.endCurrentStroke({ t: 15, p: 0.5, x: 10, y: 1 })
      manager.push(model)

      const previousModel = manager.undo()
      expect(manager.context.stackIndex).toStrictEqual(0)

      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual(previousModel)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(previousModel)

      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(true)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("redo", () =>
  {
    const model = new Model(27, 5)
    const manager = new HistoryManager(DefaultHistoryConfiguration, event)
    manager.push(model)
    test("should get the next model", () =>
    {
      const p1: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)

      const p2: TPointer = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2)

      manager.push(model)
      manager.undo()
      const lastModel = manager.redo()
      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual(lastModel)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(lastModel)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("updateStack", () =>
  {
    test("should update last model in stack", async () =>
    {
      const model = new Model(27, 5)
      const manager = new HistoryManager(DefaultHistoryConfiguration, event)
      manager.push(model)
      const p1: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      // wait a few seconds and have a different model.modificationDate
      await delay(100)
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)

      const p2: TPointer = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2)

      manager.push(model)

      model.exports = { "text/plain": "-" }
      manager.updateStack(model)

      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex]).toEqual(model)
      expect(manager.stack[manager.context.stackIndex]).not.toBe(model)
    })

    test("should update previous model in stack", async () =>
    {
      const model = new Model(27, 5)
      const manager = new HistoryManager(DefaultHistoryConfiguration, event)
      manager.push(model)

      const p1: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      // wait a few seconds and have a different model.modificationDate
      await delay(100)
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)

      const p2: TPointer = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2)

      const firstModel = model.clone()
      manager.push(model)

      const p3: TPointer = { t: 100, p: 0.5, x: 1, y: 10 }
      // wait a few seconds and have a different model.modificationDate
      await delay(100)
      model.initCurrentStroke(p3, "pen", DefaultPenStyle)

      const p4: TPointer = { t: 150, p: 0.5, x: 1, y: 10 }
      model.endCurrentStroke(p4)
      manager.push(model)

      firstModel.exports = { "text/plain": "-" }
      manager.updateStack(firstModel)

      expect(manager.stack.at(-2)).toMatchObject(firstModel)
      expect(manager.stack.at(-2)).not.toBe(firstModel)
    })
  })
})
