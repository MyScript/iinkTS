import
{
  DefaultInteractiveInkSSREditorConfiguration,
  InteractiveInkSSREditor
} from "../../../src/iink"
import { EditorEventMock } from "./EditorEventMock"


export class InteractiveInkSSREditorMock extends InteractiveInkSSREditor
{
  constructor()
  {
    //@ts-ignore
    super(document.createElement("div"), { configuration: DefaultInteractiveInkSSREditorConfiguration })
    this.event = new EditorEventMock(this.layers.root)
  }

  init = jest.fn(() =>
  {
    this.model.width = Math.max(this.layers.root.clientWidth, this.configuration.rendering.minWidth)
    this.model.height = Math.max(this.layers.root.clientHeight, this.configuration.rendering.minHeight)
    this.history.push(this.model)

    this.renderer.init(this.layers.rendering)
    this.grabber.attach(this.layers.rendering)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    this.initializeSmartGuide()
    return Promise.resolve()
  })

  setPenStyle = jest.fn()
  setPenStyleClasses = jest.fn()
  setTheme = jest.fn()

  drawCurrentStroke = jest.fn()
  synchronizeModelWithBackend = jest.fn()

  waitForIdle = jest.fn()
  export = jest.fn()
  convert = jest.fn()
  import = jest.fn()
  importPointEvents = jest.fn()
  resize = jest.fn()
  undo = jest.fn()
  redo = jest.fn()
  clear = jest.fn()
  destroy = jest.fn()
}
