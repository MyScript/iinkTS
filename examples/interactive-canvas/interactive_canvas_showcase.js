/* eslint-disable no-undef */
import { Canvas } from "../../dist/iink.esm.js"
import shakespeareQuotes from "../assets/datas/shakespeare-quotes.json" with { type: "json" }
import { ModalCanvasOptions } from "../components/modal/modalCanvasOptions.js"

const rootElement = document.getElementById("rootEl")
const showModalBtn = document.getElementById("showModalBtn")
const importBtn = document.getElementById("import")
const panelToggleBtn = document.getElementById("panelToggleBtn")
const leftPan = document.getElementById("left-pan")

const htmlPanToggle = document.getElementById("toggle-export-html-pan")
const exportHtmlPan = document.getElementById("export-html-pan")
const htmlPanCloseBtn = document.getElementById("html-pan-close-btn")
const exportHtmlBody = document.getElementById("export-html-body")

let currentTabId = "symbols-tab"
const copyTabToClipboard = document.getElementById("copy-content-tab")
const contentTab = document.getElementById("content-tab")

const BACKEND_MODEL_EMPTY = `<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #666;">The backend model is empty</div>`

// Built on demand rather than on every refresh: serializing the symbols eagerly cost a 169KB
// string per change that nothing read unless the user actually pressed copy.
let currentDataProvider = () => ""

copyTabToClipboard.addEventListener("pointerup", () => {
  try {
    navigator.clipboard.writeText(currentDataProvider())
  } catch (err) {
    console.error(err)
    alert("Copy to clipboard disabled")
  }
})

/**
 * Identifies the in-flight tab render. A newer render bumps it, which makes any pending chunk of
 * the previous one give up instead of appending into a container that is no longer on screen.
 */
let renderToken = 0

const whenIdle = (fn) =>
  typeof requestIdleCallback === "function"
    ? requestIdleCallback(fn, { timeout: 1000 })
    : setTimeout(() => fn({ timeRemaining: () => 8 }), 0)

/**
 * Appends `items` to `container` a few at a time, handing the thread back between batches.
 *
 * renderjson builds ~96 DOM nodes per symbol, so rendering 200 of them in one go costs ~140ms
 * with layout. The panel refresh is debounced 300ms after the last change, which is right inside
 * the pause between two strokes - so that 140ms landed on the next `pointerdown` and swallowed
 * the start of the stroke. Chunking keeps every task short enough to never eat pointer input.
 */
function appendChunked(container, items, renderItem, token) {
  if (!items.length) return
  let i = 0
  const step = (deadline) => {
    if (token !== renderToken) return
    do {
      container.appendChild(renderItem(items[i]))
      i++
    } while (i < items.length && deadline.timeRemaining() > 4)
    if (i < items.length) whenIdle(step)
  }
  whenIdle(step)
}

/**
 * One symbol, rendered with its own properties visible but their contents collapsed - the depth
 * the whole array used to get when rendered as a single `renderjson` call. Without this the
 * per-symbol call would sit one level higher and expand every `pointers` array.
 */
function renderSymbolCollapsed(symbol) {
  renderjson.set_show_to_level(1)
  const el = renderjson(symbol)
  renderjson.set_show_to_level(2)
  return el
}

function isPanelVisible() {
  // Desktop: panel is always visible (width > 0); Mobile: needs .open class
  return window.innerWidth > 900 || leftPan.classList.contains("open")
}

async function updateTabContent() {
  if (!isPanelVisible()) return
  if (!canvas) {
    contentTab.innerHTML = "<p>No canvas available</p>"
    return
  }
  const token = ++renderToken
  let content
  let fillContent
  contentTab.innerHTML = `<div class="loader"></div>`
  copyTabToClipboard.disabled = true

  switch (currentTabId) {
    case "jiix-tab": {
      const exports = await canvas.export(["application/vnd.myscript.jiix"])
      const jiix = exports?.["application/vnd.myscript.jiix"] || {}
      content = renderjson(jiix)
      currentDataProvider = () => JSON.stringify(jiix)
      break
    }
    case "symbols-tab":
      if (canvas.model.symbols.length) {
        const MAX_SYMBOLS = 200
        const symbols = canvas.model.symbols
        const sliced = symbols.slice(0, MAX_SYMBOLS)
        const wrapper = document.createElement("div")
        if (symbols.length > MAX_SYMBOLS) {
          const banner = document.createElement("p")
          banner.style.cssText = "margin:4px 0;color:#888;font-size:0.85em"
          banner.textContent = `Showing ${MAX_SYMBOLS} of ${symbols.length} symbols`
          wrapper.appendChild(banner)
        }
        content = wrapper
        fillContent = () => appendChunked(wrapper, sliced, renderSymbolCollapsed, token)
        currentDataProvider = () => JSON.stringify(sliced)
      } else {
        const mes = document.createElement("p")
        mes.textContent = "No symbols"
        currentDataProvider = () => "No symbols"
        content = mes
      }
      break
    case "history-tab": {
      const history = { context: canvas.history.context, stack: canvas.history.stack }
      content = renderjson(history)
      currentDataProvider = () => JSON.stringify(history)
      break
    }
    case "selection-tab":
      if (canvas.model.symbolsSelected.length) {
        const list = document.createElement("ul")
        canvas.model.symbolsSelected.forEach((symbol) => {
          const listItem = document.createElement("li")
          const span = document.createElement("span")
          span.textContent = symbol.id
          listItem.appendChild(span)
          listItem.appendChild(createStrokeInputWrapper(symbol))
          listItem.addEventListener("pointerover", () => {
            listItem.style.setProperty("background-color", "#1a9fff50")
            document.getElementById(symbol.id).style.setProperty("outline", "2px ridge #1a9fff")
          })
          listItem.addEventListener("pointerout", () => {
            listItem.style.removeProperty("background-color")
            document.getElementById(symbol.id).style.removeProperty("outline")
          })
          list.appendChild(listItem)
        })
        content = list
        const selected = canvas.model.symbolsSelected
        currentDataProvider = () => JSON.stringify(selected)
      } else {
        const mes = document.createElement("p")
        mes.textContent = "No symbols selected"
        currentDataProvider = () => "No symbols selected"
        content = mes
      }
      break
  }
  // A tab switch or a later change may have started its own render while the `jiix-tab` export
  // above was in flight; that render owns the panel now, so drop this one rather than overwrite it.
  if (token !== renderToken) return
  while (contentTab.firstChild) {
    contentTab.firstChild.remove()
  }
  contentTab.appendChild(content)
  fillContent?.()
  copyTabToClipboard.disabled = false
}

