let currentInput;
let editor

const inputsColumns = document.getElementById("inputs-colum");
const validateResponsesBtn = document.getElementById("validate-answers");
const answersColumns = document.getElementById("answers-colum");
const editorElement = document.getElementById("editor");

function getWrittenStrokes() {
  return editor.wrapperHTML.querySelector("[data-layer=MODEL]").cloneNode(true)
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
    const textAnswered = el.textContent.replace(/[\r\n]+/gm, " ").replace("  ", " ").toLocaleLowerCase()
    if (answers[i].toLocaleLowerCase() === textAnswered) {
      el.classList.add("success")
      el.classList.remove("error")
    }
    else {
      el.classList.add("error")
      el.classList.remove("success")
    }
  }
})

async function switchEditorInput(input) {
  await editor.waitForIdle()
  const strokesWritten = getWrittenStrokes()
  if (currentInput.contains(editorElement)) {
    currentInput.replaceChild(strokesWritten, editorElement)
  }
  currentInput.setAttribute("pointers", JSON.stringify(editor.model.symbols))

  currentInput = input

  const textAnswered = getResultElementFromInput(currentInput)?.textContent
  editor.clear()
  await editor.waitForIdle()
  if (textAnswered) {
    const pointers = currentInput.getAttribute("pointers")
    if (pointers) {
      await editor.importPointEvents(JSON.parse(pointers));
    }
  }
  currentInput.textContent = ""
  currentInput.appendChild(editorElement)
}

const questions = [
  "What does CPU mean?",
  "In what year did the first programmable electronic computer “the Colossus” appear?",
  "What does URL mean?",
  "in what year was the first web browser named \"Mosaic\" developed?"
]
const answers = [
  "Central Processing Unit",
  "1943",
  "Uniform Resource Locator",
  "1993"
]

for (let i = 0; i < questions.length; i++) {
  const inputEl = document.createElement("div");
  inputEl.id = `input-${i}`;
  inputEl.setAttribute("answer-id", `answer-${i}`)
  inputEl.classList.add("input");
  const inputLabelEL = document.createElement("label");
  inputLabelEL.setAttribute("for", inputEl.id);
  inputLabelEL.innerText = questions[i];
  inputsColumns.appendChild(inputLabelEL);
  inputsColumns.appendChild(inputEl);

  const answerEl = document.createElement("div");
  answerEl.id = `answer-${i}`;
  answerEl.classList.add("answer");
  const answerLabelEL = document.createElement("label");
  answerLabelEL.setAttribute("for", answerEl.id);
  answerLabelEL.innerText = `Answer ${i + 1} :`;
  answersColumns.insertBefore(answerLabelEL, validateResponsesBtn);
  answersColumns.insertBefore(answerEl, validateResponsesBtn);

  inputEl.addEventListener("pointerdown", async (evt) => {
    evt.preventDefault()
    if (!inputEl.contains(editor.wrapperHTML)) {
      switchEditorInput(inputEl)
    }
  })
}

initEditor()

async function initEditor() {
  currentInput = document.getElementById("input-0")
  currentInput.appendChild(editorElement)

  const res = await fetch("../server-configuration.json");
  const conf = await res.json();
  const options = {
    configuration: {
      server: {
        ...conf,
        protocol: "WEBSOCKET"
      },
      recognition: {
        type: "TEXT",
        text: {
          guides: {
            enable: false
          },
          mimeTypes: ["text/plain"],
          margin: {
            left: 10,
            right: 10,
            top: 5
          }
        },
      },
      rendering: {
        smartGuide: {
            enable: false
        }
      }
    }
  };

  editor = new iink.Editor(editorElement, options);
  await editor.initialize();
  editor.events.addEventListener("exported", (evt) => {
    const answerId = currentInput?.getAttribute("answer-id")
    if (answerId) {
      const answerEl = document.getElementById(answerId)
      answerEl.textContent = evt.detail["text/plain"]
    }
  })
}

window.addEventListener("resize", () => {
  editor.resize();
});
