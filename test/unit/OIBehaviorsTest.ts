import { OIBehaviors, TBehaviorOptions } from "../../src/behaviors"
import { DefaultConfiguration } from "../../src/configuration"

const behaviorsOptions: TBehaviorOptions = {
  configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
}
behaviorsOptions.configuration.offscreen = true

export class OIBehaviorsTest extends OIBehaviors
{
  constructor() {
    //@ts-ignore
    super(behaviorsOptions, document.createElement("div"))
  }

  init = jest.fn((domElement) => {
    this.model.width = Math.max(domElement.clientWidth, this.configuration.rendering.minWidth)
    this.model.height = Math.max(domElement.clientHeight, this.configuration.rendering.minHeight)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.undoRedoManager.updateModelInStack(this.model)

    this.renderer.init(domElement)
    this.menu.render(this.layerInfos)

    this.grabber.attach(this.renderer.layer as unknown as HTMLElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)
    return Promise.resolve()
  })

  setPenStyle = jest.fn()
  setPenStyleClasses = jest.fn()
  setTheme = jest.fn()

  addSymbol = jest.fn()
  replaceSymbol = jest.fn()
  changeOrderSymbol = jest.fn()
  removeSymbol = jest.fn()
  updateSymbolsStyle = jest.fn()

  importPointEvents = jest.fn()

  undo = jest.fn()
  redo = jest.fn()
  export = jest.fn()
  convert = jest.fn()
  resize = jest.fn()
  clear = jest.fn()
  destroy = jest.fn()
}
