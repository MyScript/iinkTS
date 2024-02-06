import menuIcon from "../assets/svg/menu.svg"
import trashIcon from "../assets/svg/trash.svg"
import undoIcon from "../assets/svg/undo.svg"
import redoIcon from "../assets/svg/redo.svg"
import translateIcon from "../assets/svg/translate.svg"
import gestureIcon from "../assets/svg/spock-hand-gesture.svg"
import guideIcon from "../assets/svg/orthogonal-view.svg"
import snapIcon from "../assets/svg/arrow-to-dot.svg"
import debugIcon from "../assets/svg/wolf.svg"
import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIMenu, TMenuItemBoolean, TMenuItemButtonList, TMenuItemSelect } from "./OIMenu"
import { SymbolType } from "../primitive"
import { StrikeThroughAction, SurroundAction } from "../gesture"
import { OIMenuSub } from "./OIMenuSub"

/**
 * Menu
 */
export class OIMenuAction extends OIMenu
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)

  behaviors: OIBehaviors
  id: string
  wrapper?: HTMLElement
  menuClear?: HTMLButtonElement
  menuUndo?: HTMLButtonElement
  menuRedo?: HTMLButtonElement
  menuConvert?: HTMLButtonElement
  menuGesture!: OIMenuSub
  menuGuide!: OIMenuSub
  menuSnap!: OIMenuSub
  menuDebug!: OIMenuSub

  guideGaps = [
    { label: "S", value: "10" },
    { label: "M", value: "20" },
    { label: "L", value: "50" },
    { label: "XL", value: "100" },
  ]

  constructor(behaviors: OIBehaviors, id = "ms-menu-action")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.behaviors = behaviors

    this.createMenuGesture()
    this.createMenuGuide()
    this.createMenuSnap()
    this.createMenuDebug()
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  protected createMenuClear(): HTMLElement
  {
    this.menuClear = document.createElement("button")
    this.menuClear.id = `${ this.id }-clear`
    this.menuClear.classList.add("ms-menu-button", "icon")
    this.menuClear.innerHTML = trashIcon
    this.menuClear.addEventListener("pointerup", () => this.behaviors.clear())
    return this.createToolTip(this.menuClear, "Clear", "right")
  }

  protected createMenuUndo(): HTMLElement
  {
    this.menuUndo = document.createElement("button")
    this.menuUndo.id = `${ this.id }-undo`
    this.menuUndo.classList.add("ms-menu-button", "icon")
    this.menuUndo.innerHTML = undoIcon
    this.menuUndo.addEventListener("pointerup", () => this.behaviors.undo())
    return this.createToolTip(this.menuUndo, "Undo", "right")
  }

  protected createMenuRedo(): HTMLElement
  {
    this.menuRedo = document.createElement("button")
    this.menuRedo.id = `${ this.id }-redo`
    this.menuRedo.classList.add("ms-menu-button", "icon")
    this.menuRedo.innerHTML = redoIcon
    this.menuRedo.addEventListener("pointerup", () => this.behaviors.redo())
    return this.createToolTip(this.menuRedo, "Redo", "right")
  }

  protected createMenuConvert(): HTMLElement
  {
    this.menuConvert = document.createElement("button")
    this.menuConvert.id = `${ this.id }-convert`
    this.menuConvert.classList.add("ms-menu-button", "icon")
    this.menuConvert.innerHTML = translateIcon
    this.menuConvert.addEventListener("pointerup", () =>
    {
      this.behaviors.convert()
    })
    return this.createToolTip(this.menuConvert, "Convert", "right")
  }

  protected createMenuGesture(): void
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-gesture`
    trigger.classList.add("ms-menu-button", "icon")
    trigger.innerHTML = gestureIcon
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")

    const surroundActionValues: { label: string, value: string }[] = []
    for (const key in SurroundAction) {
      const value = SurroundAction[key as keyof typeof SurroundAction]
      surroundActionValues.push({ label: key, value })
    }
    const strikeThroughActionValues: { label: string, value: string }[] = []
    for (const key in StrikeThroughAction) {
      const value = StrikeThroughAction[key as keyof typeof StrikeThroughAction]
      strikeThroughActionValues.push({ label: key, value })
    }
    const menuItems: (TMenuItemBoolean | TMenuItemSelect)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-gesture-detect`,
        label: "Detect gesture",
        initValue: this.behaviors.writer.detectGesture,
        callback: (value) => this.behaviors.writer.detectGesture = value
      },
      {
        type: "select",
        id: `${ this.id }-gesture-surround`,
        label: "On surround",
        values: surroundActionValues,
        initValue: this.behaviors.gesture.surroundAction,
        callback: (value) => this.behaviors.gesture.surroundAction = value as SurroundAction
      },
      {
        type: "select",
        id: `${ this.id }-gesture-strikethrough`,
        label: "On strikethrough",
        values: strikeThroughActionValues,
        initValue: this.behaviors.gesture.strikeThroughAction,
        callback: (value) => this.behaviors.gesture.strikeThroughAction = value as StrikeThroughAction
      },
    ]
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })

    this.menuGesture = this.createSubMenu(this.createToolTip(trigger, "Gesture", "right"), subMenuWrapper, "right")
  }

  protected createMenuGuide(): void
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-guide`
    trigger.classList.add("ms-menu-button", "icon")
    trigger.innerHTML = guideIcon

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")

    const menuItems: (TMenuItemBoolean | TMenuItemSelect | TMenuItemButtonList)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-guide-enable`,
        label: "Show guide",
        initValue: this.behaviors.configuration.rendering.guides.enable,
        callback: (value) =>
        {
          this.behaviors.configuration.rendering.guides.enable = value as boolean
          this.behaviors.renderingConfiguration = this.behaviors.configuration.rendering
        }
      },
      {
        type: "select",
        id: `${ this.id }-guide-type`,
        label: "Guide style",
        values: [
          { label: "Line", value: "line" },
          { label: "Grid", value: "grid" },
          { label: "Point", value: "point" },
        ],
        initValue: this.behaviors.configuration.rendering.guides.type,
        callback: (value) =>
        {
          this.behaviors.configuration.rendering.guides.type = value as ("line" | "grid" | "point")
          this.behaviors.renderingConfiguration = this.behaviors.configuration.rendering
        }
      },
      {
        type: "list",
        id: `${ this.id }-guide-size`,
        label: "Guide style",
        values: this.guideGaps,
        initValue: this.behaviors.configuration.rendering.guides.gap.toString(),
        callback: (value) =>
        {
          this.behaviors.configuration.rendering.guides.gap = +value
          this.behaviors.renderingConfiguration = this.behaviors.configuration.rendering
        }
      },
    ]
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })

    this.menuGuide = this.createSubMenu(this.createToolTip(trigger, "Guide", "right"), subMenuWrapper, "right")
  }

  protected createMenuSnap(): void
  {
    const trigger = document.createElement("button")
    trigger.id = `${this.id}-snap`,
    trigger.classList.add("ms-menu-button", "icon")
    trigger.innerHTML = snapIcon

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")

    const menuItems: (TMenuItemBoolean | TMenuItemSelect)[] = [
      {
        type: "checkbox",
        id: `${this.id}-snap-to-guide`,
        label: "Snap to guide",
        initValue: this.behaviors.snaps.snapToGrid,
        callback: (value) => this.behaviors.snaps.snapToGrid = value
      },
      {
        type: "checkbox",
        id: `${this.id}-snap-to-element`,
        label: "Snap to element",
        initValue: this.behaviors.snaps.snapToElement,
        callback: (value) => this.behaviors.snaps.snapToElement = value
      },
      {
        type: "select",
        id: `${this.id}-snap-angle`,
        label: "Snap angle",
        values: [
          { label: "None", value: "0" },
          { label: "10°", value: "10" },
          { label: "30°", value: "30" },
          { label: "45°", value: "45" },
          { label: "90°", value: "90" },
          { label: "180°", value: "180" },
        ],
        initValue: this.behaviors.snaps.snapAngle.toString(),
        callback: (angle) => this.behaviors.snaps.snapAngle = +angle
      },
    ]
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    this.menuSnap = this.createSubMenu(this.createToolTip(trigger, "Snap", "right"), subMenuWrapper, "right")
  }

  protected createMenuDebug(): void
  {
    const menuDebug = document.createElement("button")
    menuDebug.id = `${this.id}-debug`
    menuDebug.classList.add("ms-menu-button", "icon")
    menuDebug.innerHTML = debugIcon

    const menuItems: TMenuItemBoolean[] = [
      {
        type: "checkbox",
        id: `${this.id}-debug-bounding-box`,
        label: "Show bounding box",
        initValue: this.behaviors.svgDebugger.boundingBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.boundingBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${this.id}-debug-recognition-box`,
        label: "Show recognition box",
        initValue: this.behaviors.svgDebugger.recognitionBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.recognitionBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${this.id}-debug-bounding-item-box`,
        label: "Show recognition item box",
        initValue: this.behaviors.svgDebugger.recognitionItemBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.recognitionItemBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${this.id}-debug-snap-points`,
        label: "Show snap points",
        initValue: this.behaviors.svgDebugger.snapPointsVisibility,
        callback: (debug) => this.behaviors.svgDebugger.snapPointsVisibility = debug
      },
      {
        type: "checkbox",
        id: `${this.id}-debug-vertices`,
        label: "Show vertices",
        initValue: this.behaviors.svgDebugger.verticesVisibility,
        callback: (debug) => this.behaviors.svgDebugger.verticesVisibility = debug
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    this.menuDebug = this.createSubMenu(this.createToolTip(menuDebug, "Debug", "right"), subMenuWrapper, "right")
  }

  protected unselectAll(): void
  {
    this.wrapper?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
  }

  protected closeAllSubMenu(): void
  {
    this.wrapper?.querySelectorAll(".open").forEach(e => e.classList.remove("open"))
  }

  render(layer: HTMLElement): void
  {
    if (this.behaviors.configuration.menu.action.enable) {
      const menuTrigger = document.createElement("button")
      menuTrigger.id = "ms-menu-action"
      menuTrigger.classList.add("ms-menu-button", "icon")
      menuTrigger.innerHTML = menuIcon

      const subMenuWrapper = document.createElement("div")
      subMenuWrapper.classList.add("ms-menu-colmun")
      subMenuWrapper.appendChild(this.menuGesture.element)
      subMenuWrapper.appendChild(this.menuGuide.element)
      subMenuWrapper.appendChild(this.menuSnap.element)
      subMenuWrapper.appendChild(this.menuDebug.element)

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-left", "ms-menu-row")
      this.wrapper.appendChild(this.createSubMenu(this.createToolTip(menuTrigger, "Menu", "right"), subMenuWrapper, "bottom").element)
      this.wrapper.appendChild(this.createMenuClear())
      this.wrapper.appendChild(this.createMenuUndo())
      this.wrapper.appendChild(this.createMenuRedo())
      this.wrapper.appendChild(this.createMenuConvert())

      layer.appendChild(this.wrapper)
      this.update()
      this.show()
    }
  }

  update(): void
  {
    if (this.menuClear) {
      this.menuClear.disabled = this.behaviors.context.empty
    }
    if (this.menuUndo) {
      this.menuUndo.disabled = !this.behaviors.context.canUndo
    }
    if (this.menuRedo) {
      this.menuRedo.disabled = !this.behaviors.context.canRedo
    }
    if (this.menuConvert) {
      this.menuConvert.disabled = this.model.symbols.length === 0 || !this.model.symbols.some(s => s.type === SymbolType.Stroke)
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
      this.wrapper = undefined
      this.menuClear = undefined
      this.menuUndo = undefined
      this.menuRedo = undefined
      this.menuConvert = undefined
    }
  }
}
