"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var TextLabel_exports = {};
__export(TextLabel_exports, {
  TextLabel: () => TextLabel
});
module.exports = __toCommonJS(TextLabel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = __toESM(require("react"));
var import_TextArea = require("../text/TextArea");
var import_TextHelpers = require("./TextHelpers");
var import_legacyProps = require("./legacyProps");
var import_useEditableText = require("./useEditableText");
const TextLabel = import_react.default.memo(function TextLabel2({
  shapeId,
  type,
  text,
  labelColor,
  font,
  fontSize,
  lineHeight,
  align,
  verticalAlign,
  wrap,
  isSelected,
  padding = 0,
  onKeyDown: handleKeyDownCustom,
  classNamePrefix,
  style,
  textWidth,
  textHeight
}) {
  const { rInput, isEmpty, isEditing, isEditingAnything, ...editableTextRest } = (0, import_useEditableText.useEditableText)(
    shapeId,
    type,
    text
  );
  const [initialText, setInitialText] = (0, import_react.useState)(text);
  (0, import_react.useEffect)(() => {
    if (!isEditing) setInitialText(text);
  }, [isEditing, text]);
  const finalText = import_TextHelpers.TextHelpers.normalizeTextForDom(text);
  const hasText = finalText.length > 0;
  const legacyAlign = (0, import_legacyProps.isLegacyAlign)(align);
  if (!isEditing && !hasText) {
    return null;
  }
  const cssPrefix = classNamePrefix || "tl-text";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: `${cssPrefix}-label tl-text-wrapper`,
      "data-font": font,
      "data-align": align,
      "data-hastext": !isEmpty,
      "data-isediting": isEditing,
      "data-iseditinganything": isEditingAnything,
      "data-textwrap": !!wrap,
      "data-isselected": isSelected,
      style: {
        justifyContent: align === "middle" || legacyAlign ? "center" : align,
        alignItems: verticalAlign === "middle" ? "center" : verticalAlign,
        padding,
        ...style
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: `${cssPrefix}-label__inner tl-text-content__wrapper`,
          style: {
            fontSize,
            lineHeight: Math.floor(fontSize * lineHeight) + "px",
            minHeight: Math.floor(fontSize * lineHeight) + "px",
            minWidth: Math.ceil(textWidth || 0),
            color: labelColor,
            width: textWidth ? Math.ceil(textWidth) : void 0,
            height: textHeight ? Math.ceil(textHeight) : void 0
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `${cssPrefix} tl-text tl-text-content`, dir: "auto", children: finalText.split("\n").map((lineOfText, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { dir: "auto", children: lineOfText }, index)) }),
            (isEditingAnything || isSelected) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_TextArea.TextArea,
              {
                ref: rInput,
                text,
                isEditing,
                ...editableTextRest,
                handleKeyDown: handleKeyDownCustom ?? editableTextRest.handleKeyDown
              },
              initialText
            )
          ]
        }
      )
    }
  );
});
//# sourceMappingURL=TextLabel.js.map
