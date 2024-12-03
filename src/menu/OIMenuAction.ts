import menuIcon from "../assets/svg/menu.svg"
import languageIcon from "../assets/svg/language.svg"
import trashIcon from "../assets/svg/trash.svg"
import undoIcon from "../assets/svg/undo.svg"
import redoIcon from "../assets/svg/redo.svg"
import translateIcon from "../assets/svg/translate.svg"
import gestureIcon from "../assets/svg/spock-hand-gesture.svg"
import guideIcon from "../assets/svg/orthogonal-view.svg"
import snapIcon from "../assets/svg/arrow-to-dot.svg"
import debugIcon from "../assets/svg/wolf.svg"
import downloadIcon from "../assets/svg/download.svg"
import uploadIcon from "../assets/svg/upload.svg"
import { EditorTool, EditorWriteTool } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIMenu, TMenuItemBoolean, TMenuItemButton, TMenuItemButtonList, TMenuItemSelect } from "./OIMenu"
import { TOISymbol } from "../symbol"
import { InsertAction, StrikeThroughAction, SurroundAction } from "../gesture"
import { OIMenuSub, TSubMenuParam } from "./OIMenuSub"
import { getAvailableLanguageList, PartialDeep } from "../utils"

/**
 * @group Menu
 */
export class OIMenuAction extends OIMenu
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)

  behaviors: OIBehaviors
  id: string
  wrapper?: HTMLElement
  menuLanguage!: OIMenuSub
  menuClear?: HTMLButtonElement
  menuUndo?: HTMLButtonElement
  menuRedo?: HTMLButtonElement
  menuConvert?: HTMLButtonElement

  guideGaps = [
    { label: "S", value: "25" },
    { label: "M", value: "50" },
    { label: "L", value: "100" },
    { label: "XL", value: "150" },
  ]

  constructor(behaviors: OIBehaviors, id = "ms-menu-action")
  {
    super()
    this.id = id
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get isMobile(): boolean
  {
    return this.behaviors.renderer.parent.clientWidth < 700
  }

  protected createMenuClear(): HTMLElement
  {
    this.menuClear = document.createElement("button")
    this.menuClear.id = `${ this.id }-clear`
    this.menuClear.classList.add("ms-menu-button", "square")
    this.menuClear.innerHTML = trashIcon
    this.menuClear.addEventListener("pointerup", () =>
    {
      this.#logger.info(`${ this.id }.clear`)
      this.behaviors.clear()
    })
    return this.menuClear
  }

  protected createMenuLanguage(): HTMLElement
  {
    const triggerBtn = document.createElement("button")
    triggerBtn.id = `${ this.id }-language-trigger`
    triggerBtn.classList.add("ms-menu-button", "square")
    triggerBtn.innerHTML = languageIcon

    const select = document.createElement("select")
    select.classList.add("select-language")
    select.id = `${ this.id }-language`
    getAvailableLanguageList(this.behaviors.configuration)
      .then(json =>
      {
        const languages = json.result as { [key: string]: string }
        Object.keys(languages).forEach(key =>
        {
          const selected = key === this.behaviors.configuration.recognition.lang
          const opt = new Option(languages[key], key, selected, selected)
          select.appendChild(opt)
        })
      })
    select.addEventListener("change", (e) =>
    {
      this.#logger.info(`${ this.id }.selectLanguage`)
      const value = (e.target as HTMLInputElement).value
      this.behaviors.changeLanguage(value)
    })
    const params: TSubMenuParam = {
      trigger: triggerBtn,
      subMenu: select,
      position: "bottom-right"
    }
    this.menuLanguage = new OIMenuSub(params)
    return this.menuLanguage.element
  }

  protected createMenuUndo(): HTMLElement
  {
    this.menuUndo = document.createElement("button")
    this.menuUndo.id = `${ this.id }-undo`
    this.menuUndo.classList.add("ms-menu-button", "square")
    this.menuUndo.innerHTML = undoIcon
    this.menuUndo.addEventListener("pointerup", async () =>
    {
      this.#logger.info(`${ this.id }.undo`)
      await this.behaviors.undo()
    })
    return this.menuUndo
  }

  protected createMenuRedo(): HTMLElement
  {
    this.menuRedo = document.createElement("button")
    this.menuRedo.id = `${ this.id }-redo`
    this.menuRedo.classList.add("ms-menu-button", "square")
    this.menuRedo.innerHTML = redoIcon
    this.menuRedo.addEventListener("pointerup", async () =>
    {
      this.#logger.info(`${ this.id }.redo`)
      await this.behaviors.redo()
    })
    return this.menuRedo
  }

  protected createMenuConvert(): HTMLElement
  {
    this.menuConvert = document.createElement("button")
    this.menuConvert.id = `${ this.id }-convert`
    this.menuConvert.classList.add("ms-menu-button", "square")
    this.menuConvert.innerHTML = translateIcon
    this.menuConvert.addEventListener("pointerup", () =>
    {
      this.#logger.info(`${ this.id }.convert`)
      this.behaviors.convert()
    })
    return this.menuConvert
  }

  protected createMenuGesture(): HTMLDivElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-gesture`
    trigger.classList.add("ms-menu-button", "square")
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
    const splitActionValues: { label: string, value: string }[] = []
    for (const key in InsertAction) {
      const value = InsertAction[key as keyof typeof InsertAction]
      splitActionValues.push({ label: key, value })
    }
    const menuItems: (TMenuItemBoolean | TMenuItemSelect)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-gesture-detect`,
        label: "Detect gesture",
        initValue: this.behaviors.writer.detectGesture,
        callback: (value) =>
        {
          this.#logger.info(`${ this.id }.gesture-detect`, { value })
          this.behaviors.writer.detectGesture = value
          this.behaviors.tool = EditorTool.Write
          this.behaviors.writer.tool = EditorWriteTool.Pencil
        }
      },
      {
        type: "select",
        id: `${ this.id }-gesture-surround`,
        label: "On surround",
        values: surroundActionValues,
        initValue: this.behaviors.gesture.surroundAction,
        callback: (value) =>
        {
          this.#logger.info(`${ this.id }.gesture-surround`, { value })
          this.behaviors.gesture.surroundAction = value as SurroundAction
          this.behaviors.tool = EditorTool.Write
          this.behaviors.writer.tool = EditorWriteTool.Pencil
        }
      },
      {
        type: "select",
        id: `${ this.id }-gesture-strikethrough`,
        label: "On strikethrough",
        values: strikeThroughActionValues,
        initValue: this.behaviors.gesture.strikeThroughAction,
        callback: (value) =>
        {
          this.#logger.info(`${ this.id }.gesture-strikethrough`, { value })
          this.behaviors.gesture.strikeThroughAction = value as StrikeThroughAction
          this.behaviors.tool = EditorTool.Write
          this.behaviors.writer.tool = EditorWriteTool.Pencil
        }
      },
      {
        type: "select",
        id: `${ this.id }-gesture-insert`,
        label: "On insert",
        values: splitActionValues,
        initValue: this.behaviors.gesture.insertAction,
        callback: (value) =>
        {
          this.#logger.info(`${ this.id }.gesture-InsertAction`, { value })
          this.behaviors.gesture.insertAction = value as InsertAction
          this.behaviors.tool = EditorTool.Write
          this.behaviors.writer.tool = EditorWriteTool.Pencil
        }
      },
    ]
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Gesture",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
  }

  protected createMenuGuide(): HTMLDivElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-guide`
    trigger.classList.add("ms-menu-button", "square")
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
          this.#logger.info(`${ this.id }.guide-enable`, { value })
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
          this.#logger.info(`${ this.id }.guide-type`, { value })
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
          this.#logger.info(`${ this.id }.guide-size`, { value })
          this.behaviors.configuration.rendering.guides.gap = +value
          this.behaviors.renderingConfiguration = this.behaviors.configuration.rendering
        }
      },
    ]
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Guide",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
  }

  protected createMenuSnap(): HTMLDivElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-snap`
    trigger.classList.add("ms-menu-button", "square")
    trigger.innerHTML = snapIcon

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")

    const menuItems: (TMenuItemBoolean | TMenuItemSelect)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-snap-to-guide`,
        label: "Snap to guide",
        initValue: this.behaviors.snaps.snapToGrid,
        callback: (value) => this.behaviors.snaps.snapToGrid = value
      },
      {
        type: "checkbox",
        id: `${ this.id }-snap-to-element`,
        label: "Snap to element",
        initValue: this.behaviors.snaps.snapToElement,
        callback: (value) => this.behaviors.snaps.snapToElement = value
      },
      {
        type: "select",
        id: `${ this.id }-snap-angle`,
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
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Snap",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
  }

  protected createMenuDebug(): HTMLDivElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-debug`
    trigger.classList.add("ms-menu-button", "square")
    trigger.innerHTML = debugIcon

    const menuItems: TMenuItemBoolean[] = [
      {
        type: "checkbox",
        id: `${ this.id }-debug-bounding-box`,
        label: "Show bounding box",
        initValue: this.behaviors.svgDebugger.boundingBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.boundingBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${ this.id }-debug-recognition-box`,
        label: "Show recognition box",
        initValue: this.behaviors.svgDebugger.recognitionBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.recognitionBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${ this.id }-debug-bounding-item-box`,
        label: "Show recognition item box",
        initValue: this.behaviors.svgDebugger.recognitionItemBoxVisibility,
        callback: (debug) => this.behaviors.svgDebugger.recognitionItemBoxVisibility = debug
      },
      {
        type: "checkbox",
        id: `${ this.id }-debug-snap-points`,
        label: "Show snap points",
        initValue: this.behaviors.svgDebugger.snapPointsVisibility,
        callback: (debug) => this.behaviors.svgDebugger.snapPointsVisibility = debug
      },
      {
        type: "checkbox",
        id: `${ this.id }-debug-vertices`,
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
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Debug",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
  }

  protected createMenuExport(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-export`
    trigger.classList.add("ms-menu-button", "square")
    trigger.innerHTML = downloadIcon

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-export-json`,
        label: "json",
        callback: () =>
        {
          this.behaviors.downloadAsJson()
        }
      },
      {
        type: "button",
        id: `${ this.id }-export-svg`,
        label: "svg",
        callback: () =>
        {
          this.behaviors.downloadAsSVG()
        }
      },
      {
        type: "button",
        id: `${ this.id }-export-png`,
        label: "png",
        callback: () =>
        {
          this.behaviors.downloadAsPNG()
        }
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Export",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
  }

  protected async readFileAsText(file: File): Promise<string>
  {
    return new Promise((resolve, reject) =>
    {
      const reader = new FileReader()
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string)
      }
      if (file) {
        reader.readAsText(file)
      }
    })
  }

  protected createMenuImport(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-import`
    trigger.classList.add("ms-menu-button", "square")
    trigger.innerHTML = uploadIcon

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")

    const importInput = document.createElement("input")
    importInput.type = "file"
    importInput.accept = ".json"
    importInput.multiple = false
    importInput.addEventListener("change", () => {
      importBtn.disabled = !importInput.files?.length
    })

    subMenuWrapper.appendChild(importInput)
    const importBtn = document.createElement("button")
    importBtn.classList.add("ms-menu-button")
    importBtn.innerText = "Import"
    importBtn.disabled = true
    subMenuWrapper.appendChild(importBtn)
    importBtn.addEventListener("pointerup", async (e) =>
    {
      e.preventDefault()
      e.stopPropagation()
      if (importInput.files?.length) {
        const fileString = await this.readFileAsText(importInput.files[0])
        const symbols = JSON.parse(fileString) as PartialDeep<TOISymbol>[]
        await this.behaviors.createSymbols(symbols)
        importInput.value = ""
        importBtn.disabled = true
      }
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      menuTitle: "Import",
      subMenu: subMenuWrapper,
      position: "right-top"
    }
    return new OIMenuSub(params).element
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
      menuTrigger.id = this.id
      menuTrigger.classList.add("ms-menu-button", "square")
      menuTrigger.innerHTML = menuIcon

      const subMenuWrapper = document.createElement("div")
      subMenuWrapper.classList.add("ms-menu-colmun")
      subMenuWrapper.appendChild(this.createMenuGesture())
      subMenuWrapper.appendChild(this.createMenuGuide())
      subMenuWrapper.appendChild(this.createMenuSnap())
      subMenuWrapper.appendChild(this.createMenuDebug())
      subMenuWrapper.appendChild(this.createMenuImport())
      subMenuWrapper.appendChild(this.createMenuExport())

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-left", "ms-menu-row")
      this.wrapper.appendChild(new OIMenuSub({ trigger: menuTrigger, subMenu: subMenuWrapper, position: "bottom" }).element)
      this.wrapper.appendChild(this.createMenuLanguage())
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
    if (this.menuLanguage) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.isMobile ? this.menuLanguage.wrap() : this.menuLanguage.unwrap()
    }
    if (this.menuClear) {
      this.menuClear.disabled = this.behaviors.history.context.empty
    }
    if (this.menuUndo) {
      this.menuUndo.disabled = !this.behaviors.history.context.canUndo
    }
    if (this.menuRedo) {
      this.menuRedo.disabled = !this.behaviors.history.context.canRedo
    }
    if (this.menuConvert) {
      this.menuConvert.disabled = !this.behaviors.extractStrokesFromSymbols(this.model.symbols).length
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
