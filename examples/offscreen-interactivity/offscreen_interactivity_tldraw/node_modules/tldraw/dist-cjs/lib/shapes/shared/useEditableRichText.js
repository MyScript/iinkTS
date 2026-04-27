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
var useEditableRichText_exports = {};
__export(useEditableRichText_exports, {
  useEditableRichText: () => useEditableRichText
});
module.exports = __toCommonJS(useEditableRichText_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_richText = require("../../utils/text/richText");
var import_useEditablePlainText = require("./useEditablePlainText");
function useEditableRichText(shapeId, type, richText) {
  const commonUseEditableTextHandlers = (0, import_useEditablePlainText.useEditableTextCommon)(shapeId);
  const isEditing = commonUseEditableTextHandlers.isEditing;
  const editor = (0, import_editor.useEditor)();
  const rInput = (0, import_react.useRef)(null);
  const isEmpty = richText && (0, import_richText.isEmptyRichText)(richText);
  (0, import_react.useEffect)(() => {
    if (!isEditing) return;
    const contentEditable = rInput.current?.querySelector("[contenteditable]");
    if (contentEditable && document.activeElement !== rInput.current) {
      ;
      contentEditable.focus();
    }
  }, [editor, isEditing]);
  const handleKeyDown = (0, import_react.useCallback)(
    (e) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      if (e.key === "Enter" && (0, import_editor.isAccelKey)(e)) editor.complete();
    },
    [editor, shapeId]
  );
  const handleChange = (0, import_react.useCallback)(
    ({ richText: richText2 }) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      editor.updateShape({
        id: shapeId,
        type,
        props: { richText: richText2 }
      });
    },
    [editor, shapeId, type]
  );
  return {
    rInput,
    handleKeyDown,
    handleChange,
    isEmpty,
    ...commonUseEditableTextHandlers
  };
}
//# sourceMappingURL=useEditableRichText.js.map
