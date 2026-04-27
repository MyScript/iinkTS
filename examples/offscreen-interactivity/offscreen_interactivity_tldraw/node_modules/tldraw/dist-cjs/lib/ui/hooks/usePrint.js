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
var usePrint_exports = {};
__export(usePrint_exports, {
  usePrint: () => usePrint
});
module.exports = __toCommonJS(usePrint_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
function usePrint() {
  const editor = (0, import_editor.useMaybeEditor)();
  const prevPrintEl = (0, import_react.useRef)(null);
  const prevStyleEl = (0, import_react.useRef)(null);
  return (0, import_react.useCallback)(
    async function printSelectionOrPages() {
      (0, import_editor.assert)(editor, "usePrint: editor is required");
      const el = document.createElement("div");
      const style = document.createElement("style");
      const clearElements = (printEl, styleEl) => {
        if (printEl) printEl.innerHTML = "";
        if (styleEl && document.head.contains(styleEl)) document.head.removeChild(styleEl);
        if (printEl && document.body.contains(printEl)) {
          document.body.removeChild(printEl);
        }
      };
      clearElements(prevPrintEl.current, prevStyleEl.current);
      prevPrintEl.current = el;
      prevStyleEl.current = style;
      const className = `tl-print-surface-${(0, import_editor.uniqueId)()}`;
      el.className = className;
      const enableMargins = false;
      const allowAllPages = false;
      style.innerHTML = `
			.${className} {
				display: none;
			}

			.${className} svg {
				max-width: 100%;
				height: 100%;
				display: block;
			}

			@media print {				  
				html, body {
					min-height: 100%;
					height: 100%;
					margin: 0;
				}

				body {
					position: relative;
				}

				body > * {
					display: none;
				}

				.tldraw__editor {
					display: none;
				}

				.${className} {
					display: block !important;
					background: white;
					min-height: 100%;
					height: 100%;
					max-width: 100%;
				}

				.${className}__item {
					padding: 10mm;
					display: flex;
					min-height: 100%;
					flex-direction: column;
					page-break-after: always;
					position: relative;
					overflow: hidden;
					height: 100%;
				}

				.${className}__item__main {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					max-height: 100%;
				}

				.${className}__item__header {
					display: none;
				}

				.${className}__item__footer {
					display: none;
					text-align: right;
				}

				.${className}__item__footer__hide {
					display: none;
				}

				${!enableMargins ? "" : `
					/**
					 * Note: Safari doesn't support removing the page margins to remove them all!
					 */
					@page {
						margin:0;
					}

					.${className} .${className}__item__header {
						display: block;
					}

					.${className} .${className}__item__footer {
						display: block;
					}
				`}
			}

		`;
      const beforePrintHandler = () => {
        document.head.appendChild(style);
        document.body.appendChild(el);
      };
      const afterPrintHandler = () => {
        editor.once("tick", () => {
          clearElements(el, style);
        });
      };
      window.addEventListener("beforeprint", beforePrintHandler);
      window.addEventListener("afterprint", afterPrintHandler);
      function addPageToPrint(title, footer, svg) {
        try {
          el.innerHTML += `<div class="${className}__item">
        <div class="${className}__item__header">
          ${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
        <div class="${className}__item__main">
          ${svg}
        </div>
        <div class="${className}__item__footer ${className}__item__footer__${footer ? "" : "hide"}">
          ${footer ?? ""}
        </div>
      </div>`;
        } catch (e) {
          console.error(e);
        }
      }
      function triggerPrint() {
        if (import_editor.tlenv.isChromeForIos) {
          beforePrintHandler();
          window.print();
        } else if (import_editor.tlenv.isSafari) {
          beforePrintHandler();
          document.execCommand("print", false);
        } else {
          window.print();
        }
      }
      const selectedShapeIds = editor.getSelectedShapeIds();
      const currentPageId = editor.getCurrentPageId();
      const pages = editor.getPages();
      const preserveAspectRatio = "xMidYMid meet";
      const svgOpts = {
        scale: 1,
        background: false,
        darkMode: false,
        preserveAspectRatio
      };
      if (editor.getSelectedShapeIds().length > 0) {
        const svgExport = await editor.getSvgString(selectedShapeIds, svgOpts);
        if (svgExport) {
          const page = pages.find((p) => p.id === currentPageId);
          addPageToPrint(`tldraw \u2014 ${page?.name}`, null, svgExport.svg);
          triggerPrint();
        }
      } else {
        if (allowAllPages) {
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const svgExport = await editor.getSvgString(
              editor.getSortedChildIdsForParent(page.id),
              svgOpts
            );
            if (svgExport) {
              addPageToPrint(`tldraw \u2014 ${page.name}`, `${i}/${pages.length}`, svgExport.svg);
            }
          }
          triggerPrint();
        } else {
          const page = editor.getCurrentPage();
          const svgExport = await editor.getSvgString(
            editor.getSortedChildIdsForParent(page.id),
            svgOpts
          );
          if (svgExport) {
            addPageToPrint(`tldraw \u2014 ${page.name}`, null, svgExport.svg);
            triggerPrint();
          }
        }
      }
      window.removeEventListener("beforeprint", beforePrintHandler);
      window.removeEventListener("afterprint", afterPrintHandler);
    },
    [editor]
  );
}
//# sourceMappingURL=usePrint.js.map
