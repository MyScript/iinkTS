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
var useIsCropping_exports = {};
__export(useIsCropping_exports, {
  useIsCropping: () => useIsCropping
});
module.exports = __toCommonJS(useIsCropping_exports);
var import_state_react = require("@tldraw/state-react");
var import_useEditor = require("./useEditor");
function useIsCropping(shapeId) {
  const editor = (0, import_useEditor.useEditor)();
  return (0, import_state_react.useValue)("isCropping", () => editor.getCroppingShapeId() === shapeId, [editor, shapeId]);
}
//# sourceMappingURL=useIsCropping.js.map
