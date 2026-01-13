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
var DoubleDropdownPicker_exports = {};
__export(DoubleDropdownPicker_exports, {
  DoubleDropdownPicker: () => DoubleDropdownPicker
});
module.exports = __toCommonJS(DoubleDropdownPicker_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var React = __toESM(require("react"));
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
function DoubleDropdownPickerInner({
  label,
  uiTypeA,
  uiTypeB,
  labelA,
  labelB,
  itemsA,
  itemsB,
  styleA,
  styleB,
  valueA,
  valueB,
  onValueChange
}) {
  const msg = (0, import_useTranslation.useTranslation)();
  const iconA = React.useMemo(
    () => itemsA.find((item) => valueA.type === "shared" && valueA.value === item.value)?.icon ?? "mixed",
    [itemsA, valueA]
  );
  const iconB = React.useMemo(
    () => itemsB.find((item) => valueB.type === "shared" && valueB.value === item.value)?.icon ?? "mixed",
    [itemsB, valueB]
  );
  if (valueA === void 0 && valueB === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-style-panel__double-select-picker", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { title: msg(label), className: "tlui-style-panel__double-select-picker-label", children: msg(label) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-buttons__horizontal", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: `style panel ${uiTypeA} A`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "icon",
            "data-testid": `style.${uiTypeA}`,
            title: msg(labelA) + " \u2014 " + (valueA === null || valueA.type === "mixed" ? msg("style-panel.mixed") : msg(`${uiTypeA}-style.${valueA.value}`)),
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: iconA, small: true, invertIcon: true })
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "left", align: "center", sideOffset: 80, alignOffset: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-buttons__grid", children: itemsA.map((item, i) => {
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuItem, { "data-testid": `style.${uiTypeA}.${item.value}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_TldrawUiButton.TldrawUiButton,
            {
              type: "icon",
              onClick: () => onValueChange(styleA, item.value),
              title: `${msg(labelA)} \u2014 ${msg(`${uiTypeA}-style.${item.value}`)}`,
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: item.icon, invertIcon: true })
            },
            item.value
          ) }, i);
        }) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: `style panel ${uiTypeB}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "icon",
            "data-testid": `style.${uiTypeB}`,
            title: msg(labelB) + " \u2014 " + (valueB === null || valueB.type === "mixed" ? msg("style-panel.mixed") : msg(`${uiTypeB}-style.${valueB.value}`)),
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: iconB, small: true })
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "left", align: "center", sideOffset: 116, alignOffset: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-buttons__grid", children: itemsB.map((item) => {
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_TldrawUiButton.TldrawUiButton,
            {
              type: "icon",
              title: `${msg(labelB)} \u2014 ${msg(`${uiTypeB}-style.${item.value}`)}`,
              "data-testid": `style.${uiTypeB}.${item.value}`,
              onClick: () => onValueChange(styleB, item.value),
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: item.icon })
            }
          ) }, item.value);
        }) }) })
      ] })
    ] })
  ] });
}
const DoubleDropdownPicker = React.memo(
  DoubleDropdownPickerInner
);
//# sourceMappingURL=DoubleDropdownPicker.js.map
