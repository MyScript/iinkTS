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
var TldrawUiSlider_exports = {};
__export(TldrawUiSlider_exports, {
  TldrawUiSlider: () => TldrawUiSlider
});
module.exports = __toCommonJS(TldrawUiSlider_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react_slider = require("@radix-ui/react-slider");
var import_react = require("react");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
const TldrawUiSlider = (0, import_react.memo)(function Slider({
  onHistoryMark,
  title,
  steps,
  value,
  label,
  onValueChange,
  ["data-testid"]: testId
}) {
  const msg = (0, import_useTranslation.useTranslation)();
  const handleValueChange = (0, import_react.useCallback)(
    (value2) => {
      onValueChange(value2[0]);
    },
    [onValueChange]
  );
  const handlePointerDown = (0, import_react.useCallback)(() => {
    onHistoryMark("click slider");
  }, [onHistoryMark]);
  const handlePointerUp = (0, import_react.useCallback)(() => {
    if (!value) return;
    onValueChange(value);
  }, [value, onValueChange]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-slider__container", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_react_slider.Root,
    {
      "data-testid": testId,
      className: "tlui-slider",
      "area-label": "Opacity",
      dir: "ltr",
      min: 0,
      max: steps,
      step: 1,
      value: value ? [value] : void 0,
      onPointerDown: handlePointerDown,
      onValueChange: handleValueChange,
      onPointerUp: handlePointerUp,
      title: title + " \u2014 " + msg(label),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_slider.Track, { className: "tlui-slider__track", dir: "ltr", children: value !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_slider.Range, { className: "tlui-slider__range", dir: "ltr" }) }),
        value !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_slider.Thumb, { className: "tlui-slider__thumb", dir: "ltr" })
      ]
    }
  ) });
});
//# sourceMappingURL=TldrawUiSlider.js.map
