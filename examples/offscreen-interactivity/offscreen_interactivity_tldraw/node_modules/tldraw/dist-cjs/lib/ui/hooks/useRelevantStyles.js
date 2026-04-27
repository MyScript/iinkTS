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
var useRelevantStyles_exports = {};
__export(useRelevantStyles_exports, {
  useRelevantStyles: () => useRelevantStyles
});
module.exports = __toCommonJS(useRelevantStyles_exports);
var import_editor = require("@tldraw/editor");
const selectToolStyles = Object.freeze([
  import_editor.DefaultColorStyle,
  import_editor.DefaultDashStyle,
  import_editor.DefaultFillStyle,
  import_editor.DefaultSizeStyle
]);
function useRelevantStyles(stylesToCheck = selectToolStyles) {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "getRelevantStyles",
    () => {
      const styles = new import_editor.SharedStyleMap(editor.getSharedStyles());
      const isInShapeSpecificTool = !!editor.root.getCurrent()?.shapeType;
      const hasShapesSelected = editor.isIn("select") && editor.getSelectedShapeIds().length > 0;
      if (styles.size === 0 && editor.isIn("select") && editor.getSelectedShapeIds().length === 0) {
        for (const style of stylesToCheck) {
          styles.applyValue(style, editor.getStyleForNextShape(style));
        }
      }
      if (isInShapeSpecificTool || hasShapesSelected || styles.size > 0) {
        return styles;
      }
      return null;
    },
    [editor]
  );
}
//# sourceMappingURL=useRelevantStyles.js.map
