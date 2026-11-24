import { Canvas } from "../../dist/iink.esm.js"
import { ModalCanvasOptions } from "../components/modal/modalCanvasOptions.js"
let currentInput
let canvas

const inputsColumns = document.getElementById("inputs-colum")
const validateResponsesBtn = document.getElementById("validate-answers")
const answersColumns = document.getElementById("answers-colum")
const rootElement = document.getElementById("rootEl")
const showModalBtn = document.getElementById("showModalBtn")

function getWrittenStrokes() {
  return canvas.layers.root.querySelector("[data-layer=MODEL]").cloneNode(true)
}

function getResultElementFromInput(input) {
  const answerId = input.getAttribute("answer-id")
  if (answerId) {
    return document.getElementById(answerId)
  }
}

validateResponsesBtn.addEventListener("pointerup", () => {
  for (let i = 0; i < answers.length; i++) {
    const el = document.getElementById(`answer-${i}`)
    const textAnswered = el.textContent
      .replace(/[\r\n]+/gm, " ")
      .replace("  ", " ")
      .toLocaleLowerCase()
    if (answers[i].toLocaleLowerCase() === textAnswered) {
      el.classList.add("success")
      el.classList.remove("error")
    } else {
      el.classList.add("error")
      el.classList.remove("success")
    }
  }
})

async function switchInput(input) {
  await canvas.waitForIdle()
  const strokesWritten = getWrittenStrokes()
  if (currentInput.contains(rootElement)) {
    currentInput.replaceChild(strokesWritten, rootElement)
  }
  currentInput.setAttribute("pointers", JSON.stringify(canvas.model.symbols))

  currentInput = input

  const textAnswered = getResultElementFromInput(currentInput)?.textContent
  // can't wait clear
  // because clear empty model does not trigger event from backend
  canvas.clear()
  await canvas.waitForIdle()
  if (textAnswered) {
    const pointers = currentInput.getAttribute("pointers")
    if (pointers) {
      await canvas.importPointEvents(JSON.parse(pointers))
    }
  }
  currentInput.textContent = ""
  currentInput.appendChild(rootElement)
}

const questions = [
  "What does CPU mean?",
  "In what year did the first programmable electronic computer “the Colossus” appear?",
  "What does URL mean?",
  'in what year was the first web browser named "Mosaic" developed?',
]
const answers = ["Central Processing Unit", "1943", "Uniform Resource Locator", "1993"]

for (let i = 0; i < questions.length; i++) {
  const inputEl = document.createElement("div")
  inputEl.id = `input-${i}`
  inputEl.setAttribute("answer-id", `answer-${i}`)
  inputEl.classList.add("input")
  const inputLabelEL = document.createElement("label")
  inputLabelEL.setAttribute("for", inputEl.id)
  inputLabelEL.innerText = questions[i]
  inputsColumns.appendChild(inputLabelEL)
  inputsColumns.appendChild(inputEl)

  const answerEl = document.createElement("div")
  answerEl.id = `answer-${i}`
  answerEl.classList.add("answer")
  const answerLabelEL = document.createElement("label")
  answerLabelEL.setAttribute("for", answerEl.id)
  answerLabelEL.innerText = `Answer ${i + 1} :`
  answersColumns.insertBefore(answerLabelEL, validateResponsesBtn)
  answersColumns.insertBefore(answerEl, validateResponsesBtn)

  inputEl.addEventListener("pointerdown", async (evt) => {
    evt.preventDefault()
    if (!inputEl.contains(canvas.layers.root)) {
      switchInput(inputEl)
    }
  })
}

const canvasOptions = {
  configuration: {
    recognition: {
      type: "TEXT",
      text: {
        guides: {
          enable: false,
        },
        mimeTypes: ["text/plain"],
        margin: {
          left: 10,
          right: 10,
          top: 5,
        },
      },
    },
    smartGuide: {
      enable: false,
    },
  },
}

async function loadCanvas(options) {
  currentInput = document.getElementById("input-0")
  currentInput.appendChild(rootElement)

  /**
   * get canvas instance from type
   * @param {Element} The DOM element to attach the ink paper
   * @param {Object} The Canvas parameters
   */
  canvas = await Canvas.load(rootElement, "INTERACTIVE_INK_SSR", options)

  canvas.event.addEventListener("exported", (evt) => {
    const answerId = currentInput?.getAttribute("answer-id")
    if (answerId) {
      const answerEl = document.getElementById(answerId)
      answerEl.textContent = evt.detail["text/plain"]
    }
  })
}

showModalBtn.addEventListener("click", () => {
  ModalCanvasOptions.show(loadCanvas, canvasOptions)
})

ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions)

/**
 * We expose these objects to the window use it in test
 */
window.canvasOptions = canvasOptions
window.loadCanvas = loadCanvas
