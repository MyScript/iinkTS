const editorElement = document.getElementById("editor");

const importBtn = document.getElementById("import");
const clearBtn = document.getElementById("clear");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

const penBtn = document.getElementById("pen");
const menuShapeBtn = document.getElementById("menu-shape-btn");
const drawRectangleBtn = document.getElementById("draw-rectangle");
const drawParallelogramBtn = document.getElementById("draw-parallelogram");
const drawCircleBtn = document.getElementById("draw-circle");
const drawEllipseBtn = document.getElementById("draw-ellipse");
const drawTriangleBtn = document.getElementById("draw-triangle");
const menuEdgeBtn = document.getElementById("menu-edge-btn");
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
const snapPointsVisibilityToggle = document.getElementById("toggle-snap-points-visibility");
const verticesVisibilityToggle = document.getElementById("toggle-vertices-visibility");
const boundingBoxVisibilityToggle = document.getElementById("toggle-bounding-box-visibility");

const snapToGridToggle = document.getElementById("snap-to-guides-toggle");
const snapToElementToggle = document.getElementById("snap-to-elements-toggle");
const snapAngleElementToggle = document.getElementById("snap-angle");

const selectionToggle = document.getElementById("toggle-selection-pan");
const htmlPanToggle = document.getElementById("toggle-export-html-pan");

const selectionPan = document.getElementById("selection-panel");
const selectionBody = document.getElementById("selection-body");

const exportHtmlPan = document.getElementById("export-html-pan");
const htmlPanCloseBtn = document.getElementById("html-pan-close-btn");
const exportHtmlBody = document.getElementById("export-html-body");

function resetMenuBtn() {
  Array.from(document.getElementsByClassName("menu-button"))
    .forEach(btn => {
      btn.classList.remove("active");
    });
};

function getStyle() {
  return {
    color: penColorInput.value,
    width: penWidthInput.value,
  };
};

function showModal(title, body) {
  modal.style.display = "block";
  modalTitle.innerText = title;
  while (modalBody.firstChild) {
    modalBody.firstChild.remove()
  }
  modalBody.appendChild(body);
};

function closeHtmlPanVisibilty() {
  exportHtmlPan.style.setProperty("display", "none");
};

function closeModal() {
  modal.style.display = "none";
};

function createStrokeInputColor(stroke) {
  const inputColor = document.createElement("input");
  inputColor.setAttribute("type", "color");
  inputColor.value = stroke.style.color;
  inputColor.classList.add("stroke-input")
  inputColor.addEventListener("change", (evt) => {
    editor.updateSymbolsStyle([stroke.id], { color: evt.target.value });
  })
  return inputColor
};

function createStrokeInputsWidth(stroke) {
  const minus = document.createElement("button");
  minus.classList.add("stroke-input");
  minus.textContent = "-";
  minus.addEventListener("pointerup", () => {
    stroke.style.width--;
    if (stroke.style.width <= 1) {
      minus.setAttribute('disabled', true);
    }
    else {
      minus.removeAttribute('disabled');
    }
    editor.updateSymbolsStyle([stroke.id], { width: stroke.style.width });
  })

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.classList.add("stroke-input");
  if (stroke.style.width <= 1) {
    minus.setAttribute('disabled', true);
  }
  plus.addEventListener("pointerup", () => {
    stroke.style.width++;
    if (stroke.style.width <= 1) {
      minus.setAttribute('disabled', true);
    }
    else {
      minus.removeAttribute('disabled');
    }
    editor.updateSymbolsStyle([stroke.id], { width: stroke.style.width });
  })
  return { minus, plus }
};

function createStrokeInputWrapper(stroke) {
  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("stroke-input-wrapper");
  inputWrapper.appendChild(createStrokeInputColor(stroke));
  const inputs = createStrokeInputsWidth(stroke);
  inputWrapper.appendChild(inputs.minus);
  inputWrapper.appendChild(inputs.plus);
  return inputWrapper
};

modalCloseBtn.addEventListener("pointerup", () => {
  closeModal();
});

htmlPanToggle.addEventListener("change", (event) => {
  exportHtmlPan.style.setProperty("display", event.target.checked ? "block" : "none");
});

htmlPanCloseBtn.addEventListener("pointerup", () => {
  htmlPanToggle.checked = false;
  closeHtmlPanVisibilty();
});

