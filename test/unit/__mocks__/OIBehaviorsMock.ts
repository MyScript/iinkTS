import { OIBehaviors, TBehaviorOptions } from "../../../src/behaviors"
import { DefaultConfiguration } from "../../../src/configuration"

const behaviorsOptions: TBehaviorOptions = {
  configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
}
behaviorsOptions.configuration.offscreen = true

export class OIBehaviorsMock extends OIBehaviors
{
  constructor() {
    //@ts-ignore
    super(behaviorsOptions, document.createElement("div"))
  }

  init = jest.fn((domElement) => {
    this.model.width = Math.max(domElement.clientWidth, this.configuration.rendering.minWidth)
    this.model.height = Math.max(domElement.clientHeight, this.configuration.rendering.minHeight)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.push(this.model, {})

    this.renderer.init(domElement)
    // this.menu.render(this.layerInfos)

    this.grabber.attach(this.renderer.layer as unknown as HTMLElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)
    return Promise.resolve()
  })

  setPenStyle = jest.fn()
  setPenStyleClasses = jest.fn()
  setTheme = jest.fn()

  createSymbol = jest.fn()
  createSymbols = jest.fn()

  addSymbol = jest.fn()
  addSymbols = jest.fn()

  updateSymbol = jest.fn()
  updateSymbols = jest.fn()
  updateSymbolsStyle = jest.fn()
  updateTextFontSize = jest.fn()
  replaceSymbols = jest.fn()
  changeOrderSymbol = jest.fn()
  changeOrderSymbols = jest.fn()
  groupSymbols = jest.fn()
  ungroupSymbol = jest.fn()
  groupStrokesByJIIXElement = jest.fn()

  removeSymbol = jest.fn()
  removeSymbols = jest.fn()
  unselectAll = jest.fn()

  select = jest.fn()
  selectAll = jest.fn()

  changeLanguage = jest.fn()
  importPointEvents = jest.fn()

  downloadAsSVG = jest.fn()
  downloadAsJPG = jest.fn()
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
