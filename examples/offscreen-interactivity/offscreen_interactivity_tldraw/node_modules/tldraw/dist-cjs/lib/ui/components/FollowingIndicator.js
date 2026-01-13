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
var FollowingIndicator_exports = {};
__export(FollowingIndicator_exports, {
  FollowingIndicator: () => FollowingIndicator
});
module.exports = __toCommonJS(FollowingIndicator_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
function FollowingIndicator() {
  const editor = (0, import_editor.useEditor)();
  const followingUserId = (0, import_editor.useValue)("follow", () => editor.getInstanceState().followingUserId, [
    editor
  ]);
  if (!followingUserId) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowingIndicatorInner, { userId: followingUserId });
}
function FollowingIndicatorInner({ userId }) {
  const presence = (0, import_editor.usePresence)(userId);
  if (!presence) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-following-indicator", style: { borderColor: presence.color } });
}
//# sourceMappingURL=FollowingIndicator.js.map
