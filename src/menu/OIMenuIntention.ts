import pencilIcon from "../assets/svg/edit-pencil.svg"
import cursorIcon from "../assets/svg/frame-select.svg"
import eraseIcon from "../assets/svg/erase.svg"
import handIcon from "../assets/svg/drag-hand-gesture.svg"
import rectangleIcon from "../assets/svg/rectangle.svg"
import circleIcon from "../assets/svg/circle.svg"
import ellipseIcon from "../assets/svg/ellipse.svg"
import triangleIcon from "../assets/svg/triangle.svg"
import lineIcon from "../assets/svg/linear.svg"
import arrowIcon from "../assets/svg/linear-arrow.svg"
import doubleArrowIcon from "../assets/svg/linear-double-arrow.svg"
import { Intention, WriteTool, LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIMenu } from "./OIMenu"

/**
 * Menu
 */
export class OIMenuIntention extends OIMenu
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)

  behaviors: OIBehaviors
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
  }
  menuEdge?: HTMLButtonElement
  subMenuEdge?: {
    line: HTMLButtonElement,
    arrow: HTMLButtonElement,
    doubleArrow: HTMLButtonElement,
  }

  constructor(behaviors: OIBehaviors, id = "ms-menu-intention")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.behaviors = behaviors
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
      this.behaviors.intention = Intention.Write
      this.behaviors.writer.tool = WriteTool.Pencil
    })
    return this.createToolTip(this.writeBtn, "Write")
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
      this.behaviors.intention = Intention.Move
    })
    return this.createToolTip(this.menuMove, "Move")
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
      this.behaviors.intention = Intention.Select
    })
    return this.createToolTip(this.menuSelect, "Select")
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
      this.behaviors.intention = Intention.Erase
    })
    return this.createToolTip(this.menuErase, "Erase")
  }

  protected createShapeSubMenu(icon: string, tool: WriteTool): HTMLButtonElement
  {
    const subMenuShape = document.createElement("button")
    subMenuShape.id = `${this.id}-write-shape-${tool}`
    subMenuShape.classList.add("ms-menu-button", "square")
    subMenuShape.innerHTML = icon
    subMenuShape.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.behaviors.intention = Intention.Write
      this.behaviors.writer.tool = tool
      subMenuShape.classList.add("active")
      this.menuShape!.innerHTML = icon
      this.menuShape!.classList.add("active")
      const subMenuContent = this.menuShape!.nextSibling
      if (subMenuContent) {
        (subMenuContent as HTMLElement).classList.remove("open")
      }
    })
    return this.createToolTip(subMenuShape, tool.toString()) as HTMLButtonElement
  }

  protected createMenuShape(): HTMLElement
  {
    this.menuShape = document.createElement("button")
    this.menuShape.id = `${this.id}-write-shape`
    this.menuShape.classList.add("ms-menu-button", "square")
    this.menuShape.innerHTML = rectangleIcon
    this.subMenuShape = {
      circle: this.createShapeSubMenu(circleIcon, WriteTool.Circle),
      rectangle: this.createShapeSubMenu(rectangleIcon, WriteTool.Rectangle),
      triangle: this.createShapeSubMenu(triangleIcon, WriteTool.Triangle),
      ellipse: this.createShapeSubMenu(ellipseIcon, WriteTool.Ellipse),
    }
    const subMenuContent = document.createElement("div")
    subMenuContent.id = `${this.id}-write-shape-list`
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-shape")
    subMenuContent.appendChild(this.subMenuShape.rectangle)
    subMenuContent.appendChild(this.subMenuShape.circle)
    subMenuContent.appendChild(this.subMenuShape.ellipse)
    subMenuContent.appendChild(this.subMenuShape.triangle)

    return this.createSubMenu(this.menuShape, subMenuContent).element
  }

  protected createEdgeSubMenu(square: string, tool: WriteTool): HTMLButtonElement
  {
    const subMenuEdge = document.createElement("button")
    subMenuEdge.id = `${this.id}-write-edge-${tool}`
    subMenuEdge.classList.add("ms-menu-button", "square")
    subMenuEdge.innerHTML = square
    subMenuEdge.addEventListener("pointerup", () =>
    {
      this.unselectAll()
      this.behaviors.intention = Intention.Write
      this.behaviors.writer.tool = tool
      subMenuEdge.classList.add("active")
      this.menuEdge!.innerHTML = square
      this.menuEdge!.classList.add("active")
      const subMenuContent = this.menuEdge!.nextSibling
      if (subMenuContent) {
        (subMenuContent as HTMLElement).classList.remove("open")
      }
    })
    return this.createToolTip(subMenuEdge, tool.toString()) as HTMLButtonElement
  }

  protected createMenuEdge(): HTMLElement
  {
    this.menuEdge = document.createElement("button")
    this.menuEdge.id = `${this.id}-write-edge`
    this.menuEdge.classList.add("ms-menu-button", "square")
    this.menuEdge.innerHTML = lineIcon
    this.subMenuEdge = {
      line: this.createEdgeSubMenu(lineIcon, WriteTool.Line),
      arrow: this.createEdgeSubMenu(arrowIcon, WriteTool.Arrow),
      doubleArrow: this.createEdgeSubMenu(doubleArrowIcon, WriteTool.DoubleArrow),
    }
    const subMenuContent = document.createElement("div")
    subMenuContent.id = `${this.id}-write-edge-list`
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-edge")
    subMenuContent.appendChild(this.subMenuEdge.line)
    subMenuContent.appendChild(this.subMenuEdge.arrow)
    subMenuContent.appendChild(this.subMenuEdge.doubleArrow)

    return this.createSubMenu(this.menuEdge, subMenuContent).element
  }

  protected unselectAll(): void
  {
    this.wrapper?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
  }

  update(): void
  {
    this.unselectAll()
    switch (this.behaviors.intention) {
      case Intention.Erase:
        this.menuErase?.classList.add("active")
        break;
      case Intention.Move:
        this.menuMove?.classList.add("active")
        break;
      case Intention.Select:
        this.menuSelect?.classList.add("active")
        break;
      case Intention.Write:
        switch (this.behaviors.writer.tool) {
          case WriteTool.Circle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.circle?.classList.add("active")
            break;
          case WriteTool.Ellipse:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.ellipse?.classList.add("active")
            break;
          case WriteTool.Triangle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.triangle?.classList.add("active")
            break;
          case WriteTool.Rectangle:
            this.menuShape?.classList.add("active")
            this.subMenuShape?.rectangle?.classList.add("active")
            break;
          case WriteTool.Line:
            this.menuEdge?.classList.add("active")
            this.subMenuEdge?.line?.classList.add("active")
            break;
          case WriteTool.Arrow:
            this.menuEdge?.classList.add("active")
            this.subMenuEdge?.arrow?.classList.add("active")
            break;
          case WriteTool.DoubleArrow:
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

  render(domElement: HTMLElement): void
  {
    if (this.behaviors.configuration.menu.intention.enable) {
      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-bottom", "ms-menu-row")

      this.wrapper.appendChild(this.createMenuWrite())
      this.wrapper.appendChild(this.createMenuMove())
      this.wrapper.appendChild(this.createMenuSelect())
      this.wrapper.appendChild(this.createMenuErase())
      this.wrapper.appendChild(this.createMenuEdge())
      this.wrapper.appendChild(this.createMenuShape())

      domElement.appendChild(this.wrapper)
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
