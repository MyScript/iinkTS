import { randomUUID } from "crypto"
import { TMarginConfiguration } from "../@types/configuration/recognition/MarginConfiguration"
import { TJIIXExport, TWordExport } from "../@types/model/Model"
import { Exports } from "../Constants"
import { GlobalEvent } from "../event/GlobalEvent"


export class SmartGuide
{
  uuid: string
  private smartGuideElement!: HTMLDivElement
  private prompterContainerElement!: HTMLDivElement
  private prompterTextElement!: HTMLDivElement
  private ellipsisElement!: HTMLDivElement
  private tagElement!: HTMLDivElement
  private candidatesElement!: HTMLDivElement
  private menuElement!: HTMLDivElement
  private convertElement!: HTMLButtonElement
  private copyElement!: HTMLButtonElement
  private deleteElement!: HTMLButtonElement
  margin!: TMarginConfiguration
  isMenuOpen!: boolean
  jiix?: TJIIXExport
  lastWord?: TWordExport
  wordToChange?: TWordExport

  constructor()
  {
    this.uuid = randomUUID()
    this.createWrapperElement()
    this.createPrompterContainerElement()
    this.createPrompterTextElement()
    this.createEllipsisElement()
    this.createTagElement()
    this.createCandidatesElement()
    this.createMoreMenuElement()
    this.createConvertElement()
    this.createCopyElement()
    this.createDeleteElement()
  }

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  private createWrapperElement(): void
  {
    this.smartGuideElement = document.createElement('div')
    this.smartGuideElement.id = `smartguide-${ this.uuid }`
    this.smartGuideElement.classList.add('smartguide')
  }

  private createPrompterContainerElement(): void
  {
    this.prompterContainerElement = document.createElement('div')
    this.prompterContainerElement.id = `prompter-container-${ this.uuid }`
    this.prompterContainerElement.classList.add('prompter-container')
    // this.prompterContainerElement.appendChild(textElement)
  }

  private createPrompterTextElement(): void
  {
    this.prompterTextElement = document.createElement('div')
    this.prompterTextElement.id = `prompter-text-${ this.uuid }`
    this.prompterTextElement.classList.add('prompter-text')
    this.prompterTextElement.setAttribute('touch-action', 'none')
  }

  private createEllipsisElement(): void
  {
    this.ellipsisElement = document.createElement('div')
    this.ellipsisElement.id = `ellipsis-${ this.uuid }`
    this.ellipsisElement.classList.add('ellipsis')
    this.ellipsisElement.innerHTML = '...'
  }

  private createTagElement(): void
  {
    this.tagElement = document.createElement('div')
    this.tagElement.id = `tag-icon-${ this.uuid }`
    this.tagElement.classList.add('tag-icon')
    this.tagElement.innerHTML = '&#182;'
  }

  private createCandidatesElement(): void
  {
    this.candidatesElement = document.createElement('div')
    this.candidatesElement.id = `candidates-${ this.uuid }`
    this.candidatesElement.classList.add('candidates')
  }

  private createMoreMenuElement(): void
  {
    this.menuElement = document.createElement('div')
    this.menuElement.id = `more-menu-${ this.uuid }`
    this.menuElement.classList.add('more-menu')
  }

  private createConvertElement(): void
  {
    this.convertElement = document.createElement('button')
    this.convertElement.id = `convert-${ this.uuid }`
    this.convertElement.classList.add('options-label-button')
    this.convertElement.innerHTML = 'Convert'
  }

  private createCopyElement(): void
  {
    this.copyElement = document.createElement('button')
    this.copyElement.id = `copy-${ this.uuid }`
    this.copyElement.classList.add('options-label-button')
    this.copyElement.innerHTML = 'Copy'
  }

  private createDeleteElement(): void
  {
    this.deleteElement = document.createElement('button')
    this.deleteElement.id = `delete-${ this.uuid }`
    this.deleteElement.classList.add('options-label-button')
    this.deleteElement.innerHTML = 'Delete'
  }

  init(domElement: HTMLElement, margin: TMarginConfiguration): void
  {
    domElement.appendChild(this.smartGuideElement)
    // this.smartGuideElement.style.visibility = 'hidden'
    this.smartGuideElement.appendChild(this.tagElement)

    this.prompterContainerElement.appendChild(this.prompterTextElement)
    this.smartGuideElement.appendChild(this.prompterContainerElement)

    this.smartGuideElement.appendChild(this.ellipsisElement)

    this.menuElement.appendChild(this.convertElement)
    this.menuElement.appendChild(this.copyElement)
    this.menuElement.appendChild(this.deleteElement)
    this.smartGuideElement.appendChild(this.menuElement)
    this.menuElement.classList.add('close')
    this.isMenuOpen = false

    this.smartGuideElement.appendChild(this.candidatesElement)
    this.margin = margin
    this.addListeners()
    this.resize()
  }

  toggleMenuVisibility(): void
  {
    if (this.isMenuOpen) {
      this.menuElement.classList.add('close')
      this.menuElement.classList.remove('open')
    }
    else {
      this.menuElement.classList.add('open')
      this.menuElement.classList.remove('close')
    }
    this.isMenuOpen = !this.isMenuOpen
  }

