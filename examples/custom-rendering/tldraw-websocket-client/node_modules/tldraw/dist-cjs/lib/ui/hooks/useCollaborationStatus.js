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
var useCollaborationStatus_exports = {};
__export(useCollaborationStatus_exports, {
  useCollaborationStatus: () => useCollaborationStatus,
  useShowCollaborationUi: () => useShowCollaborationUi
});
module.exports = __toCommonJS(useCollaborationStatus_exports);
var import_editor = require("@tldraw/editor");
function useShowCollaborationUi() {
  const editor = (0, import_editor.useMaybeEditor)();
  return editor?.store.props.collaboration !== void 0;
}
function useCollaborationStatus() {
  const editor = (0, import_editor.useMaybeEditor)();
  return (0, import_editor.useValue)(
    "sync status",
    () => {
      if (!editor?.store.props.collaboration?.status) {
        return null;
      }
      return editor.store.props.collaboration.status.get();
    },
    [editor]
  );
}
//# sourceMappingURL=useCollaborationStatus.js.map
