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
var DropdownPicker_exports = {};
__export(DropdownPicker_exports, {
  DropdownPicker: () => DropdownPicker
});
module.exports = __toCommonJS(DropdownPicker_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var React = __toESM(require("react"));
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiButtonLabel = require("../primitives/Button/TldrawUiButtonLabel");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
function DropdownPickerInner({
  id,
  label,
  uiType,
  stylePanelType,
  style,
  items,
  type,
  value,
  onValueChange
}) {
  const msg = (0, import_useTranslation.useTranslation)();
  const editor = (0, import_editor.useEditor)();
  const icon = React.useMemo(
    () => items.find((item) => value.type === "shared" && item.value === value.value)?.icon,
    [items, value]
  );
  const stylePanelName = msg(`style-panel.${stylePanelType}`);
  const titleStr = value.type === "mixed" ? msg("style-panel.mixed") : stylePanelName + " \u2014 " + msg(`${uiType}-style.${value.value}`);
  const labelStr = label ? msg(label) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: `style panel ${id}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiButton.TldrawUiButton, { type, "data-testid": `style.${uiType}`, title: titleStr, children: [
      labelStr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: labelStr }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: icon ?? "mixed" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "left", align: "center", alignOffset: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-buttons__grid", children: items.map((item) => {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TldrawUiButton.TldrawUiButton,
        {
          type: "icon",
          "data-testid": `style.${uiType}.${item.value}`,
          title: stylePanelName + " \u2014 " + msg(`${uiType}-style.${item.value}`),
          onClick: () => {
            editor.markHistoryStoppingPoint("select style dropdown item");
            onValueChange(style, item.value);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: item.icon })
        }
      ) }, item.value);
    }) }) })
  ] });
}
const DropdownPicker = React.memo(DropdownPickerInner);
//# sourceMappingURL=DropdownPicker.js.map
