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
var DefaultDebugMenu_exports = {};
__export(DefaultDebugMenu_exports, {
  DefaultDebugMenu: () => DefaultDebugMenu
});
module.exports = __toCommonJS(DefaultDebugMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiDropdownMenu = require("../primitives/TldrawUiDropdownMenu");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultDebugMenuContent = require("./DefaultDebugMenuContent");
function DefaultDebugMenu({ children }) {
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultDebugMenuContent.DefaultDebugMenuContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuRoot, { id: "debug", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "icon", title: "Debug menu", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "dots-horizontal" }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDropdownMenu.TldrawUiDropdownMenuContent, { side: "top", align: "end", alignOffset: 0, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "menu", sourceId: "debug-panel", children: content }) })
  ] });
}
//# sourceMappingURL=DefaultDebugMenu.js.map