  private onToggleMenu = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.toggleMenuVisibility()
  }

  private onConvert = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.globalEvent.emitConvert()
  }

  private onCopy = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    // TODO copy smart guide
  }

  private onDelete = (evt: Event) =>
  {
    evt.preventDefault()
    evt.stopPropagation()
    this.globalEvent.emitClear()
  }

  private showCandidates = (evt: Event) => {
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target as HTMLElement
    if (target.id !== this.prompterTextElement.id) {
      const id = parseInt(target.id.replace('word-', '').replace(this.uuid, ''))
      const words = this.jiix?.words as TWordExport[]
      this.wordToChange = words[id]
      this.wordToChange.id = id.toString()
      this.candidatesElement.innerHTML = ''
      if (this.wordToChange?.candidates) {
        this.candidatesElement.style.display = 'flex'
        this.wordToChange.candidates.forEach((word, index) => {
          if (this.wordToChange?.label === word) {
            this.candidatesElement.innerHTML += `<span id="cdt-${index}${this.uuid}" class="selected-word">${word}</span>`
          } else {
            this.candidatesElement.innerHTML += `<span id="cdt-${index}${this.uuid}">${word}</span>`
          }
        })
        const top = 48
        const left = target.getBoundingClientRect().left - 60
        this.candidatesElement.style.top = `${top}px`
        this.candidatesElement.style.left = `${left}px`

        const parent = target.parentNode?.parentNode?.parentNode
        if (parent) {
          parent.insertBefore(this.candidatesElement, target.parentNode?.parentNode)
        }
      }
    } else {
      this.candidatesElement.style.display = 'none'
    }
  }

  private clickCandidate = (evt: Event) => {
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target as HTMLElement
    const candidate = target.innerText

    if (this.jiix && candidate !== this.wordToChange?.label && this.wordToChange?.candidates?.includes(candidate)) {
      this.jiix.words[parseInt(this.wordToChange?.id as string)].label = candidate
      this.globalEvent.emitImport(this.jiix, Exports.JIIX)
    }
    this.candidatesElement.style.display = 'none'
  }

  private addListeners(): void
  {
    this.ellipsisElement.addEventListener('pointerdown', evt => this.onToggleMenu(evt))
    this.convertElement.addEventListener('pointerdown', evt => this.onConvert(evt))
    this.copyElement.addEventListener('pointerdown', evt => this.onCopy(evt))
    this.deleteElement.addEventListener('pointerdown', evt => this.onDelete(evt))
    this.prompterTextElement.addEventListener('pointerdown', evt => this.showCandidates(evt))
    this.candidatesElement.addEventListener('pointerdown', evt => this.clickCandidate(evt))
  }

  resize(): void
  {
    const mmToPixels = 3.779527559
    const marginTop = this.margin.top * mmToPixels
    const marginLeft = this.margin.left * mmToPixels
    const marginRight = this.margin.right * mmToPixels
    // 12 is the space between line in mm
    const top = marginTop - (12 * mmToPixels)

    this.smartGuideElement.style.top = `${ top }px`
    this.smartGuideElement.style.left = `${ marginLeft }px`
    this.smartGuideElement.style.right = `${ marginRight }px`

    let left = this.tagElement.offsetWidth
    this.prompterContainerElement.style.marginLeft = `${ left }px`
    this.prompterContainerElement.style.width = `${ this.smartGuideElement.clientWidth - this.tagElement.offsetWidth - this.ellipsisElement.offsetHeight }px`

    left += this.prompterContainerElement.offsetWidth
    this.menuElement.style.left = `${ left - this.menuElement.offsetWidth + this.ellipsisElement.offsetWidth }px`
    this.menuElement.style.top = `${ this.ellipsisElement.offsetHeight }px`
    this.ellipsisElement.style.left = `${ left }px`
  }

  update(exports: TJIIXExport): void
  {
    this.jiix = exports
    const createWordSpan = (index: number, word?: TWordExport) => {
      const span = document.createElement('span')
      span.id = `word-${index}${this.uuid}`
      if (word) {
        span.textContent = word.label
      } else {
        span.innerHTML = '&nbsp;'
      }
      return span
    }

    const populatePrompter = () => {
      this.prompterTextElement.innerHTML = ''
      if (this.jiix?.words) {
        const words = this.jiix.words as TWordExport[]
        const myFragment = document.createDocumentFragment()
        words.forEach((word, index) => {
          if (word.label === ' ' || word.label.includes('\n')) {
            myFragment.appendChild(createWordSpan(index))
          } else if (index !== words.length - 1) {
            myFragment.appendChild(createWordSpan(index, word))
          } else {
            this.prompterTextElement.appendChild(myFragment)
            // this.perfectScrollbar.update()
            if (this.lastWord) {
              this.lastWord = word
            }
            const span = createWordSpan(index, word)
            // This is used to scroll to last word if last word is modified
            if ((this.lastWord?.candidates !== word.candidates) && (this.lastWord?.label !== word.label)) {
              span.classList.add('added-word')
              this.prompterTextElement.appendChild(span)
              this.prompterContainerElement.scrollLeft = span.offsetLeft
              this.lastWord = word
            } else {
              this.prompterTextElement.appendChild(span)
              this.prompterContainerElement.scrollLeft = span.offsetLeft
            }
          }
        })
      }
    }
    populatePrompter()
  }
}