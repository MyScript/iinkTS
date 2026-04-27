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
var usePresence_exports = {};
__export(usePresence_exports, {
  usePresence: () => usePresence
});
module.exports = __toCommonJS(usePresence_exports);
var import_state_react = require("@tldraw/state-react");
var import_useEditor = require("./useEditor");
function usePresence(userId) {
  const editor = (0, import_useEditor.useEditor)();
  const latestPresence = (0, import_state_react.useValue)(
    `latestPresence:${userId}`,
    () => {
      return editor.getCollaborators().find((c) => c.userId === userId);
    },
    [editor, userId]
  );
  return latestPresence ?? null;
}
//# sourceMappingURL=usePresence.js.map
