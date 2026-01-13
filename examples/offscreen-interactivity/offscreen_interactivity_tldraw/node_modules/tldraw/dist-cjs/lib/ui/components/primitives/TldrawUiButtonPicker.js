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
var TldrawUiButtonPicker_exports = {};
__export(TldrawUiButtonPicker_exports, {
  TldrawUiButtonPicker: () => TldrawUiButtonPicker
});
module.exports = __toCommonJS(TldrawUiButtonPicker_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_react = require("react");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("./Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("./Button/TldrawUiButtonIcon");
const TldrawUiButtonPicker = (0, import_react.memo)(function TldrawUiButtonPicker2(props) {
  const {
    uiType,
    items,
    title,
    style,
    value,
    // columns = clamp(items.length, 2, 4),
    onValueChange,
    onHistoryMark,
    theme
  } = props;
  const msg = (0, import_useTranslation.useTranslation)();
  const rPointing = (0, import_react.useRef)(false);
  const rPointingOriginalActiveElement = (0, import_react.useRef)(null);
  const {
    handleButtonClick,
    handleButtonPointerDown,
    handleButtonPointerEnter,
    handleButtonPointerUp
  } = (0, import_react.useMemo)(() => {
    const handlePointerUp = () => {
      rPointing.current = false;
      window.removeEventListener("pointerup", handlePointerUp);
      const origActiveEl = rPointingOriginalActiveElement.current;
      if (origActiveEl && ["TEXTAREA", "INPUT"].includes(origActiveEl.nodeName)) {
        origActiveEl.focus();
      }
      rPointingOriginalActiveElement.current = null;
    };
    const handleButtonClick2 = (e) => {
      const { id } = e.currentTarget.dataset;
      if (value.type === "shared" && value.value === id) return;
      onHistoryMark?.("point picker item");
      onValueChange(style, id);
    };
    const handleButtonPointerDown2 = (e) => {
      const { id } = e.currentTarget.dataset;
      onHistoryMark?.("point picker item");
      onValueChange(style, id);
      rPointing.current = true;
      rPointingOriginalActiveElement.current = document.activeElement;
      window.addEventListener("pointerup", handlePointerUp);
    };
    const handleButtonPointerEnter2 = (e) => {
      if (!rPointing.current) return;
      const { id } = e.currentTarget.dataset;
      onValueChange(style, id);
    };
    const handleButtonPointerUp2 = (e) => {
      const { id } = e.currentTarget.dataset;
      if (value.type === "shared" && value.value === id) return;
      onValueChange(style, id);
    };
    return {
      handleButtonClick: handleButtonClick2,
      handleButtonPointerDown: handleButtonPointerDown2,
      handleButtonPointerEnter: handleButtonPointerEnter2,
      handleButtonPointerUp: handleButtonPointerUp2
    };
  }, [value, onHistoryMark, onValueChange, style]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-testid": `style.${uiType}`, className: (0, import_classnames.default)("tlui-buttons__grid"), children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_TldrawUiButton.TldrawUiButton,
    {
      type: "icon",
      "data-id": item.value,
      "data-testid": `style.${uiType}.${item.value}`,
      "aria-label": item.value,
      "data-state": value.type === "shared" && value.value === item.value ? "hinted" : void 0,
      title: title + " \u2014 " + msg(`${uiType}-style.${item.value}`),
      className: (0, import_classnames.default)("tlui-button-grid__button"),
      style: style === import_editor.DefaultColorStyle ? { color: theme[item.value].solid } : void 0,
      onPointerEnter: handleButtonPointerEnter,
      onPointerDown: handleButtonPointerDown,
      onPointerUp: handleButtonPointerUp,
      onClick: handleButtonClick,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: item.icon })
    },
    item.value
  )) });
});
//# sourceMappingURL=TldrawUiButtonPicker.js.map
