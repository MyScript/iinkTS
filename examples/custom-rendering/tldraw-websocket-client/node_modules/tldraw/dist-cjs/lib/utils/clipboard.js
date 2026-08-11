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
var clipboard_exports = {};
__export(clipboard_exports, {
  TLDRAW_CUSTOM_PNG_MIME_TYPE: () => TLDRAW_CUSTOM_PNG_MIME_TYPE,
  clipboardWrite: () => clipboardWrite,
  doesClipboardSupportType: () => doesClipboardSupportType,
  getAdditionalClipboardWriteType: () => getAdditionalClipboardWriteType,
  getCanonicalClipboardReadType: () => getCanonicalClipboardReadType
});
module.exports = __toCommonJS(clipboard_exports);
var import_editor = require("@tldraw/editor");
const TLDRAW_CUSTOM_PNG_MIME_TYPE = "web image/vnd.tldraw+png";
const additionalClipboardWriteTypes = {
  png: TLDRAW_CUSTOM_PNG_MIME_TYPE
};
const canonicalClipboardReadTypes = {
  [TLDRAW_CUSTOM_PNG_MIME_TYPE]: "image/png"
};
function getAdditionalClipboardWriteType(format) {
  return (0, import_editor.getOwnProperty)(additionalClipboardWriteTypes, format) ?? null;
}
function getCanonicalClipboardReadType(mimeType) {
  return (0, import_editor.getOwnProperty)(canonicalClipboardReadTypes, mimeType) ?? mimeType;
}
function doesClipboardSupportType(mimeType) {
  return typeof ClipboardItem !== "undefined" && "supports" in ClipboardItem && ClipboardItem.supports(mimeType);
}
function clipboardWrite(types) {
  const entries = Object.entries(types);
  for (const [_, promise] of entries) promise.catch((err) => console.error(err));
  return navigator.clipboard.write([new ClipboardItem(types)]).catch((err) => {
    console.error(err);
    return Promise.all(
      entries.map(async ([type, promise]) => {
        return [type, await promise];
      })
    ).then((entries2) => {
      const resolvedTypes = (0, import_editor.objectMapFromEntries)(entries2);
      return navigator.clipboard.write([new ClipboardItem(resolvedTypes)]);
    });
  });
}
//# sourceMappingURL=clipboard.js.map
