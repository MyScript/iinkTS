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
var PeopleMenuAvatar_exports = {};
__export(PeopleMenuAvatar_exports, {
  PeopleMenuAvatar: () => PeopleMenuAvatar
});
module.exports = __toCommonJS(PeopleMenuAvatar_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
function PeopleMenuAvatar({ userId }) {
  const presence = (0, import_editor.usePresence)(userId);
  if (!presence) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: "tlui-people-menu__avatar",
      style: {
        backgroundColor: presence.color
      },
      children: presence.userName?.[0] ?? ""
    },
    userId
  );
}
//# sourceMappingURL=PeopleMenuAvatar.js.map
