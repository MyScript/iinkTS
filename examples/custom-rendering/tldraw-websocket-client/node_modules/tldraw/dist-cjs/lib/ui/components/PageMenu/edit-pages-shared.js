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
var edit_pages_shared_exports = {};
__export(edit_pages_shared_exports, {
  onMovePage: () => onMovePage
});
module.exports = __toCommonJS(edit_pages_shared_exports);
var import_editor = require("@tldraw/editor");
const onMovePage = (editor, id, from, to, trackEvent) => {
  let index;
  const pages = editor.getPages();
  const below = from > to ? pages[to - 1] : pages[to];
  const above = from > to ? pages[to] : pages[to + 1];
  if (below && !above) {
    index = (0, import_editor.getIndexAbove)(below.index);
  } else if (!below && above) {
    index = (0, import_editor.getIndexBelow)(pages[0].index);
  } else {
    index = (0, import_editor.getIndexBetween)(below.index, above.index);
  }
  if (index !== pages[from].index) {
    editor.markHistoryStoppingPoint("moving page");
    editor.updatePage({
      id,
      index
    });
    trackEvent("move-page", { source: "page-menu" });
  }
};
//# sourceMappingURL=edit-pages-shared.js.map
