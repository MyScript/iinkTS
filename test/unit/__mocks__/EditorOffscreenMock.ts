import {
  TEditorOffscreenOptions,
  EditorOffscreen,
  DefaultEditorOffscreenConfiguration,
} from "../../../src/iink"
import { EditorEventMock } from "./EditorEventMock"

const options: TEditorOffscreenOptions = {
  configuration: JSON.parse(JSON.stringify(DefaultEditorOffscreenConfiguration))
}

export class EditorOffscreenMock extends EditorOffscreen
{
  constructor() {
    //@ts-ignore
    super(document.createElement("div"), options)
    this.event = new EditorEventMock(this.layers.root)
  }

  init = jest.fn(() => {
    this.model.width = Math.max(this.layers.root.clientWidth, this.configuration.rendering.minWidth)
    this.model.height = Math.max(this.layers.root.clientHeight, this.configuration.rendering.minHeight)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.push(this.model, {})

    this.renderer.init(this.layers.rendering)
    // this.menu.render(this.layers.infos.root)

    return Promise.resolve()
  })

  createSymbol = jest.fn()
  createSymbols = jest.fn()

  addSymbol = jest.fn()
  addSymbols = jest.fn()

  updateSymbol = jest.fn()
  updateSymbols = jest.fn()
  updateSymbolsStyle = jest.fn()
  updateTextFontStyle = jest.fn()
  replaceSymbols = jest.fn()
  changeOrderSymbol = jest.fn()
  changeOrderSymbols = jest.fn()
  groupSymbols = jest.fn()
  ungroupSymbol = jest.fn()
  synchronizeStrokesWithJIIX = jest.fn()

  removeSymbol = jest.fn()
  removeSymbols = jest.fn()
  unselectAll = jest.fn()

  select = jest.fn()
  selectAll = jest.fn()

  changeLanguage = jest.fn()
  importPointEvents = jest.fn()

  downloadAsSVG = jest.fn()
  downloadAsPNG = jest.fn()
  downloadAsJson = jest.fn()

  // extractStrokesFromSymbols = jest.fn()

  undo = jest.fn()
  redo = jest.fn()
  export = jest.fn()
  convert = jest.fn()
  resize = jest.fn()
  clear = jest.fn()
  destroy = jest.fn()
}
