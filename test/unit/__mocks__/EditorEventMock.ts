import { EditorEvent } from "../../../src/EditorEvent"

export class EditorEventMock extends EditorEvent
{
  emitChanged = jest.fn()
  emitCleared = jest.fn()
  emitConverted = jest.fn()
  emitError = jest.fn()
  emitExported = jest.fn()
  emitIdle = jest.fn()
  emitImported = jest.fn()
  emitLoaded = jest.fn()
  emitNotif = jest.fn()
  emitSelected = jest.fn()
  emitTool = jest.fn()
}
