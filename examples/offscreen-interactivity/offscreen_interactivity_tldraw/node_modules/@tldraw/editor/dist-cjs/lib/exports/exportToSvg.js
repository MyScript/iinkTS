"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var exportToSvg_exports = {};
__export(exportToSvg_exports, {
  exportToSvg: () => exportToSvg
});
module.exports = __toCommonJS(exportToSvg_exports);
var import_utils = require("@tldraw/utils");
var import_react_dom = require("react-dom");
var import_client = require("react-dom/client");
var import_FontEmbedder = require("./FontEmbedder");
var import_StyleEmbedder = require("./StyleEmbedder");
var import_embedMedia = require("./embedMedia");
var import_getSvgJsx = require("./getSvgJsx");
let idCounter = 1;
async function exportToSvg(editor, shapeIds, opts = {}) {
  const result = (0, import_getSvgJsx.getSvgJsx)(editor, shapeIds, opts);
  if (!result) return void 0;
  const container = editor.getContainer();
  const renderTarget = document.createElement("div");
  renderTarget.className = import_FontEmbedder.SVG_EXPORT_CLASSNAME;
  renderTarget.inert = true;
  renderTarget.tabIndex = -1;
  Object.assign(renderTarget.style, {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: result.width + "px",
    height: result.height + "px",
    pointerEvents: "none",
    opacity: 0
  });
  container.appendChild(renderTarget);
  const root = (0, import_client.createRoot)(renderTarget, { identifierPrefix: `export_${idCounter++}_` });
  try {
    await Promise.resolve();
    (0, import_react_dom.flushSync)(() => {
      root.render(result.jsx);
    });
    await result.exportDelay.resolve();
    const svg = renderTarget.firstElementChild;
    (0, import_utils.assert)(svg instanceof SVGSVGElement, "Expected an SVG element");
    await applyChangesToForeignObjects(svg);
    return { svg, width: result.width, height: result.height };
  } finally {
    setTimeout(() => {
      root.unmount();
      container.removeChild(renderTarget);
    }, 0);
  }
}
async function applyChangesToForeignObjects(svg) {
  const foreignObjectChildren = [
    ...svg.querySelectorAll("foreignObject.tl-export-embed-styles > *")
  ];
  if (!foreignObjectChildren.length) return;
  const styleEmbedder = new import_StyleEmbedder.StyleEmbedder(svg);
  try {
    styleEmbedder.fonts.startFindingCurrentDocumentFontFaces();
    await Promise.all(foreignObjectChildren.map((el) => (0, import_embedMedia.embedMedia)(el)));
    for (const el of foreignObjectChildren) {
      styleEmbedder.readRootElementStyles(el);
    }
    await styleEmbedder.fetchResources();
    const fontCss = await styleEmbedder.getFontFaceCss();
    styleEmbedder.unwrapCustomElements();
    const pseudoCss = styleEmbedder.embedStyles();
    if (fontCss || pseudoCss) {
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `${fontCss}
${pseudoCss}`;
      svg.prepend(style);
    }
  } finally {
    styleEmbedder.dispose();
  }
}
//# sourceMappingURL=exportToSvg.js.map
