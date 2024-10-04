const editorElement = document.getElementById("editor");

const importBtn = document.getElementById("import");

const leftPanToggle = document.getElementById("toggle-left-pan");
const htmlPanToggle = document.getElementById("toggle-export-html-pan");

const exportHtmlPan = document.getElementById("export-html-pan");
const htmlPanCloseBtn = document.getElementById("html-pan-close-btn");
const exportHtmlBody = document.getElementById("export-html-body");

let currentTabId = "symbols-tab";
const copyTabToClipboard = document.getElementById("copy-content-tab");
const contentTab = document.getElementById("content-tab");

copyTabToClipboard.addEventListener("pointerdown", () => {
  try {
    navigator.clipboard.writeText(contentTab.getAttribute("data-string"));
  } catch (err) {
    console.error(err);
    alert("Copy to clipboard disabled");
  }
});

function setCurrentTab(tabId) {
  currentTabId = tabId;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  updateTabContent();
}
async function updateTabContent() {
  let content;
  let dataString = "";
  contentTab.innerHTML = '<div class="loader"></div>';
  copyTabToClipboard.disabled = true;

  switch (currentTabId) {
    case "jiix-tab":
      const { exports } = await editor.export(["application/vnd.myscript.jiix"]);
      const jiix = exports["application/vnd.myscript.jiix"];
      content = renderjson(jiix);
      dataString = JSON.stringify(jiix);
      break;
    case "symbols-tab":
      if (editor.model.symbols.length) {
        content = renderjson(editor.model.symbols);
        dataString = JSON.stringify(editor.model.symbols);
      } else {
        const mes = document.createElement("p");
        mes.textContent = "No symbols";
        dataString = "No symbols";
        content = mes;
      }
      break;
    case "history-tab":
      content = renderjson({
        context: editor.behaviors.history.context,
        stack: editor.behaviors.history.stack
      });
      dataString = JSON.stringify({
        context: editor.behaviors.history.context,
        stack: editor.behaviors.history.stack
      });
      break;
    case "selection-tab":
      if (editor.model.symbolsSelected.length) {
        const list = document.createElement("ul");
        editor.model.symbolsSelected.forEach((symbol) => {
          const listItem = document.createElement("li");
          const span = document.createElement("span");
          span.textContent = symbol.id;
          listItem.appendChild(span);
          listItem.appendChild(createStrokeInputWrapper(symbol));
          listItem.addEventListener("pointerover", () => {
            listItem.style.setProperty("background-color", "#1a9fff50");
            document.getElementById(symbol.id).style.setProperty("outline", "2px ridge #1a9fff");
          });
          listItem.addEventListener("pointerout", () => {
            listItem.style.removeProperty("background-color");
            document.getElementById(symbol.id).style.removeProperty("outline");
          });
          list.appendChild(listItem);
        });
        content = list;
        dataString = JSON.stringify(editor.model.symbolsSelected);
      } else {
        const mes = document.createElement("p");
        mes.textContent = "No symbols selected";
        dataString = "No symbols selected";
        content = mes;
      }
      break;
  }
  while (contentTab.firstChild) {
    contentTab.firstChild.remove();
  }
  contentTab.setAttribute("data-string", dataString);
  contentTab.appendChild(content);
  copyTabToClipboard.disabled = false;
}
document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("pointerup", (evt) => {
    setCurrentTab(evt.target.dataset.tabid);
  })
);

function closeHtmlPanVisibilty() {
  exportHtmlPan.style.setProperty("display", "none");
}

function createSymbolInputColor(symbol) {
  const inputColor = document.createElement("input");
  inputColor.setAttribute("type", "color");
  inputColor.value = symbol.style.color;
  inputColor.classList.add("symbol-input");
  inputColor.addEventListener("change", (evt) => {
    editor.behaviors.updateSymbolsStyle([symbol.id], { color: evt.target.value });
  });
  return inputColor;
}

function createSymbolInputWidth(symbol) {
  const minus = document.createElement("button");
  minus.classList.add("symbol-input");
  minus.textContent = "-";
  minus.addEventListener("pointerup", () => {
    symbol.style.width--;
    if (symbol.style.width <= 1) {
      minus.setAttribute("disabled", true);
    } else {
      minus.removeAttribute("disabled");
    }
    editor.behaviors.updateSymbolsStyle([symbol.id], { width: symbol.style.width });
  });

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.classList.add("symbol-input");
  if (symbol.style.width <= 1) {
    minus.setAttribute("disabled", true);
  }
  plus.addEventListener("pointerup", () => {
    symbol.style.width++;
    if (symbol.style.width <= 1) {
      minus.setAttribute("disabled", true);
    } else {
      minus.removeAttribute("disabled");
    }
    editor.behaviors.updateSymbolsStyle([symbol.id], { width: symbol.style.width });
  });
  return { minus, plus };
}

function createStrokeInputWrapper(symbol) {
  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("symbol-input-wrapper");
  inputWrapper.appendChild(createSymbolInputColor(symbol));
  const inputs = createSymbolInputWidth(symbol);
  inputWrapper.appendChild(inputs.minus);
  inputWrapper.appendChild(inputs.plus);
  return inputWrapper;
}

if (leftPanToggle.checked) {
  document.getElementById("left-pan").classList.add("open");
} else {
  document.getElementById("left-pan").classList.remove("open");
}
exportHtmlPan.style.setProperty("display", htmlPanToggle.checked ? "block" : "none");

leftPanToggle.addEventListener("change", () => {
  document.getElementById("left-pan").classList.toggle("open");
  editor?.resize();
});

exportHtmlBody.srcdoc = "";
htmlPanToggle.addEventListener("change", (event) => {
  exportHtmlPan.style.setProperty("display", event.target.checked ? "block" : "none");
});

htmlPanCloseBtn.addEventListener("pointerup", () => {
  htmlPanToggle.checked = false;
  closeHtmlPanVisibilty();
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
        minHeight: 2000,
        minWidth: 2000
      }
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
  setCurrentTab(currentTabId);

  const symbolsToCreateResponse = await fetch("../assets/datas/shakespeare-quotes.json");
  const symbolsToCreate = await symbolsToCreateResponse.json();

  let exportTimeout;
  editor.event.addEventListener("changed", (event) => {
    if (event.detail.empty) {
      importBtn.disabled = false;
    } else {
      importBtn.disabled = editor.model.symbols.some((s1) => symbolsToCreate.some((s2) => s2.id === s1.id));
    }
    updateTabContent();
    clearTimeout(exportTimeout);
    exportTimeout = setTimeout(async () => {
      await editor.export(["text/html"]);
    }, 1000);
  });

  editor.event.addEventListener("exported", (event) => {
    if (event.detail?.["text/html"]) {
      exportHtmlBody.srcdoc = event.detail["text/html"];
    }
  });

  editor.event.addEventListener("selected", (event) => {
    updateTabContent();
  });

  importBtn.addEventListener("pointerup", async () => {
    importBtn.disabled = true;
    await editor.behaviors.createSymbols(symbolsToCreate);
  });

  window.addEventListener("resize", () => {
    editor.resize();
  });
}

loadEditor().catch((error) => console.error(error));
