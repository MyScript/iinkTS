import * as iink from "../../dist/iink.esm.js"
import { ModalCanvasOptions } from "../components/modal/modalCanvasOptions.js"
const inkEditorDeprecatedConfiguration = iink.DefaultInkEditorDeprecatedConfiguration
const IISSREditorConfiguration = iink.DefaultInteractiveInkSSREditorConfiguration
const IIEditorConfiguration = iink.DefaultInteractiveInkEditorConfiguration
const inkEditorConfiguration = iink.DefaultInkEditorConfiguration

const configurationContent = document.getElementById("configuration-content")
const editorTypeSelect = document.getElementById("canvas-type")
const rootElement = document.getElementById("rootEl")
const resultElement = document.getElementById("result")
const exportBtn = document.getElementById("export-btn")
const validBtn = document.getElementById("valid-btn")
const resetBtn = document.getElementById("reset-btn")
const showModalBtn = document.getElementById("showModalBtn")
const inputMap = {
  "server.scheme": {
    type: "select",
    values: [
      {
        label: "https",
        value: "https",
      },
      {
        label: "http",
        value: "http",
      },
    ],
  },
  "recognition.type": {
    type: "select",
    values: ["TEXT", "MATH", "DIAGRAM", "Raw Content"].map((t) => ({
      value: t,
      label: t,
    })),
  },
  "recognition.lang": {
    type: "select",
    values: [],
  },
  "recognition.math.undo-redo.mode": {
    type: "select",
    values: [
      {
        label: "stroke",
        value: "stroke",
      },
      {
        label: "session",
        value: "session",
      },
    ],
  },
  "recognition.math.mimeTypes": {
    type: "select",
    multiple: true,
    values: ["application/vnd.myscript.jiix", "application/x-latex", "application/mathml+xml"].map((v) => ({
      label: v,
      value: v,
    })),
  },
  "recognition.math.solver.rounding-mode": {
    type: "select",
    values: [
      {
        label: "half up",
        value: "half up",
      },
      {
        label: "truncate",
        value: "truncate",
      },
    ],
  },
  "recognition.math.solver.angle-unit": {
    type: "select",
    values: [
      {
        label: "deg",
        value: "deg",
      },
      {
        label: "rad",
        value: "rad",
      },
    ],
  },
  "recognition.text.mimeTypes": {
    type: "select",
    multiple: true,
    values: ["application/vnd.myscript.jiix", "text/plain"].map((v) => ({
      label: v,
      value: v,
    })),
  },
  "recognition.diagram.convert.types": {
    type: "select",
    multiple: true,
    values: ["text", "shape"].map((v) => ({ label: v, value: v })),
  },
  "recognition.diagram.mimeTypes": {
    type: "select",
    multiple: true,
    values: [
      "application/vnd.myscript.jiix",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/svg+xml",
    ].map((v) => ({ label: v, value: v })),
  },
  "recognition.raw-content.recognition.types": {
    type: "select",
    multiple: true,
    values: ["text", "shape"].map((v) => ({ label: v, value: v })),
  },
  "recognition.raw-content.classification.types": {
    type: "select",
    multiple: true,
    values: ["text", "shape"].map((v) => ({ label: v, value: v })),
  },
  "triggers.exportContent": {
    type: "select",
    values: ["QUIET_PERIOD", "POINTER_UP", "DEMAND"].map((v) => ({
      label: v,
      value: v,
    })),
  },
}

Object.keys(iink.LoggerCategory).forEach((loggerKey) => {
  inputMap[`logger.${loggerKey}`] = {
    type: "select",
    values: Object.keys(iink.LoggerLevel).map((key) => ({
      label: key,
      value: iink.LoggerLevel[key],
    })),
  }
})

function setDeep(obj, path, value) {
  const pathItems = path.split(".")
  pathItems.reduce((a, b, level) => {
    if (typeof a[b] === "undefined" && level !== pathItems.length - 1) {
      a[b] = {}
      return a[b]
    }

    if (level === pathItems.length - 1) {
      a[b] = value
      return value
    }
    return a[b]
  }, obj)
}

/**
 *
 * @param {string} name
 * @param {string} type [text, number, checkbox]
 * @param {*} value
 */
function buildInput(path, name, type, value) {
  if (type === "checkbox") {
    const row = document.createElement("div")
    row.classList.add("config-row")

    const textLabel = document.createElement("label")
    textLabel.innerText = name

    const toggleLabel = document.createElement("label")
    toggleLabel.classList.add("toggle")

    const input = document.createElement("input")
    input.setAttribute("id", path)
    input.setAttribute("name", path)
    input.setAttribute("type", "checkbox")
    input.checked = value
    input.addEventListener("change", () => {
      setDeep(editorOptions.configuration, path, input.checked)
    })

    const slider = document.createElement("span")
    slider.classList.add("toggle-slider")

    toggleLabel.appendChild(input)
    toggleLabel.appendChild(slider)
    row.appendChild(textLabel)
    row.appendChild(toggleLabel)
    return row
  }

  const label = document.createElement("label")
  label.innerText = name

  const input = document.createElement("input")
  input.setAttribute("id", path)
  input.setAttribute("name", path)
  input.setAttribute("type", type)
  input.value = value
  input.addEventListener("change", () => {
    setDeep(editorOptions.configuration, path, input.value)
  })
  label.appendChild(input)
  return label
}

/**
 *
 * @param {string} name
 * @param {string[]} values
 * @param {Array} options [{ label, value }]
 */