selectionToggle.addEventListener("change", (event) => {
  event.target.checked ? selectionPan.classList.add("open") : selectionPan.classList.remove("open");
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
              words: true
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
          type: "point"
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

  let exportTimeout;
  editor.events.addEventListener("changed", (event) => {
    clearBtn.disabled = !event.detail.canClear;
    undoBtn.disabled = !event.detail.canUndo;
    redoBtn.disabled = !event.detail.canRedo;
    clearTimeout(exportTimeout)
    exportTimeout = setTimeout(() => editor.export(["text/html"]), 1000);

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

  editor.events.addEventListener("intention", (event) => {
    resetMenuBtn();
    switch (event.detail) {
      case iink.Intention.Select:
        selectBtn.classList.add("active");
        break;
      case iink.Intention.Erase:
        eraserBtn.classList.add("active");
        break;
      case iink.Intention.Write:
        penBtn.classList.add("active");
        break;
    }
  });

  importBtn.addEventListener("pointerup", async () => {
    const strokeRes = await fetch("../assets/datas/hello-my-friend.json");
    // const strokeRes = await fetch("../assets/datas/hello-my-friend.json");
    const strokes = await strokeRes.json();
    await editor.importPointEvents(strokes);
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
    editor.behaviors.writer.tool = iink.WriteTool.Pencil;
    resetMenuBtn();
    penBtn.classList.add("active");
  });

  drawRectangleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Rectangle;
    resetMenuBtn();
    menuShapeBtn.classList.add("active");
    drawRectangleBtn.classList.add("active");
    document.getElementById("menu-shape-btn-img").src = drawRectangleBtn.children.item(0).src;
  });

  drawParallelogramBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Parallelogram;
    resetMenuBtn();
    menuShapeBtn.classList.add("active");
    drawParallelogramBtn.classList.add("active");
    document.getElementById("menu-shape-btn-img").src = drawRectangleBtn.children.item(0).src;
  });

  drawCircleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Circle;
    resetMenuBtn();
    menuShapeBtn.classList.add("active");
    drawCircleBtn.classList.add("active");
    document.getElementById("menu-shape-btn-img").src = drawCircleBtn.children.item(0).src;
  });

  drawEllipseBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Ellipse;
    resetMenuBtn();
    menuShapeBtn.classList.add("active");
    drawEllipseBtn.classList.add("active");
    document.getElementById("menu-shape-btn-img").src = drawEllipseBtn.children.item(0).src;
  });

  drawTriangleBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Triangle;
    resetMenuBtn();
    menuShapeBtn.classList.add("active");
    drawTriangleBtn.classList.add("active");
    document.getElementById("menu-shape-btn-img").src = drawTriangleBtn.children.item(0).src;
  });

  drawLineBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Line;
    resetMenuBtn();
    menuEdgeBtn.classList.add("active");
    drawLineBtn.classList.add("active");
    document.getElementById("menu-edge-btn-img").src = drawLineBtn.children.item(0).src;
  });

  drawArrowBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.Arrow;
    resetMenuBtn();
    menuEdgeBtn.classList.add("active");
    drawArrowBtn.classList.add("active");
    document.getElementById("menu-edge-btn-img").src = drawArrowBtn.children.item(0).src;
  });

  drawDoubleArrowBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Write;
    editor.behaviors.writer.tool = iink.WriteTool.DoubleArrow;
    resetMenuBtn();
    menuEdgeBtn.classList.add("active");
    drawDoubleArrowBtn.classList.add("active");
    document.getElementById("menu-edge-btn-img").src = drawDoubleArrowBtn.children.item(0).src;
  });

  eraserBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Erase;
    resetMenuBtn();
    eraserBtn.classList.add("active");
  });

  selectBtn.addEventListener("pointerup", () => {
    editor.intention = iink.Intention.Select;
    resetMenuBtn();
    selectBtn.classList.add("active");
  });

  showJIIXBtn.addEventListener("pointerup", async () => {
    const { exports } = await editor.export(["application/vnd.myscript.jiix"]);
    const jiix = exports["application/vnd.myscript.jiix"];
    const title = `Export application/vnd.myscript.jiix`;
    navigator.clipboard.writeText(JSON.stringify(jiix));
    showModal(title, renderjson(jiix));
  });

  showModelBtn.addEventListener("pointerup", () => {
    const title = "Model";
    showModal(title, renderjson(editor.model));
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
    editor.behaviors.writer.detectGesture = applyGestureCheckBox.checked;
  });

  surrondActionSelect.addEventListener("change", (evt) => {
    editor.behaviors.gesture.surroundAction = evt.target.value;
  });

  strikeThroughActionSelect.addEventListener("change", (evt) => {
    editor.behaviors.gesture.strikeThroughAction = evt.target.value;
  });

  guidesToggle.addEventListener("change", (event) => {
    guidesTypeSelect.disabled = !event.target.checked;
    guidesGapInput.disabled = !event.target.checked;
    options.configuration.rendering.guides.enable = event.target.checked;
    editor.behaviors.renderingConfiguration = options.configuration.rendering;
  });

  guidesTypeSelect.addEventListener("change", (event) => {
    options.configuration.rendering.guides.type = event.target.value;
    editor.behaviors.renderingConfiguration = options.configuration.rendering;
  });

  guidesGapInput.addEventListener("change", (event) => {
    options.configuration.rendering.guides.gap = Number(event.target.value);
    editor.behaviors.renderingConfiguration = options.configuration.rendering;
  });

  snapToGridToggle.addEventListener("change", (event) => {
    editor.behaviors.snaps.snapToGrid = event.target.checked;
  });

  snapToElementToggle.addEventListener("change", (event) => {
    editor.behaviors.snaps.snapToElement = event.target.checked;
  });

  snapAngleElementToggle.addEventListener("change", (event) => {
    editor.behaviors.snaps.snapAngle = +event.target.value;
  });

  recognitionBoxToggle.addEventListener("change", (evt) => {
    editor.behaviors.svgDebugger.recognitionBoxVisibility = evt.target.checked;
  });

  recognitionItemBoxToggle.addEventListener("change", (evt) => {
    editor.behaviors.svgDebugger.recognitionItemBoxVisibility = evt.target.checked;
  });

  verticesVisibilityToggle.addEventListener("change", (evt) => {
    editor.behaviors.svgDebugger.verticesVisibility = evt.target.checked;
  });

  snapPointsVisibilityToggle.addEventListener("change", (evt) => {
    editor.behaviors.svgDebugger.snapPointsVisibility = evt.target.checked;
  });

  boundingBoxVisibilityToggle.addEventListener("change", (evt) => {
    editor.behaviors.svgDebugger.boundingBoxVisibility = evt.target.checked;
  });

  window.addEventListener("resize", () => {
    editor.resize();
  });
}

loadEditor().catch(error => console.error(error));
