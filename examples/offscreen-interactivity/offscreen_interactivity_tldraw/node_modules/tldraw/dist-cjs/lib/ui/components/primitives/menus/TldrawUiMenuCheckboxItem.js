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
var TldrawUiMenuCheckboxItem_exports = {};
__export(TldrawUiMenuCheckboxItem_exports, {
  TldrawUiMenuCheckboxItem: () => TldrawUiMenuCheckboxItem
});
module.exports = __toCommonJS(TldrawUiMenuCheckboxItem_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var _ContextMenu = __toESM(require("@radix-ui/react-context-menu"));
var _DropdownMenu = __toESM(require("@radix-ui/react-dropdown-menu"));
var import_editor = require("@tldraw/editor");
var import_actions = require("../../../context/actions");
var import_useReadonly = require("../../../hooks/useReadonly");
var import_useTranslation = require("../../../hooks/useTranslation/useTranslation");
var import_TldrawUiIcon = require("../TldrawUiIcon");
var import_TldrawUiKbd = require("../TldrawUiKbd");
var import_TldrawUiMenuContext = require("./TldrawUiMenuContext");
function TldrawUiMenuCheckboxItem({
  id,
  kbd,
  label,
  readonlyOk,
  onSelect,
  toggle = false,
  disabled = false,
  checked = false
}) {
  const { type: menuType, sourceId } = (0, import_TldrawUiMenuContext.useTldrawUiMenuContext)();
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const msg = (0, import_useTranslation.useTranslation)();
  if (isReadonlyMode && !readonlyOk) return null;
  const labelToUse = (0, import_actions.unwrapLabel)(label, menuType);
  const labelStr = labelToUse ? msg(labelToUse) : void 0;
  switch (menuType) {
    case "menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        _DropdownMenu.CheckboxItem,
        {
          dir: "ltr",
          className: "tlui-button tlui-button__menu tlui-button__checkbox",
          title: labelStr,
          onSelect: (e) => {
            onSelect?.(sourceId);
            (0, import_editor.preventDefault)(e);
          },
          disabled,
          checked,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_TldrawUiIcon.TldrawUiIcon,
              {
                small: true,
                icon: toggle ? checked ? "toggle-on" : "toggle-off" : checked ? "check" : "none"
              }
            ),
            labelStr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tlui-button__label", draggable: false, children: labelStr }),
            kbd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiKbd.TldrawUiKbd, { children: kbd })
          ]
        }
      );
    }
    case "context-menu": {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        _ContextMenu.CheckboxItem,
        {
          className: "tlui-button tlui-button__menu tlui-button__checkbox",
          dir: "ltr",
          title: labelStr,
          onSelect: (e) => {
            onSelect(sourceId);
            (0, import_editor.preventDefault)(e);
          },
          disabled,
          checked,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_TldrawUiIcon.TldrawUiIcon,
              {
                small: true,
                icon: toggle ? checked ? "toggle-on" : "toggle-off" : checked ? "check" : "none"
              }
            ),
            labelStr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tlui-button__label", draggable: false, children: labelStr }),
            kbd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiKbd.TldrawUiKbd, { children: kbd })
          ]
        },
        id
      );
    }
    default: {
      return null;
    }
  }
}
//# sourceMappingURL=TldrawUiMenuCheckboxItem.js.map