function setCurrentTab(tabId) {
  currentTabId = tabId
  document.querySelectorAll(".tab-button").forEach((t) => t.classList.remove("active"))
  document.getElementById(tabId).classList.add("active")
  updateTabContent()
}

document.querySelectorAll(".tab-button").forEach((tab) =>
  tab.addEventListener("pointerup", (evt) => {
    setCurrentTab(evt.target.dataset.tabid)
  })
)

panelToggleBtn.addEventListener("click", () => {
  const open = leftPan.classList.toggle("open")
  panelToggleBtn.setAttribute("aria-expanded", String(open))
  panelToggleBtn.textContent = open ? "🔬 Close" : "🔬 Inspect"
  if (open) updateTabContent()
  canvas?.resize()
})

async function updateExportHTMLPan() {
  // Skip the HTML export while the backend panel is hidden - no point paying for it if nothing shows it.
  if (exportHtmlPan.style.getPropertyValue("display") === "block") {
    const HTML = await canvas.export(["text/html"])
    exportHtmlBody.srcdoc = HTML?.["text/html"] || BACKEND_MODEL_EMPTY
  }
}

htmlPanToggle.addEventListener("change", (event) => {
  exportHtmlPan.style.setProperty("display", event.target.checked ? "block" : "none")
  updateExportHTMLPan()
})

htmlPanCloseBtn.addEventListener("pointerup", () => {
  htmlPanToggle.checked = false
  exportHtmlPan.style.setProperty("display", "none")
})

exportHtmlPan.style.setProperty("display", htmlPanToggle.checked ? "block" : "none")

function createSymbolInputColor(symbol) {
  const inputColor = document.createElement("input")
  inputColor.setAttribute("type", "color")
  inputColor.value = symbol.style.color
  inputColor.classList.add("symbol-input")
  inputColor.addEventListener("change", (evt) => {
    canvas?.updateSymbols([symbol.id], { style: { color: evt.target.value } })
  })
  return inputColor
}

function createSymbolInputWidth(symbol) {
  const minus = document.createElement("button")
  minus.classList.add("symbol-input")
  minus.textContent = "-"

  const plus = document.createElement("button")
  plus.textContent = "+"
  plus.classList.add("symbol-input")

  function syncMinusState() {
    if (symbol.style.width <= 1) {
      minus.setAttribute("disabled", true)
    } else {
      minus.removeAttribute("disabled")
    }
  }

  minus.addEventListener("pointerup", () => {
    symbol.style.width--
    syncMinusState()
    canvas?.updateSymbols([symbol.id], { style: { width: symbol.style.width } })
  })

  plus.addEventListener("pointerup", () => {
    symbol.style.width++
    syncMinusState()
    canvas?.updateSymbols([symbol.id], { style: { width: symbol.style.width } })
  })

  syncMinusState()
  return { minus, plus }
}

function createStrokeInputWrapper(symbol) {
  const inputWrapper = document.createElement("div")
  inputWrapper.classList.add("symbol-input-wrapper")
  inputWrapper.appendChild(createSymbolInputColor(symbol))
  const inputs = createSymbolInputWidth(symbol)
  inputWrapper.appendChild(inputs.minus)
  inputWrapper.appendChild(inputs.plus)
  return inputWrapper
}

let canvas
const canvasOptions = {
  configuration: {},
}

async function loadCanvas(options) {
  importBtn.disabled = true
  exportHtmlBody.srcdoc = BACKEND_MODEL_EMPTY
  await canvas?.destroy()
  canvas = await Canvas.load(rootElement, "INTERACTIVE_INK", options)
  importBtn.disabled = false
  setCurrentTab(currentTabId)

  let exportTimeout
  let updateTabTimeout
  canvas.event.addEventListener("changed", (event) => {
    if (event.detail.empty) {
      importBtn.disabled = false
    } else {
      importBtn.disabled = canvas.model.symbols.some((s1) => shakespeareQuotes.some((s2) => s2.id === s1.id))
    }
    clearTimeout(updateTabTimeout)
    updateTabTimeout = setTimeout(() => updateTabContent(), 300)
    clearTimeout(exportTimeout)
    exportTimeout = setTimeout(async () => {
      updateExportHTMLPan()
    }, 500)
  })

  canvas.event.addEventListener("selected", () => {
    clearTimeout(updateTabTimeout)
    updateTabTimeout = setTimeout(() => updateTabContent(), 300)
  })
}

importBtn.addEventListener("pointerup", async () => {
  importBtn.disabled = true
  await canvas?.createSymbols(shakespeareQuotes)
})

showModalBtn.addEventListener("pointerup", () => {
  ModalCanvasOptions.show(loadCanvas, canvasOptions)
})

window.addEventListener("resize", () => {
  canvas?.resize()
})

ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions)

window.canvasOptions = canvasOptions
window.loadCanvas = loadCanvas
