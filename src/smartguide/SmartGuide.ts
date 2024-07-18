import { TMarginConfiguration, TRenderingConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerClass, LoggerManager } from "../logger"
import { TJIIXExport, TJIIXWord } from "../model"
import { convertMillimeterToPixel, createUUID } from "../utils"

/**
 * @group SmartGuide
 */
export class SmartGuide
{
  uuid: string
  #smartGuideElement!: HTMLDivElement
  #wrapperElement!: HTMLDivElement
  #prompterContainerElement!: HTMLDivElement
  #prompterTextElement!: HTMLDivElement
  #ellipsisElement!: HTMLDivElement
  #tagElement!: HTMLDivElement
  #candidatesElement!: HTMLDivElement
  #menuElement!: HTMLDivElement
  #convertElement!: HTMLButtonElement
  #copyElement!: HTMLButtonElement
  #deleteElement!: HTMLButtonElement
  #isMenuOpen!: boolean
  margin: TMarginConfiguration
  renderingConfiguration!: TRenderingConfiguration
  jiix?: TJIIXExport
  lastWord?: TJIIXWord
  wordToChange?: TJIIXWord
  #logger = LoggerManager.getLogger(LoggerClass.SMARTGUIDE)

  constructor()
  {
    this.#logger.info("constructor")
    this.uuid = createUUID()
    this.margin = {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0
    }
    this.#createRootElement()
    this.#createWrapperElement()
    this.#createPrompterContainerElement()
    this.#createPrompterTextElement()
    this.#createEllipsisElement()
    this.#createTagElement()
    this.#createCandidatesElement()
    this.#createMoreMenuElement()
    this.#createConvertElement()
    this.#createCopyElement()
    this.#createDeleteElement()
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  #createRootElement(): void
  {
    this.#smartGuideElement = document.createElement("div")
    this.#smartGuideElement.id = `smartguide-${ this.uuid }`
    this.#smartGuideElement.classList.add("smartguide")
    this.#smartGuideElement.addEventListener("pointerdown", e => {
      e.preventDefault()
      e.stopPropagation()
    })
  }

  #createWrapperElement(): void
  {
    this.#wrapperElement = document.createElement("div")
    this.#wrapperElement.id = `smartguide-wrapper-${ this.uuid }`
    this.#wrapperElement.classList.add("smartguide-wrapper")
  }

  #createPrompterContainerElement(): void
  {
    this.#prompterContainerElement = document.createElement("div")
    this.#prompterContainerElement.id = `prompter-container-${ this.uuid }`
    this.#prompterContainerElement.classList.add("prompter-container")
  }

  #createPrompterTextElement(): void
  {
    this.#prompterTextElement = document.createElement("div")
    this.#prompterTextElement.id = `prompter-text-${ this.uuid }`
    this.#prompterTextElement.classList.add("prompter-text")
    this.#prompterTextElement.setAttribute("touch-action", "none")
  }

  #createEllipsisElement(): void
  {
    this.#ellipsisElement = document.createElement("div")
    this.#ellipsisElement.id = `ellipsis-${ this.uuid }`
    this.#ellipsisElement.classList.add("ellipsis")
    this.#ellipsisElement.innerHTML = "..."
  }

  #createTagElement(): void
  {
    this.#tagElement = document.createElement("div")
    this.#tagElement.id = `tag-icon-${ this.uuid }`
    this.#tagElement.classList.add("tag-icon")
    this.#tagElement.innerHTML = "&#182;"
  }

  #createCandidatesElement(): void
  {
    this.#candidatesElement = document.createElement("div")
    this.#candidatesElement.id = `candidates-${ this.uuid }`
    this.#candidatesElement.classList.add("candidates")
  }

  #createMoreMenuElement(): void
  {
    this.#menuElement = document.createElement("div")
    this.#menuElement.id = `more-menu-${ this.uuid }`
    this.#menuElement.classList.add("more-menu")
  }

  #createConvertElement(): void
  {
    this.#convertElement = document.createElement("button")
    this.#convertElement.id = `convert-${ this.uuid }`
    this.#convertElement.classList.add("options-label-button")
    this.#convertElement.innerHTML = "Convert"
  }

  #createCopyElement(): void
  {
    this.#copyElement = document.createElement("button")
    this.#copyElement.id = `copy-${ this.uuid }`
    this.#copyElement.classList.add("options-label-button")
    this.#copyElement.innerHTML = "Copy"
  }

  #createDeleteElement(): void
  {
    this.#deleteElement = document.createElement("button")
    this.#deleteElement.id = `delete-${ this.uuid }`
    this.#deleteElement.classList.add("options-label-button")
    this.#deleteElement.innerHTML = "Delete"
  }

  init(domElement: HTMLElement, margin: TMarginConfiguration, renderingConfiguration: TRenderingConfiguration): void
  {
    this.#logger.info("init", { domElement, margin, renderingConfiguration })
    domElement.appendChild(this.#smartGuideElement)
    this.#smartGuideElement.appendChild(this.#wrapperElement)

    this.#wrapperElement.appendChild(this.#tagElement)

    this.#prompterContainerElement.appendChild(this.#prompterTextElement)
    this.#wrapperElement.appendChild(this.#prompterContainerElement)

    this.#wrapperElement.appendChild(this.#ellipsisElement)

    this.#menuElement.appendChild(this.#convertElement)
    this.#menuElement.appendChild(this.#copyElement)
    this.#menuElement.appendChild(this.#deleteElement)
    this.#menuElement.classList.add("close")
    this.#wrapperElement.appendChild(this.#menuElement)
    this.#isMenuOpen = false

    this.#candidatesElement.style.display = "none"
    this.#wrapperElement.appendChild(this.#candidatesElement)
    this.margin = margin
    this.renderingConfiguration = renderingConfiguration
    this.#addListeners()

    this.resize()
  }

  #showCandidates = (target: HTMLElement) =>
  {
    this.#logger.info("showCandidates", { target })
    const wordId = parseInt(target.id.replace("word-", "").replace(this.uuid, ""))
    const words = this.jiix?.words as TJIIXWord[]
    this.wordToChange = words[wordId]
    if (this.wordToChange) {
      this.wordToChange.id = wordId.toString()
      this.#candidatesElement.innerHTML = ""
      if (this.wordToChange?.candidates) {
        this.#candidatesElement.style.display = "flex"
        this.wordToChange.candidates.forEach((word, index) =>
        {
          if (this.wordToChange?.label === word) {
            this.#candidatesElement.innerHTML += `<span id="cdt-${ index }${ this.uuid }" class="selected-word">${ word }</span>`
          } else {
            this.#candidatesElement.innerHTML += `<span id="cdt-${ index }${ this.uuid }">${ word }</span>`
          }
        })

        target.appendChild(this.#candidatesElement)
      }
    }
  }
  #hideCandidates(): void
  {
    this.#candidatesElement.style.display = "none"
  }

  #openMenu(): void
  {
    this.#menuElement.classList.add("open")
    this.#menuElement.classList.remove("close")
    this.#isMenuOpen = true
  }
  #closeMenu(): void
  {
    this.#menuElement.classList.add("close")
    this.#menuElement.classList.remove("open")
    this.#isMenuOpen = false
  }

  #onClickEllipsis = (evt: Event) =>
  {
    this.#logger.info("onClickEllipsis", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    this.#isMenuOpen ? this.#closeMenu() : this.#openMenu()
    this.#hideCandidates()
  }

  #onClickConvert = (evt: Event) =>
  {
    this.#logger.info("onClickConvert", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    this.internalEvent.emitConvert()
    this.#closeMenu()
  }

  #createTextAreaElement(value: string): HTMLTextAreaElement
  {
    const isRTL = document.documentElement.getAttribute("dir") === "rtl"
    const textArea = document.createElement("textarea")
    textArea.style.fontSize = "12pt"
    textArea.style.display = "absolute"
    textArea.style[isRTL ? "right" : "left"] = "-9999px"
    const yPosition = window.pageYOffset || document.documentElement.scrollTop
    textArea.style.top = `${ yPosition }px`
    textArea.setAttribute("readonly", "")
    textArea.value = value
    return textArea
  }

  #selectText(textArea: HTMLTextAreaElement)
  {
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange()
      range.selectNodeContents(textArea)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        textArea.setSelectionRange(0, 999999)
      }
    } else {
      textArea.select()
    }
  }

  #onClickCopy = async (evt: Event): Promise<void> =>
  {
    this.#logger.info("onClickCopy", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    try {
      this.#closeMenu()
      let message = "Nothing to copy"
      if (this.#prompterTextElement.innerText) {
        message = `"${ this.#prompterTextElement.innerText }" copied to clipboard`
        const fakeEl = this.#createTextAreaElement(this.#prompterTextElement.innerText)
        this.#prompterContainerElement.appendChild(fakeEl)
        this.#selectText(fakeEl)
        document.execCommand("copy")
        fakeEl.remove()
      }
      this.internalEvent.emitNotif({ message, timeout: 1500 })
    } catch (error) {
      this.#logger.error("onClickCopy", error)
      this.internalEvent.emitError(error as Error)
    }
  }

  #onClickDelete = (evt: Event) =>
  {
    this.#logger.info("onClickDelete", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    this.internalEvent.emitClear()
    this.#closeMenu()
  }

  #onClickCandidate = (evt: Event) =>
  {
    this.#logger.info("onClickCandidate", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target as HTMLElement
    const candidate = target.innerText
    if (this.jiix?.words && candidate !== this.wordToChange?.label && this.wordToChange?.candidates?.includes(candidate)) {
      this.jiix.words[parseInt(this.wordToChange?.id as string)].label = candidate
      this.internalEvent.emitImportJIIX(this.jiix)
    }
    this.#candidatesElement.style.display = "none"
  }

  #onClickPrompter = (evt: Event): void =>
  {
    this.#logger.info("onClickPrompter", { evt })
    evt.preventDefault()
    evt.stopPropagation()
    this.#closeMenu()
    const target = evt.target as HTMLElement
    if (target.id !== this.#prompterTextElement.id) {
      this.#showCandidates(target)
    } else {
      this.#hideCandidates()
    }
  }

  #stopPropagation = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
  }

  #onClickOutSide = () =>
  {
    this.#hideCandidates()
    this.#closeMenu()
  }

  #addListeners(): void
  {
    this.#smartGuideElement.addEventListener("pointerdown", this.#stopPropagation.bind(this))
    this.#ellipsisElement.addEventListener("pointerdown", this.#onClickEllipsis.bind(this))
    this.#convertElement.addEventListener("pointerdown", this.#onClickConvert.bind(this))
    this.#copyElement.addEventListener("pointerdown", this.#onClickCopy.bind(this))
    this.#deleteElement.addEventListener("pointerdown", this.#onClickDelete.bind(this))
    this.#prompterTextElement.addEventListener("pointerdown", this.#onClickPrompter.bind(this))
    this.#candidatesElement.addEventListener("pointerdown", this.#onClickCandidate.bind(this))
    document.addEventListener("pointerdown", this.#onClickOutSide.bind(this))
  }

  #removeListeners(): void
  {
    this.#smartGuideElement.addEventListener("pointerdown", this.#stopPropagation)
    this.#ellipsisElement.removeEventListener("pointerdown", this.#onClickEllipsis)
    this.#convertElement.removeEventListener("pointerdown", this.#onClickConvert)
    this.#copyElement.removeEventListener("pointerdown", this.#onClickCopy)
    this.#deleteElement.removeEventListener("pointerdown", this.#onClickDelete)
    this.#prompterTextElement.removeEventListener("pointerdown", this.#onClickPrompter)
    this.#candidatesElement.removeEventListener("pointerdown", this.#onClickCandidate)
    document.removeEventListener("pointerdown", this.#onClickOutSide)
  }

  resize(): void
  {
    this.#logger.info("resize")
    const marginLeft = convertMillimeterToPixel(this.margin.left)
    const marginRight = convertMillimeterToPixel(this.margin.right)
    this.#wrapperElement.style.marginLeft = `${ marginLeft }px`
    this.#wrapperElement.style.marginRight = `${ marginRight }px`
  }

  update(exports: TJIIXExport): void
  {
    this.#logger.info("update", { exports })
    this.jiix = exports
    const createWordSpan = (index: number, word?: TJIIXWord) =>
    {
      const span = document.createElement("span")
      span.id = `word-${ index }${ this.uuid }`
      if (word) {
        span.textContent = word.label
      } else {
        span.innerHTML = "&nbsp;"
      }
      this.#logger.debug("update", { span })
      return span
    }

    const populatePrompter = () =>
    {
      this.#logger.info("populatePrompter")
      this.#prompterTextElement.innerHTML = ""
      if (this.jiix?.words) {
        const words = this.jiix.words as TJIIXWord[]
        const myFragment = document.createDocumentFragment()
        words.forEach((word, index) =>
        {
          if (word.label === " " || word.label.includes("\n")) {
            myFragment.appendChild(createWordSpan(index))
          } else if (index !== words.length - 1) {
            myFragment.appendChild(createWordSpan(index, word))
          } else {
            this.#prompterTextElement.appendChild(myFragment)
            if (this.lastWord) {
              this.lastWord = word
            }
            const span = createWordSpan(index, word)
            // This is used to scroll to last word if last word is modified

            if ((this.lastWord?.candidates !== word.candidates) && (this.lastWord?.label !== word.label)) {
              this.lastWord = word
            }
            if (this.wordToChange?.id === index.toString()) {
              span.classList.add("modified-word")
              this.wordToChange = undefined
            }
            else {
              span.classList.add("added-word")
            }
            this.#prompterTextElement.appendChild(span)
            this.#prompterContainerElement.scrollLeft = span.offsetLeft
            this.#logger.debug("update => populatePrompter", { span, lastWord: this.lastWord })
          }
        })
      }
    }
    populatePrompter()
    if (this.jiix?.words?.length) {
      this.#ellipsisElement.style.setProperty("pointer-events", "auto")
    }
    else {
      this.#ellipsisElement.style.setProperty("pointer-events", "none")
    }
  }

  clear(): void
  {
    this.#logger.info("clear")
    this.#prompterTextElement.innerHTML = ""
    this.#candidatesElement.innerHTML = ""
  }

  destroy(): void
  {
    this.#logger.info("destroy")
    this.#removeListeners()
    this.#smartGuideElement.remove()
  }
}
