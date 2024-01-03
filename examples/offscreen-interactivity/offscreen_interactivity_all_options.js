const editorElement = document.getElementById("editor");

const clearBtn = document.getElementById("clear");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

const penBtn = document.getElementById("pen");
const shapeMenuBtn = document.getElementById("shape-menu");
const drawRectangleBtn = document.getElementById("draw-rectangle");
const drawCircleBtn = document.getElementById("draw-circle");
const drawTriangleBtn = document.getElementById("draw-triangle");
const lineMenuBtn = document.getElementById("line-menu");
const drawLineBtn = document.getElementById("draw-line");
const drawArrowBtn = document.getElementById("draw-arrow");
const drawDoubleArrowBtn = document.getElementById("draw-double-arrow");
const eraserBtn = document.getElementById("eraser");
const selectBtn = document.getElementById("select");

const convertBtn = document.getElementById("convert");
const showJIIXBtn = document.getElementById("show-jiix");
const showModelBtn = document.getElementById("show-model");

const penColorInput = document.getElementById("pen-color");
const fillColorInput = document.getElementById("fill-color");
const penWidthInput = document.getElementById("pen-width");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalCloseBtn = document.getElementById("modal-close-btn");

const applyGestureCheckBox = document.getElementById("apply-gesture");
const surrondActionSelect = document.getElementById("surround-action");
const strikeThroughActionSelect = document.getElementById("strike-through-action");

const guidesToggle = document.getElementById("guides-enable");
const guidesTypeSelect = document.getElementById("guides-type");
const guidesGapInput = document.getElementById("guides-gap");

const recognitionBoxToggle = document.getElementById("toggle-recognition-box");
const recognitionItemBoxToggle = document.getElementById("toggle-recognition-item-box");
const pointsVisibilityToggle = document.getElementById("toggle-points-visibility");

const alignmentGuidesToggle = document.getElementById("alignment-guides-toggle");
const alignmentElementsToggle = document.getElementById("alignment-elements-toggle");

const selectionToggle = document.getElementById("toggle-selection-pan");
const htmlPanToggle = document.getElementById("toggle-export-html-pan");

const selectionPan = document.getElementById("selection-panel");
const selectionBody = document.getElementById("selection-body");

const exportHtmlPan = document.getElementById("export-html-pan");
const htmlPanCloseBtn = document.getElementById("html-pan-close-btn");
const exportHtmlBody = document.getElementById("export-html-body");

function getStyle() {
  return {
    color: penColorInput.value,
    width: penWidthInput.value,
  };
}

function showModal(title, body) {
  modal.style.display = "block";
  modalTitle.innerText = title;
  modalBody.innerHTML = body.outerHTML;
}

function toggleHtmlPanVisibilty() {
  const isVisible = exportHtmlPan.style.getPropertyValue("display") === "block"
  exportHtmlPan.style.setProperty("display", isVisible ? "none" : "block")
}

function closeHtmlPanVisibilty() {
  exportHtmlPan.style.setProperty("display", "none")
}

function closeModal() {
  modal.style.display = "none";
}

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

function createElementsFromObjet(data, wrapper) {
  Object.keys(data).forEach((key) => {
    const localData = data[key];
    if (key === "exports") {
      return;
    } else if (["X", "Y", "F", "T"].includes(key)) {
      const node = document.createElement("li");
      node.style = "white-space: nowrap;"
      wrapper.appendChild(node);
      node.textContent = key + `: [${localData.join(", ")}]`;
    } else if (["pointers", "transform", "style"].includes(key)) {
      const node = document.createElement("li");
      node.style = "white-space: nowrap;"
      wrapper.appendChild(node);
      node.textContent = key + `: [${JSON.stringify(localData)}]`;
    } else if (["decorators", "parents"].includes(key)) {
      const node = document.createElement("li");
      node.style = "white-space: nowrap;"
      wrapper.appendChild(node);
      node.textContent = key + `: [${localData.map(d => d.id).join(",")}]`;
    } else if (Array.isArray(localData)) {
      const node = document.createElement("li");
      wrapper.appendChild(node);
      if (!isNumeric(key)) node.textContent = key;
      else node.textContent = `${wrapper.previousSibling.textContent}-${key}`;
      const subNode = document.createElement("ul");
      node.appendChild(subNode);
      createElementsFromObjet(localData, subNode);
    } else if (typeof localData === "object") {
      const node = document.createElement("li");
      wrapper.appendChild(node);
      if (!isNumeric(key)) node.textContent = key;
      else node.textContent = `${wrapper.previousSibling.textContent}-${key}`;
      const subNode = document.createElement("ul");
      node.appendChild(subNode);
      createElementsFromObjet(localData, subNode);
    } else {
      const node = document.createElement("li");
      wrapper.appendChild(node);

      if (!isNumeric(key)) node.textContent = `${key}: ${localData}`;
      else node.textContent = localData;
    }
  });
}

