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
var DefaultQuickActions_exports = {};
__export(DefaultQuickActions_exports, {
  DefaultQuickActions: () => DefaultQuickActions
});
module.exports = __toCommonJS(DefaultQuickActions_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_TldrawUiMenuContext = require("../primitives/menus/TldrawUiMenuContext");
var import_DefaultQuickActionsContent = require("./DefaultQuickActionsContent");
const DefaultQuickActions = (0, import_react.memo)(function DefaultQuickActions2({
  children
}) {
  const content = children ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DefaultQuickActionsContent.DefaultQuickActionsContent, {});
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuContext.TldrawUiMenuContextProvider, { type: "small-icons", sourceId: "quick-actions", children: content });
});
//# sourceMappingURL=DefaultQuickActions.js.map
