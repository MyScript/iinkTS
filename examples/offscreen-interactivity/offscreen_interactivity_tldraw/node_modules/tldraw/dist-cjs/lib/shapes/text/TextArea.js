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
var TextArea_exports = {};
__export(TextArea_exports, {
  TextArea: () => TextArea
});
module.exports = __toCommonJS(TextArea_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
const TextArea = (0, import_react.forwardRef)(function TextArea2({
  isEditing,
  text,
  handleFocus,
  handleChange,
  handleKeyDown,
  handleBlur,
  handleInputPointerDown,
  handleDoubleClick
}, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "textarea",
    {
      ref,
      className: "tl-text tl-text-input",
      name: "text",
      tabIndex: -1,
      readOnly: !isEditing,
      autoComplete: "off",
      autoCapitalize: "off",
      autoCorrect: "off",
      autoSave: "off",
      placeholder: "",
      spellCheck: "true",
      wrap: "off",
      dir: "auto",
      defaultValue: text,
      onFocus: handleFocus,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      onTouchEnd: import_editor.stopEventPropagation,
      onContextMenu: isEditing ? import_editor.stopEventPropagation : void 0,
      onPointerDown: handleInputPointerDown,
      onDoubleClick: handleDoubleClick,
      onDragStart: import_editor.preventDefault
    }
  );
});
//# sourceMappingURL=TextArea.js.map
