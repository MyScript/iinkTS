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
var pasteFiles_exports = {};
__export(pasteFiles_exports, {
  pasteFiles: () => pasteFiles
});
module.exports = __toCommonJS(pasteFiles_exports);
async function pasteFiles(editor, blobs, point, sources) {
  const files = blobs.map(
    (blob) => blob instanceof File ? blob : new File([blob], "tldrawFile", { type: blob.type })
  );
  editor.markHistoryStoppingPoint("paste");
  await editor.putExternalContent({
    type: "files",
    files,
    point,
    sources
  });
}
//# sourceMappingURL=pasteFiles.js.map