function buildSelect(path, name, values, options, multiple = false) {
  const label = document.createElement("label")
  label.innerText = name

  const input = document.createElement("select")
  input.setAttribute("id", path)
  input.setAttribute("name", path)
  if (multiple) {
    input.setAttribute("multiple", multiple)
  }
  options.forEach(({ label, value }) => {
    const selected = values?.indexOf(value) > -1
    input.appendChild(new Option(label, value, selected, selected))
  })
  input.addEventListener("input", () => {
    setDeep(
      editorOptions.configuration,
      path,
      multiple ? Array.from(input.selectedOptions).map((o) => o.value) : input.value
    )
  })

  label.appendChild(input)
  return label
}

function loadEditorType() {
  ;["INTERACTIVE_INK", "INTERACTIVE_INK_SSR", "INK_V1", "INK_V2"].forEach((type) => {
    const selected = type === (canvas?.type || "INTERACTIVE_INK_SSR")
    editorTypeSelect.appendChild(new Option(type, type, selected, selected))
  })
  editorTypeSelect.addEventListener("input", () => {
    loadConfiguration()
  })
}

function renderPartialConfiguration(conf, currentPath = "") {
  const fragment = document.createDocumentFragment()
  Object.keys(conf).forEach((key) => {
    if (key === "server") return
    const value = conf[key]
    const localPath = currentPath ? `${currentPath}.${key}` : key
    const mapping = inputMap[localPath]
    if (mapping?.type) {
      switch (mapping.type) {
        case "select":
          fragment.appendChild(
            buildSelect(localPath, key, Array.isArray(value) ? value : [value], mapping.values, mapping.multiple)
          )
          break
        case "color":
          fragment.appendChild(buildInput(localPath, key, "color", value))
          break
        default:
          break
      }
    } else {
      switch (typeof value) {
        case "object":
          if (Array.isArray(value)) {
            fragment.appendChild(buildSelect(localPath, key, value, value))
          } else {
            fragment.appendChild(createCard(key, renderPartialConfiguration(value, localPath)))
          }
          break
        case "number":
          fragment.appendChild(buildInput(localPath, key, "number", value))
          break
        case "boolean":
          fragment.appendChild(buildInput(localPath, key, "checkbox", value))
          break
        default:
          fragment.appendChild(buildInput(localPath, key, "text", value))
          break
      }
    }
  })
  return fragment
}

function createCard(title, content) {
  const card = document.createElement("div")
  card.classList.add("config-section")

  const titleWrapper = document.createElement("div")
  titleWrapper.classList.add("config-section-header")
  titleWrapper.innerText = title

  const contentWrapper = document.createElement("div")
  contentWrapper.classList.add("config-section-body")
  contentWrapper.appendChild(content)

  card.appendChild(titleWrapper)
  card.appendChild(contentWrapper)
  titleWrapper.addEventListener("click", () => {
    contentWrapper.style.display = contentWrapper.style.display === "flex" ? "none" : "flex"
  })
  return card
}

function renderConfiguration(configuration) {
  while (configurationContent.firstChild) {
    configurationContent.firstChild.remove()
  }
  Object.keys(configuration)
    .filter((key) => key !== "server")
    .forEach((key) => {
      const conf = configuration[key]
      configurationContent.appendChild(createCard(key, renderPartialConfiguration(conf, key)))
    })
}

let canvas
let languageList

const editorOptions = {
  configuration: {},
}

function loadConfiguration() {
  switch (editorTypeSelect.value) {
    case "INTERACTIVE_INK_SSR":
      editorOptions.configuration = structuredClone(IISSREditorConfiguration)
      break
    case "INK_V1":
      editorOptions.configuration = structuredClone(inkEditorDeprecatedConfiguration)
      break
    case "INK_V2":
      editorOptions.configuration = structuredClone(inkEditorConfiguration)
      break
    case "INTERACTIVE_INK":
      editorOptions.configuration = structuredClone(IIEditorConfiguration)
      break
  }
  renderConfiguration(editorOptions.configuration)
}
async function loadEditor(options) {
  if (!languageList) {
    languageList = await iink.getAvailableLanguageList(editorOptions.configuration)
    Object.keys(languageList.result).forEach(function (key) {
      inputMap["recognition.lang"].values.push({
        label: languageList.result[key],
        value: key,
      })
    })
  }
  renderConfiguration(editorOptions.configuration)

  /**
   * get canvas instance from type
   * @param {Element} The DOM element to attach the ink paper
   * @param {Object} The Canvas parameters
   */
  canvas = await iink.Canvas.load(rootElement, editorTypeSelect.value, options)

  canvas.event.addEventListener("exported", (event) => {
    while (resultElement.firstChild) {
      resultElement.firstChild.remove()
    }
    // eslint-disable-next-line no-undef
    resultElement.appendChild(renderjson(event.detail))
  })

  canvas.event.addEventListener("changed", (event) => {
    exportBtn.disabled = !event.detail.canExport
  })
}

resetBtn.addEventListener("click", loadConfiguration)

exportBtn.addEventListener("click", () => {
  canvas.export()
})

validBtn.addEventListener("click", async () => {
  resultElement.innerHTML = ""
  ModalCanvasOptions.initConfiguration(loadEditor, editorOptions)
})

resultElement.addEventListener("click", () => {
  resultElement.classList.toggle("open")
})

showModalBtn.addEventListener("click", () => {
  ModalCanvasOptions.show(loadEditor, editorOptions)
})

loadEditorType()
loadConfiguration()
ModalCanvasOptions.initConfiguration(loadEditor, editorOptions)

/**
 * We expose these objects to the window use it in test
 */
window.editorOptions = editorOptions
window.loadEditor = loadEditor