function createStrokeInputColor(stroke) {
  const inputColor = document.createElement("input");
  inputColor.setAttribute("type", "color");
  inputColor.value = stroke.style.color;
  inputColor.classList.add("stroke-input")
  inputColor.addEventListener("change", (evt) => {
    editor.updateSymbolsStyle([stroke.id], { color: evt.target.value })
  })
  return inputColor
}

function createStrokeInputsWidth(stroke) {
  const minus = document.createElement("button");
  minus.classList.add("stroke-input")
  minus.textContent = "-"
  minus.addEventListener("pointerup", () => {
    stroke.style.width--
    if (stroke.style.width <= 1) {
      minus.setAttribute('disabled', true)
    }
    else {
      minus.removeAttribute('disabled')
    }
    editor.updateSymbolsStyle([stroke.id], { width: stroke.style.width})
  })

  const plus = document.createElement("button");
  plus.textContent = "+"
  plus.classList.add("stroke-input")
  if (stroke.style.width <= 1) {
    minus.setAttribute('disabled', true)
  }
  plus.addEventListener("pointerup", () => {
    stroke.style.width++
    if (stroke.style.width <= 1) {
      minus.setAttribute('disabled', true)
    }
    else {
      minus.removeAttribute('disabled')
    }
    editor.updateSymbolsStyle([stroke.id], { width: stroke.style.width})
  })
  return { minus, plus }
}

function createStrokeInputWrapper(stroke) {
  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("stroke-input-wrapper")

  inputWrapper.appendChild(createStrokeInputColor(stroke))
  const inputs = createStrokeInputsWidth(stroke)
  inputWrapper.appendChild(inputs.minus)
  inputWrapper.appendChild(inputs.plus)

  return inputWrapper
}

modalCloseBtn.addEventListener("pointerup", () => {
  closeModal();
});

htmlPanToggle.addEventListener("change", () => {
  toggleHtmlPanVisibilty();
});

htmlPanCloseBtn.addEventListener("pointerup", () => {
  htmlPanToggle.checked = false;
  closeHtmlPanVisibilty();
});

selectionToggle.addEventListener("change", () => {
  selectionPan.classList.toggle("open");
});

/**
 * we expose the editor for use in the integration test
 */
let editor;

