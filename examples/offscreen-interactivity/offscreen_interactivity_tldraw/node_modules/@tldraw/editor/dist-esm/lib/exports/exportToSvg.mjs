import { assert } from "@tldraw/utils";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { SVG_EXPORT_CLASSNAME } from "./FontEmbedder.mjs";
import { StyleEmbedder } from "./StyleEmbedder.mjs";
import { embedMedia } from "./embedMedia.mjs";
import { getSvgJsx } from "./getSvgJsx.mjs";
let idCounter = 1;
async function exportToSvg(editor, shapeIds, opts = {}) {
  const result = getSvgJsx(editor, shapeIds, opts);
  if (!result) return void 0;
  const container = editor.getContainer();
  const renderTarget = document.createElement("div");
  renderTarget.className = SVG_EXPORT_CLASSNAME;
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
  const root = createRoot(renderTarget, { identifierPrefix: `export_${idCounter++}_` });
  try {
    await Promise.resolve();
    flushSync(() => {
      root.render(result.jsx);
    });
    await result.exportDelay.resolve();
    const svg = renderTarget.firstElementChild;
    assert(svg instanceof SVGSVGElement, "Expected an SVG element");
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
  const styleEmbedder = new StyleEmbedder(svg);
  try {
    styleEmbedder.fonts.startFindingCurrentDocumentFontFaces();
    await Promise.all(foreignObjectChildren.map((el) => embedMedia(el)));
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
export {
  exportToSvg
};
//# sourceMappingURL=exportToSvg.mjs.map
