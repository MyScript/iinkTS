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
var useEditableText_exports = {};
__export(useEditableText_exports, {
  useEditableText: () => useEditableText
});
module.exports = __toCommonJS(useEditableText_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_TextHelpers = require("./TextHelpers");
function useEditableText(shapeId, type, text) {
  const editor = (0, import_editor.useEditor)();
  const rInput = (0, import_react.useRef)(null);
  const isEditing = (0, import_editor.useValue)("isEditing", () => editor.getEditingShapeId() === shapeId, [editor]);
  const isEditingAnything = (0, import_editor.useValue)("isEditingAnything", () => !!editor.getEditingShapeId(), [
    editor
  ]);
  (0, import_react.useEffect)(() => {
    function selectAllIfEditing(event) {
      if (event.shapeId === shapeId) {
        rInput.current?.select();
      }
    }
    editor.on("select-all-text", selectAllIfEditing);
    return () => {
      editor.off("select-all-text", selectAllIfEditing);
    };
  }, [editor, shapeId, isEditing]);
  (0, import_react.useEffect)(() => {
    if (!isEditing) return;
    if (document.activeElement !== rInput.current) {
      rInput.current?.focus();
    }
    if (editor.getInstanceState().isCoarsePointer) {
      rInput.current?.select();
    }
    if (import_editor.tlenv.isSafari) {
      rInput.current?.blur();
      rInput.current?.focus();
    }
  }, [editor, isEditing]);
  const handleKeyDown = (0, import_react.useCallback)(
    (e) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      switch (e.key) {
        case "Enter": {
          if (e.ctrlKey || e.metaKey) {
            editor.complete();
          }
          break;
        }
      }
    },
    [editor, shapeId]
  );
  const handleChange = (0, import_react.useCallback)(
    (e) => {
      if (editor.getEditingShapeId() !== shapeId) return;
      let text2 = import_TextHelpers.TextHelpers.normalizeText(e.currentTarget.value);
      const untabbedText = text2.replace(/\t/g, import_TextHelpers.INDENT);
      if (untabbedText !== text2) {
        const selectionStart = e.currentTarget.selectionStart;
        e.currentTarget.value = untabbedText;
        e.currentTarget.selectionStart = selectionStart + (untabbedText.length - text2.length);
        e.currentTarget.selectionEnd = selectionStart + (untabbedText.length - text2.length);
        text2 = untabbedText;
      }
      editor.updateShape({
        id: shapeId,
        type,
        props: { text: text2 }
      });
    },
    [editor, shapeId, type]
  );
  const handleInputPointerDown = (0, import_react.useCallback)(
    (e) => {
      editor.dispatch({
        ...(0, import_editor.getPointerInfo)(e),
        type: "pointer",
        name: "pointer_down",
        target: "shape",
        shape: editor.getShape(shapeId)
      });
      (0, import_editor.stopEventPropagation)(e);
    },
    [editor, shapeId]
  );
  return {
    rInput,
    handleFocus: import_editor.noop,
    handleBlur: import_editor.noop,
    handleKeyDown,
    handleChange,
    handleInputPointerDown,
    handleDoubleClick: import_editor.stopEventPropagation,
    isEmpty: text.trim().length === 0,
    isEditing,
    isEditingAnything
  };
}
//# sourceMappingURL=useEditableText.js.map
