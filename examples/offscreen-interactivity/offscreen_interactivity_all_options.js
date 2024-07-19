const editorElement = document.getElementById("editor");

const importBtn = document.getElementById("import");
const showImportBtn = document.getElementById("show-import");

const showJIIXBtn = document.getElementById("show-jiix");
const showModelBtn = document.getElementById("show-model");
const showHistorylBtn = document.getElementById("show-history");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalCloseBtn = document.getElementById("modal-close-btn");

const menuActionToggle = document.getElementById("menu-action-toggle");
const menuStyleToggle = document.getElementById("menu-style-toggle");
const menuIntentionToggle = document.getElementById("menu-intention-toggle");

const recognitionBoxToggle = document.getElementById("toggle-recognition-box");
const recognitionItemBoxToggle = document.getElementById("toggle-recognition-item-box");
const snapPointsVisibilityToggle = document.getElementById("toggle-snap-points-visibility");
const verticesVisibilityToggle = document.getElementById("toggle-vertices-visibility");
const boundingBoxVisibilityToggle = document.getElementById("toggle-bounding-box-visibility");

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
    editor.behaviors.updateSymbolsStyle([stroke.id], { color: evt.target.value });
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
    editor.behaviors.updateSymbolsStyle([stroke.id], { width: stroke.style.width });
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
    editor.behaviors.updateSymbolsStyle([stroke.id], { width: stroke.style.width });
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
      rendering: {
        minHeight: 4000,
        minWidth: 4000,
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

  const symbolsToCreateResponse = await fetch("../assets/datas/shakespeare-quotes.json");
  const symbolsToCreate = await symbolsToCreateResponse.json();

  let exportTimeout;
  editor.events.addEventListener("changed", (event) => {
    if (event.detail.empty) {
      importBtn.disabled = false;
    }
    else {
      importBtn.disabled = editor.model.symbols.some(s1 => symbolsToCreate.some(s2 => s2.id === s1.id))
    }
    clearTimeout(exportTimeout)
    exportTimeout = setTimeout(async () => {
      await editor.export(["text/html"])
    }, 1000);
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

  importBtn.addEventListener("pointerup", async () => {
    importBtn.disabled = true;
    await editor.behaviors.createSymbols(symbolsToCreate);
  });

  showImportBtn.addEventListener("pointerup", async () => {
    const title = `Pointers to import`;
    showModal(title, renderjson(symbolsToCreate));
  });

  showJIIXBtn.addEventListener("pointerup", async () => {
    const { exports } = await editor.export(["application/vnd.myscript.jiix"]);
    const jiix = exports["application/vnd.myscript.jiix"];
    const title = `Export application/vnd.myscript.jiix`;
    showModal(title, renderjson(jiix));
    try {
      navigator.clipboard.writeText(JSON.stringify(jiix));
    }
    catch(err) {
      console.error(err);
    }
  });

  showModelBtn.addEventListener("pointerup", () => {
    const title = "Model";
    showModal(title, renderjson(editor.model));
  });

  showHistorylBtn.addEventListener("pointerup", () => {
    const title = "History";
    showModal(title, renderjson(editor.behaviors.history.stack));
  });

  menuActionToggle.addEventListener("change", (event) => {
    event.target.checked ? editor.behaviors.menu.action.show() : editor.behaviors.menu.action.hide();
  });

  menuStyleToggle.addEventListener("change", (event) => {
    event.target.checked ? editor.behaviors.menu.style.show() : editor.behaviors.menu.style.hide();
  });

  menuIntentionToggle.addEventListener("change", (event) => {
    event.target.checked ? editor.behaviors.menu.intention.show() : editor.behaviors.menu.intention.hide();
  });

  window.addEventListener("resize", () => {
    editor.resize();
  });
}

loadEditor().catch(error => console.error(error));
