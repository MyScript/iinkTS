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
var useIsEditing_exports = {};
__export(useIsEditing_exports, {
  useIsEditing: () => useIsEditing
});
module.exports = __toCommonJS(useIsEditing_exports);
var import_state_react = require("@tldraw/state-react");
var import_useEditor = require("./useEditor");
function useIsEditing(shapeId) {
  const editor = (0, import_useEditor.useEditor)();
  return (0, import_state_react.useValue)("isEditing", () => editor.getEditingShapeId() === shapeId, [editor, shapeId]);
}
//# sourceMappingURL=useIsEditing.js.map