async function loadEditor() {
  const res = await fetch("../server-configuration.json");
  const server = await res.json();
  const options = {
    configuration: {
      offscreen: true,
      server,
      recognition: {
        export: {
          jiix: {
            // required to draw elements box & convert
            "bounding-box": true,
            // required to convert
            ids: true,
            // required to convert
            "full-stroke-ids": true,
            // required to convert text
            text: {
              chars: true,
              words: false
            },
          }
        }
      },
      rendering: {
        minHeight: 4000,
        minWidth: 4000,
        guides: {
          enable: true,
          gap: 100,
          type: "grid"
        }
      },
    }
  };
  /**
   * Instanciate editor
   * @param {Element} The DOM element to attach the ink paper
   * @param {Object} The Editor parameters
   */
  editor = new iink.Editor(editorElement, options);
  /**
   *  async initialize editor behaviors
   */
  await editor.initialize();

  editor.events.addEventListener("changed", (event) => {
    clearBtn.disabled = !event.detail.canClear;
    undoBtn.disabled = !event.detail.canUndo;
    redoBtn.disabled = !event.detail.canRedo;
    editor.export(["text/html"]);
  });

  editor.events.addEventListener("exported", (event) => {
    if (event.detail?.["text/html"]) {
      exportHtmlBody.srcdoc = event.detail["text/html"];
    }
  });

  editor.events.addEventListener("selected", (event) => {
    selectionBody.innerHTML = "";
    const list = document.createElement("ul");
    if (event.detail) {
      event.detail.forEach((stroke) => {
        const listItem = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = stroke.id;
        listItem.appendChild(span);
        listItem.appendChild(createStrokeInputWrapper(stroke));
        list.appendChild(listItem);
      });
      selectionBody.appendChild(list);
    }
  });

  clearBtn.addEventListener("pointerup", async () => {
    editor.clear();
  });

  undoBtn.addEventListener("pointerup", () => {
    editor.undo();
  });

  redoBtn.addEventListener("pointerup", () => {
    editor.redo();
  });

  penBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Pencil;
    penBtn.classList.add("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
  });

  drawRectangleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Rectangle;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.add("active");
    drawRectangleBtn.classList.add("active");
    drawCircleBtn.classList.remove("active");
    drawTriangleBtn.classList.remove("active");
    lineMenuBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("shape-menu-img").src = drawRectangleBtn.children.item(0).src;
  });

  drawCircleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Circle;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.add("active");
    lineMenuBtn.classList.remove("active");
    drawRectangleBtn.classList.remove("active");
    drawCircleBtn.classList.add("active");
    drawTriangleBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("shape-menu-img").src = drawCircleBtn.children.item(0).src;
  });

  drawTriangleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Triangle;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.add("active");
    drawRectangleBtn.classList.remove("active");
    drawCircleBtn.classList.remove("active");
    drawTriangleBtn.classList.add("active");
    lineMenuBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("shape-menu-img").src = drawTriangleBtn.children.item(0).src;
  });

  drawLineBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Line;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.add("active");
    drawLineBtn.classList.add("active");
    drawArrowBtn.classList.remove("active");
    drawDoubleArrowBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("line-menu-img").src = drawLineBtn.children.item(0).src;
  });

  drawArrowBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.Arrow;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.add("active");
    drawLineBtn.classList.remove("active");
    drawArrowBtn.classList.add("active");
    drawDoubleArrowBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("line-menu-img").src = drawArrowBtn.children.item(0).src;
  });

  drawDoubleArrowBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.writeTool = iink.WriteTool.DoubleArrow;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.add("active");
    drawLineBtn.classList.remove("active");
    drawArrowBtn.classList.remove("active");
    drawDoubleArrowBtn.classList.add("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.remove("active");
    document.getElementById("line-menu-img").src = drawDoubleArrowBtn.children.item(0).src;
  });

  eraserBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Erase;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.remove("active");
    eraserBtn.classList.add("active");
    selectBtn.classList.remove("active");
  });

  selectBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Select;
    penBtn.classList.remove("active");
    shapeMenuBtn.classList.remove("active");
    lineMenuBtn.classList.remove("active");
    eraserBtn.classList.remove("active");
    selectBtn.classList.add("active");
  });

  showJIIXBtn.addEventListener("pointerup", async () => {
    const { exports } = await editor.export(["application/vnd.myscript.jiix"]);
    const jiix = exports["application/vnd.myscript.jiix"];

    const title = `Export application/vnd.myscript.jiix`;
    const body = document.createElement("div");

    const textEl = document.createElement("div");
    textEl.classList.add("jiix-text");
    textEl.textContent = jiix.elements.map((e) => e.label).join(" ");
    body.appendChild(textEl);

    let list = document.createElement("ul");
    createElementsFromObjet(jiix, list);
    body.appendChild(list);
    navigator.clipboard.writeText(JSON.stringify(jiix));
    showModal(title, body);
  });

  showModelBtn.addEventListener("pointerup", () => {
    const title = "Models";
    const body = document.createElement("div");
    let list = document.createElement("ul");
    createElementsFromObjet(editor.model, list);
    body.appendChild(list);
    showModal(title, body);
  });

  convertBtn.addEventListener("pointerup", () => {
    editor.convert();
  });

  penColorInput.addEventListener("change", () => {
    editor.penStyle = getStyle();
  });

  penWidthInput.addEventListener("change", () => {
    editor.penStyle = getStyle();
  });

  applyGestureCheckBox.addEventListener("change", (e) => {
    surrondActionSelect.disabled = !applyGestureCheckBox.checked;
    strikeThroughActionSelect.disabled = !applyGestureCheckBox.checked;
    editor.gestures = !applyGestureCheckBox.checked;
  });

  surrondActionSelect.addEventListener("change", (evt) => {
    editor.surroundAction = evt.target.value;
  });

  strikeThroughActionSelect.addEventListener("change", (evt) => {
    editor.strikeThroughAction = evt.target.value;
  });

  guidesToggle.addEventListener("change", (event) => {
    guidesTypeSelect.disabled = !event.target.checked;
    guidesGapInput.disabled = !event.target.checked;
    options.configuration.rendering.guides.enable = event.target.checked;
    editor.renderingConfiguration = options.configuration.rendering;
  });

  guidesTypeSelect.addEventListener("change", (event) => {
    options.configuration.rendering.guides.type = event.target.value;
    editor.renderingConfiguration = options.configuration.rendering;
  });

  guidesGapInput.addEventListener("change", (event) => {
    options.configuration.rendering.guides.gap = Number(event.target.value);
    editor.renderingConfiguration = options.configuration.rendering;
  });

  alignmentGuidesToggle.addEventListener("change", (event) => {
    editor.alignGuides = event.target.checked;
  });

  alignmentElementsToggle.addEventListener("change", (event) => {
    editor.alignElements = event.target.checked;
  });

  recognitionBoxToggle.addEventListener("change", (evt) => {
    if (evt.target.checked) {
      editor.drawRecognitionBox();
    } else {
      editor.clearRecognitionBox();
    }
  });

  recognitionItemBoxToggle.addEventListener("change", (evt) => {
    if (evt.target.checked) {
      editor.drawRecognitionBoxItem();
    } else {
      editor.clearRecognitionBoxItem();
    }
  });

  pointsVisibilityToggle.addEventListener("change", (evt) => {
    editor.behaviors.verticesVisibility = evt.target.checked;
  });

  window.addEventListener("resize", () => {
    editor.resize();
  });
}

loadEditor().catch(error => console.error(error));
