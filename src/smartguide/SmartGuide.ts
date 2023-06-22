import { TMarginConfiguration } from "../@types/configuration/recognition/MarginConfiguration"
import { TRenderingConfiguration } from "../@types/configuration/RenderingConfiguration"
import { TJIIXExport, TWordExport } from "../@types/model/Model"
import { Exports } from "../Constants"
import { GlobalEvent } from "../event/GlobalEvent"

export class SmartGuide
{
  uuid: string
  #smartGuideElement!: HTMLDivElement
  #prompterContainerElement!: HTMLDivElement
  #prompterTextElement!: HTMLDivElement
  #ellipsisElement!: HTMLDivElement
  #tagElement!: HTMLDivElement
  #candidatesElement!: HTMLDivElement
  #menuElement!: HTMLDivElement
  #convertElement!: HTMLButtonElement
  #copyElement!: HTMLButtonElement
  #deleteElement!: HTMLButtonElement
  #fadeOutTimout?: ReturnType<typeof setTimeout>
  #isMenuOpen!: boolean
  margin: TMarginConfiguration
  renderingConfiguration!: TRenderingConfiguration
  jiix?: TJIIXExport
  lastWord?: TWordExport
  wordToChange?: TWordExport

  constructor()
  {
    this.uuid = Math.random().toString(10).substring(2, 12)
    this.margin = {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0
    }
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

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  #createWrapperElement(): void
  {
    this.#smartGuideElement = document.createElement("div")
    this.#smartGuideElement.id = `smartguide-${ this.uuid }`
    this.#smartGuideElement.classList.add("smartguide")
  }

  #createPrompterContainerElement(): void
  {
    this.#prompterContainerElement = document.createElement("div")
    this.#prompterContainerElement.id = `prompter-container-${ this.uuid }`
    this.#prompterContainerElement.classList.add("prompter-container")
    // this.#prompterContainerElement.appendChild(textElement)
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
    domElement.appendChild(this.#smartGuideElement)
    this.#smartGuideElement.appendChild(this.#tagElement)

    this.#prompterContainerElement.appendChild(this.#prompterTextElement)
    this.#smartGuideElement.appendChild(this.#prompterContainerElement)

    this.#smartGuideElement.appendChild(this.#ellipsisElement)

    this.#menuElement.appendChild(this.#convertElement)
    this.#menuElement.appendChild(this.#copyElement)
    this.#menuElement.appendChild(this.#deleteElement)
    this.#smartGuideElement.appendChild(this.#menuElement)
    this.#menuElement.classList.add("close")
    this.#isMenuOpen = false

    this.#smartGuideElement.appendChild(this.#candidatesElement)
    this.#candidatesElement.style.display = "none"
    this.margin = margin
    this.renderingConfiguration = renderingConfiguration
    this.#addListeners()

    this.#show()
    if (this.renderingConfiguration.smartGuide.fadeOut.enable) {
      this.#initFadeOutObserver(this.renderingConfiguration.smartGuide.fadeOut.duration)
    }

    this.resize()
  }

  #initFadeOutObserver(duration = 3000): void
  {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        clearTimeout(this.#fadeOutTimout)
        if (this.#candidatesElement.style.display === "none" && !this.#isMenuOpen) {
          this.#fadeOutTimout = setTimeout(() => {
            this.#hide()
          }, duration)
        } else if (!document.contains(this.#candidatesElement) && !document.contains(this.#menuElement)) {
          this.#fadeOutTimout = setTimeout(() => {
            this.#hide()
          }, duration)
        }
      })
    })
    observer.observe(this.#smartGuideElement, { childList: true, subtree: true, attributes: true })
  }

  #show(): void
  {
    this.#smartGuideElement.classList.remove("smartguide-out")
    this.#smartGuideElement.classList.add("smartguide-in")
  }
  #hide(): void
  {
    this.#smartGuideElement.classList.add("smartguide-out")
    this.#smartGuideElement.classList.remove("smartguide-in")
  }

  #showCandidates = (target: HTMLElement) => {
    const wordId = parseInt(target.id.replace("word-", "").replace(this.uuid, ""))
    const words = this.jiix?.words as TWordExport[]
    this.wordToChange = words[wordId]
    if (this.wordToChange) {
      this.wordToChange.id = wordId.toString()
      this.#candidatesElement.innerHTML = ""
      if (this.wordToChange?.candidates) {
        this.#candidatesElement.style.display = "flex"
        this.wordToChange.candidates.forEach((word, index) => {
          if (this.wordToChange?.label === word) {
            this.#candidatesElement.innerHTML += `<span id="cdt-${index}${this.uuid}" class="selected-word">${word}</span>`
          } else {
            this.#candidatesElement.innerHTML += `<span id="cdt-${index}${this.uuid}">${word}</span>`
          }
        })
        const top = 48
        const left = target.getBoundingClientRect().left - 60
        this.#candidatesElement.style.top = `${top}px`
        this.#candidatesElement.style.left = `${left}px`

        const parent = target.parentNode?.parentNode?.parentNode
        if (parent) {
          parent.insertBefore(this.#candidatesElement, target.parentNode?.parentNode)
        }
      }
    }
  }
  #hideCandidates(): void
  {
    this.#candidatesElement.style.display = "none"
  }

  #openMenu(): void {
    this.#menuElement.classList.add("open")
    this.#menuElement.classList.remove("close")
    this.#isMenuOpen = true
  }
  #closeMenu(): void {
    this.#menuElement.classList.add("close")
    this.#menuElement.classList.remove("open")
    this.#isMenuOpen = false
  }

  #onClickEllipsis = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.#isMenuOpen ? this.#closeMenu() : this.#openMenu()
    this.#hideCandidates()
  }

  #onClickConvert = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.globalEvent.emitConvert()
    this.#closeMenu()
  }

  #onClickCopy = async (evt: Event): Promise<void> =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    try {
      this.#closeMenu()
      let message = "Nothing to copy"
      if (this.#prompterTextElement.innerText) {
        message = `"${this.#prompterTextElement.innerText}" copied to clipboard`
        await navigator.clipboard.writeText(this.#prompterTextElement.innerText)
      }
      this.globalEvent.emitNotif(message)
    } catch (err) {
      this.globalEvent.emitError(err as Error)
    }
  }

  #onClickDelete = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.globalEvent.emitClear()
    this.#closeMenu()
  }

  #onClickCandidate = (evt: Event) => {
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target as HTMLElement
    const candidate = target.innerText
    if (this.jiix && candidate !== this.wordToChange?.label && this.wordToChange?.candidates?.includes(candidate)) {
      this.jiix.words[parseInt(this.wordToChange?.id as string)].label = candidate
      this.globalEvent.emitImport(this.jiix, Exports.JIIX)
    }
    this.#candidatesElement.style.display = "none"
  }

  #onClickPrompter = (evt: Event): void =>
  {
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

  #onClickOutSide = () => {
    this.#hideCandidates()
    this.#closeMenu()
  }

  #addListeners(): void
  {
    this.#ellipsisElement.addEventListener("pointerdown", evt => this.#onClickEllipsis(evt))
    this.#convertElement.addEventListener("pointerdown", evt => this.#onClickConvert(evt))
    this.#copyElement.addEventListener("pointerdown", evt => this.#onClickCopy(evt))
    this.#deleteElement.addEventListener("pointerdown", evt => this.#onClickDelete(evt))
    this.#prompterTextElement.addEventListener("pointerdown", evt => this.#onClickPrompter(evt))
    this.#candidatesElement.addEventListener("pointerdown", evt => this.#onClickCandidate(evt))
    document.addEventListener("pointerdown", () => this.#onClickOutSide())
  }

  resize(): void
  {
    const mmToPixels = 3.779527559
    const marginTop = this.margin.top * mmToPixels
    const marginLeft = this.margin.left * mmToPixels
    const marginRight = this.margin.right * mmToPixels
    // 12 is the space between line in mm
    const top = marginTop - (12 * mmToPixels)

    this.#smartGuideElement.style.top = `${ top }px`
    this.#smartGuideElement.style.left = `${ marginLeft }px`
    this.#smartGuideElement.style.right = `${ marginRight }px`

    let left = this.#tagElement.offsetWidth
    this.#prompterContainerElement.style.marginLeft = `${ left }px`
    this.#prompterContainerElement.style.width = `${ this.#smartGuideElement.clientWidth - this.#tagElement.offsetWidth - this.#ellipsisElement.offsetHeight }px`

    left += this.#prompterContainerElement.offsetWidth
    this.#menuElement.style.left = `${ left - this.#menuElement.offsetWidth + this.#ellipsisElement.offsetWidth }px`
    this.#menuElement.style.top = `${ this.#ellipsisElement.offsetHeight }px`
    this.#ellipsisElement.style.left = `${ left }px`
  }

  update(exports: TJIIXExport): void
  {
    this.jiix = exports
    const createWordSpan = (index: number, word?: TWordExport) => {
      const span = document.createElement("span")
      span.id = `word-${index}${this.uuid}`
      if (word) {
        span.textContent = word.label
      } else {
        span.innerHTML = "&nbsp;"
      }
      return span
    }

    const populatePrompter = () => {
      this.#prompterTextElement.innerHTML = ""
      if (this.jiix?.words) {
        const words = this.jiix.words as TWordExport[]
        const myFragment = document.createDocumentFragment()
        words.forEach((word, index) => {
          if (word.label === " " || word.label.includes("\n")) {
            myFragment.appendChild(createWordSpan(index))
          } else if (index !== words.length - 1) {
            myFragment.appendChild(createWordSpan(index, word))
          } else {
            this.#prompterTextElement.appendChild(myFragment)
            // this.perfectScrollbar.update()
            if (this.lastWord) {
              this.lastWord = word
            }
            const span = createWordSpan(index, word)
            // This is used to scroll to last word if last word is modified
            if ((this.lastWord?.candidates !== word.candidates) && (this.lastWord?.label !== word.label)) {
              span.classList.add("added-word")
              this.#prompterTextElement.appendChild(span)
              this.#prompterContainerElement.scrollLeft = span.offsetLeft
              this.lastWord = word
            } else {
              this.#prompterTextElement.appendChild(span)
              this.#prompterContainerElement.scrollLeft = span.offsetLeft
            }
          }
        })
      }
    }
    populatePrompter()
    if (this.jiix?.words?.length) {
      this.#show()
    }
  }

  clear(): void
  {
    this.#prompterTextElement.innerHTML = ""
    this.#candidatesElement.innerHTML = ""
    this.#hide()
  }
}
