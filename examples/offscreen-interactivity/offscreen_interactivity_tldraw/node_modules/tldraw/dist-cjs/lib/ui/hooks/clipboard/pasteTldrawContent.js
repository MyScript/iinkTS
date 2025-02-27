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
var pasteTldrawContent_exports = {};
__export(pasteTldrawContent_exports, {
  pasteTldrawContent: () => pasteTldrawContent
});
module.exports = __toCommonJS(pasteTldrawContent_exports);
function pasteTldrawContent(editor, clipboard, point) {
  const selectionBoundsBefore = editor.getSelectionPageBounds();
  editor.markHistoryStoppingPoint("paste");
  editor.putContentOntoCurrentPage(clipboard, {
    point,
    select: true
  });
  const selectedBoundsAfter = editor.getSelectionPageBounds();
  if (selectionBoundsBefore && selectedBoundsAfter && selectionBoundsBefore?.collides(selectedBoundsAfter)) {
    editor.updateInstanceState({ isChangingStyle: true });
    editor.timers.setTimeout(() => {
      editor.updateInstanceState({ isChangingStyle: false });
    }, 150);
  }
}
//# sourceMappingURL=pasteTldrawContent.js.map
