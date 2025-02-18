import pencilIcon from "../assets/svg/edit-pencil.svg"
import cursorIcon from "../assets/svg/frame-select.svg"
import eraseIcon from "../assets/svg/erase.svg"
import handIcon from "../assets/svg/drag-hand-gesture.svg"
import rectangleIcon from "../assets/svg/rectangle.svg"
import rhombusIcon from "../assets/svg/rhombus.svg"
import circleIcon from "../assets/svg/circle.svg"
import ellipseIcon from "../assets/svg/ellipse.svg"
import triangleIcon from "../assets/svg/triangle.svg"
import lineIcon from "../assets/svg/linear.svg"
import arrowIcon from "../assets/svg/linear-arrow.svg"
import doubleArrowIcon from "../assets/svg/linear-double-arrow.svg"
import { EditorTool, EditorWriteTool } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIMenu } from "./IIMenu"
import { IIMenuSub } from "./IIMenuSub"
import { TSubMenuParam } from "./IIMenuSub"
import { InteractiveInkEditor } from "../editor"

/**
 * @group Menu
 */
export class IIMenuTool extends IIMenu
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLDivElement
  writeBtn?: HTMLButtonElement
  menuSelect?: HTMLButtonElement
  menuMove?: HTMLButtonElement
  menuErase?: HTMLButtonElement
  menuShape?: HTMLButtonElement
  subMenuShape?: {
    rectangle: HTMLButtonElement,
    circle: HTMLButtonElement,
    triangle: HTMLButtonElement,
    ellipse: HTMLButtonElement
    rhombus: HTMLButtonElement
  }
  menuEdge?: HTMLButtonElement
  subMenuEdge?: {
    line: HTMLButtonElement,
    arrow: HTMLButtonElement,
    doubleArrow: HTMLButtonElement,
  }

  constructor(editor: InteractiveInkEditor, id = "ms-menu-tool")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
  }

  protected createMenuWrite(): HTMLElement
  {
    this.writeBtn = document.createElement("button")
    this.writeBtn.id = `${this.id}-write-pencil`
    this.writeBtn.classList.add("ms-menu-button", "square")
    this.writeBtn.innerHTML = pencilIcon
    this.writeBtn.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.writeBtn!.classList.add("active")
      this.editor.tool = EditorTool.Write
      this.editor.writer.tool = EditorWriteTool.Pencil
    })
    return this.writeBtn
  }

  protected createMenuMove(): HTMLElement
  {
    this.menuMove = document.createElement("button")
    this.menuMove.id = `${this.id}-move`
    this.menuMove.classList.add("ms-menu-button", "square")
    this.menuMove.innerHTML = handIcon
    this.menuMove.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.menuMove!.classList.add("active")
      this.editor.tool = EditorTool.Move
    })
    return this.menuMove
  }

  protected createMenuSelect(): HTMLElement
  {
    this.menuSelect = document.createElement("button")
    this.menuSelect.id = `${this.id}-select`
    this.menuSelect.classList.add("ms-menu-button", "square")
    this.menuSelect.innerHTML = cursorIcon
    this.menuSelect.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.menuSelect!.classList.add("active")
      this.editor.tool = EditorTool.Select
    })
    return this.menuSelect
  }

  protected createMenuErase(): HTMLElement
  {
    this.menuErase = document.createElement("button")
    this.menuErase.id = `${this.id}-erase`
    this.menuErase.classList.add("ms-menu-button", "square")
    this.menuErase.innerHTML = eraseIcon
    this.menuErase.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.menuErase!.classList.add("active")
      this.editor.tool = EditorTool.Erase
    })
    return this.menuErase
  }

  protected createShapeSubMenu(icon: string, tool: EditorWriteTool): HTMLButtonElement
  {
    const subMenuShape = document.createElement("button")
    subMenuShape.id = `${this.id}-write-shape-${tool}`
    subMenuShape.classList.add("ms-menu-button", "square")
    subMenuShape.innerHTML = icon
    subMenuShape.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.editor.tool = EditorTool.Write
      this.editor.writer.tool = tool
      subMenuShape.classList.add("active")
      this.menuShape!.innerHTML = icon
      this.menuShape!.classList.add("active")
      const subMenuContent = this.menuShape!.nextSibling
      if (subMenuContent) {
        (subMenuContent as HTMLElement).classList.remove("open")
      }
    })
    return subMenuShape
  }

  protected createMenuShape(): HTMLElement
  {
    this.menuShape = document.createElement("button")
    this.menuShape.id = `${this.id}-write-shape`
    this.menuShape.classList.add("ms-menu-button", "square")
    this.menuShape.innerHTML = rectangleIcon
    this.subMenuShape = {
      circle: this.createShapeSubMenu(circleIcon, EditorWriteTool.Circle),
      rectangle: this.createShapeSubMenu(rectangleIcon, EditorWriteTool.Rectangle),
      triangle: this.createShapeSubMenu(triangleIcon, EditorWriteTool.Triangle),
      ellipse: this.createShapeSubMenu(ellipseIcon, EditorWriteTool.Ellipse),
      rhombus: this.createShapeSubMenu(rhombusIcon, EditorWriteTool.Rhombus),
    }
    const subMenuContent = document.createElement("div")
    subMenuContent.id = `${this.id}-write-shape-list`
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-shape")
    subMenuContent.appendChild(this.subMenuShape.rectangle)
    subMenuContent.appendChild(this.subMenuShape.circle)
    subMenuContent.appendChild(this.subMenuShape.ellipse)
    subMenuContent.appendChild(this.subMenuShape.triangle)
    subMenuContent.appendChild(this.subMenuShape.rhombus)

    const params: TSubMenuParam = {
      trigger: this.menuShape,
      subMenu: subMenuContent,
      position: "top"
    }

    return new IIMenuSub(params).element
  }

  protected createEdgeSubMenu(square: string, tool: EditorWriteTool): HTMLButtonElement
  {
    const subMenuEdge = document.createElement("button")
    subMenuEdge.id = `${this.id}-write-edge-${tool}`
    subMenuEdge.classList.add("ms-menu-button", "square")
    subMenuEdge.innerHTML = square
    subMenuEdge.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.editor.tool = EditorTool.Write
      this.editor.writer.tool = tool
      subMenuEdge.classList.add("active")
      this.menuEdge!.innerHTML = square
      this.menuEdge!.classList.add("active")
      const subMenuContent = this.menuEdge!.nextSibling
      if (subMenuContent) {
        (subMenuContent as HTMLElement).classList.remove("open")
      }
    })
    return subMenuEdge
  }

  protected createMenuEdge(): HTMLElement
  {
    this.menuEdge = document.createElement("button")
    this.menuEdge.id = `${this.id}-write-edge`
    this.menuEdge.classList.add("ms-menu-button", "square")
    this.menuEdge.innerHTML = lineIcon
    this.subMenuEdge = {
      line: this.createEdgeSubMenu(lineIcon, EditorWriteTool.Line),
      arrow: this.createEdgeSubMenu(arrowIcon, EditorWriteTool.Arrow),
      doubleArrow: this.createEdgeSubMenu(doubleArrowIcon, EditorWriteTool.DoubleArrow),
    }
    const subMenuContent = document.createElement("div")
    subMenuContent.id = `${this.id}-write-edge-list`
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-edge")
    subMenuContent.appendChild(this.subMenuEdge.line)
    subMenuContent.appendChild(this.subMenuEdge.arrow)
    subMenuContent.appendChild(this.subMenuEdge.doubleArrow)

    const params: TSubMenuParam = {
      trigger: this.menuEdge,
      subMenu: subMenuContent,
      position: "top"
    }

    return new IIMenuSub(params).element
  }

  protected unselectAll(): void
  {
    this.wrapper?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
  }

  update(): void
  {
    this.unselectAll()
    switch (this.editor.tool) {
      case EditorTool.Erase:
        this.menuErase?.classList.add("active")
        break;
      case EditorTool.Move:
        this.menuMove?.classList.add("active")
        break;
      case EditorTool.Select:
        this.menuSelect?.classList.add("active")
        break;
      case EditorTool.Write:
        switch (this.editor.writer.tool) {
          case EditorWriteTool.Circle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.circle?.classList.add("active")
            break;
          case EditorWriteTool.Ellipse:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.ellipse?.classList.add("active")
            break;
          case EditorWriteTool.Triangle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.triangle?.classList.add("active")
            break;
          case EditorWriteTool.Rectangle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.rectangle?.classList.add("active")
            break;
          case EditorWriteTool.Line:
            this.menuEdge?.classList.add("active")
            this.subMenuEdge?.line?.classList.add("active")
            break;
          case EditorWriteTool.Arrow:
            this.menuEdge?.classList.add("active")
            this.subMenuEdge?.arrow?.classList.add("active")
            break;
          case EditorWriteTool.DoubleArrow:
            this.menuEdge?.classList.add("active")
            this.subMenuEdge?.doubleArrow?.classList.add("active")
            break;
          default:
            this.writeBtn?.classList.add("active")
            break;
        }
        break;
    }
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.tool.enable) {
      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-bottom", "ms-menu-row")

      this.wrapper.appendChild(this.createMenuWrite())
      this.wrapper.appendChild(this.createMenuMove())
      this.wrapper.appendChild(this.createMenuSelect())
      this.wrapper.appendChild(this.createMenuErase())
      this.wrapper.appendChild(this.createMenuEdge())
      this.wrapper.appendChild(this.createMenuShape())

      layer.appendChild(this.wrapper)
      this.update()
      this.show()
    }
  }

  show(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "visible"
    }
  }

  hide(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "hidden"
    }
  }

  destroy(): void
  {
    if (this.wrapper) {
      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.writeBtn = undefined
      this.menuSelect = undefined
      this.menuMove = undefined
      this.menuErase = undefined
      this.menuShape = undefined
      this.subMenuShape = undefined
      this.menuEdge = undefined
      this.subMenuEdge = undefined
      this.wrapper = undefined
    }
  }
}
