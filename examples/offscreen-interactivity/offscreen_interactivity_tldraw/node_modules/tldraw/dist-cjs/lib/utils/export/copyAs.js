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
var copyAs_exports = {};
__export(copyAs_exports, {
  copyAs: () => copyAs
});
module.exports = __toCommonJS(copyAs_exports);
var import_editor = require("@tldraw/editor");
var import_clipboard = require("../clipboard");
var import_export = require("./export");
function copyAs(editor, ids, format = "svg", opts = {}) {
  if (!navigator.clipboard) return Promise.reject(new Error("Copy not supported"));
  if (navigator.clipboard.write) {
    const { blobPromise, mimeType } = (0, import_export.exportToBlobPromise)(editor, ids, format, opts);
    const types = { [mimeType]: blobPromise };
    const additionalMimeType = (0, import_clipboard.getAdditionalClipboardWriteType)(mimeType);
    if (additionalMimeType && (0, import_clipboard.doesClipboardSupportType)(additionalMimeType)) {
      types[additionalMimeType] = blobPromise.then(
        (blob) => import_editor.FileHelpers.rewriteMimeType(blob, additionalMimeType)
      );
    }
    return (0, import_clipboard.clipboardWrite)(types);
  }
  switch (format) {
    case "json":
    case "svg":
      return fallbackWriteTextAsync(async () => (0, import_export.exportToString)(editor, ids, format, opts));
    case "jpeg":
    case "png":
      throw new Error("Copy not supported");
    default:
      (0, import_editor.exhaustiveSwitchError)(format);
  }
}
async function fallbackWriteTextAsync(getText) {
  await navigator.clipboard?.writeText?.(await getText());
}
//# sourceMappingURL=copyAs.js.map
