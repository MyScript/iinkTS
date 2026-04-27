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
var StopFollowing_exports = {};
__export(StopFollowing_exports, {
  StopFollowing: () => StopFollowing
});
module.exports = __toCommonJS(StopFollowing_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_actions = require("../../context/actions");
var import_TldrawUiMenuItem = require("../primitives/menus/TldrawUiMenuItem");
function StopFollowing() {
  const editor = (0, import_editor.useEditor)();
  const actions = (0, import_actions.useActions)();
  const followingUser = (0, import_editor.useValue)(
    "is following user",
    () => !!editor.getInstanceState().followingUserId,
    [editor]
  );
  if (!followingUser) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiMenuItem.TldrawUiMenuItem, { ...actions["stop-following"] });
}
//# sourceMappingURL=StopFollowing.js.map
