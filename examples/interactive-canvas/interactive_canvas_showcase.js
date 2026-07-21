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

copyTabToClipboard.addEventListener("pointerup", () => {
  try {
    navigator.clipboard.writeText(contentTab.getAttribute("data-string"))
  } catch (err) {
    console.error(err)
    alert("Copy to clipboard disabled")
  }
})

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
  let content
  let dataString = ""
  contentTab.innerHTML = `<div class="loader"></div>`
  copyTabToClipboard.disabled = true

  switch (currentTabId) {
    case "jiix-tab": {
      const exports = await canvas.export(["application/vnd.myscript.jiix"])
      const jiix = exports?.["application/vnd.myscript.jiix"] || {}
      content = renderjson(jiix)
      dataString = JSON.stringify(jiix)
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
        wrapper.appendChild(renderjson(sliced))
        content = wrapper
        dataString = JSON.stringify(sliced)
      } else {
        const mes = document.createElement("p")
        mes.textContent = "No symbols"
        dataString = "No symbols"
        content = mes
      }
      break
    case "history-tab":
      content = renderjson({
        context: canvas.history.context,
        stack: canvas.history.stack,
      })
      dataString = JSON.stringify({
        context: canvas.history.context,
        stack: canvas.history.stack,
      })
      break
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
        dataString = JSON.stringify(canvas.model.symbolsSelected)
      } else {
        const mes = document.createElement("p")
        mes.textContent = "No symbols selected"
        dataString = "No symbols selected"
        content = mes
      }
      break
  }
  while (contentTab.firstChild) {
    contentTab.firstChild.remove()
  }
  contentTab.setAttribute("data-string", dataString)
  contentTab.appendChild(content)
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
    canvas?.updateSymbolsStyle([symbol.id], { color: evt.target.value })
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
    canvas?.updateSymbolsStyle([symbol.id], { width: symbol.style.width })
  })

  plus.addEventListener("pointerup", () => {
    symbol.style.width++
    syncMinusState()
    canvas?.updateSymbolsStyle([symbol.id], { width: symbol.style.width })
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
const editorOptions = {
  configuration: {},
}

async function loadEditor(options) {
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
  ModalCanvasOptions.show(loadEditor, editorOptions)
})

window.addEventListener("resize", () => {
  canvas?.resize()
})

ModalCanvasOptions.initConfiguration(loadEditor, editorOptions)

window.editorOptions = editorOptions
window.loadEditor = loadEditor
