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
var useGetEmbedDefinition_exports = {};
__export(useGetEmbedDefinition_exports, {
  useGetEmbedDefinition: () => useGetEmbedDefinition,
  useGetEmbedShapeUtil: () => useGetEmbedShapeUtil
});
module.exports = __toCommonJS(useGetEmbedDefinition_exports);
var import_editor = require("@tldraw/editor");
function useGetEmbedShapeUtil() {
  const editor = (0, import_editor.useMaybeEditor)();
  if (!editor) return void 0;
  if (editor.hasShapeUtil("embed")) {
    return editor.getShapeUtil("embed");
  }
  return void 0;
}
function useGetEmbedDefinition() {
  const embedUtil = useGetEmbedShapeUtil();
  return (url) => {
    return embedUtil ? embedUtil.getEmbedDefinition(url) : void 0;
  };
}
//# sourceMappingURL=useGetEmbedDefinition.js.map
