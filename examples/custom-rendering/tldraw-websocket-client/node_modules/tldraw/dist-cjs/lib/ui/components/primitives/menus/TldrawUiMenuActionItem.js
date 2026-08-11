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
var TldrawUiMenuActionItem_exports = {};
__export(TldrawUiMenuActionItem_exports, {
  TldrawUiMenuActionItem: () => TldrawUiMenuActionItem
});
module.exports = __toCommonJS(TldrawUiMenuActionItem_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_actions = require("../../../context/actions");
var import_TldrawUiMenuItem = require("./TldrawUiMenuItem");
function TldrawUiMenuActionItem({ actionId = "", ...rest }) {
  const actions = (0, import_actions.useActions)();
  const action = actions[actionId];
  if (!action) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { ...action, ...rest });
}
//# sourceMappingURL=TldrawUiMenuActionItem.js.map
