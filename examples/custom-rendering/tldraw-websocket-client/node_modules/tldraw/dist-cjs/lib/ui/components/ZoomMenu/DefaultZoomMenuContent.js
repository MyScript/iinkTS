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
var DefaultZoomMenuContent_exports = {};
__export(DefaultZoomMenuContent_exports, {
  DefaultZoomMenuContent: () => DefaultZoomMenuContent
});
module.exports = __toCommonJS(DefaultZoomMenuContent_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_menu_items = require("../menu-items");
var import_TldrawUiMenuActionItem = require("../primitives/menus/TldrawUiMenuActionItem");
function DefaultZoomMenuContent() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-in", noClose: true }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuActionItem.TldrawUiMenuActionItem, { actionId: "zoom-out", noClose: true }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ZoomTo100MenuItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ZoomToFitMenuItem, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_items.ZoomToSelectionMenuItem, {})
  ] });
}
//# sourceMappingURL=DefaultZoomMenuContent.js.map
