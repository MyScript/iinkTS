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
var useMenuIsOpen_exports = {};
__export(useMenuIsOpen_exports, {
  useMenuIsOpen: () => useMenuIsOpen
});
module.exports = __toCommonJS(useMenuIsOpen_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_events = require("../context/events");
function useMenuIsOpen(id, cb) {
  const editor = (0, import_editor.useMaybeEditor)();
  const onChange = (0, import_react.useCallback)(
    (isOpen) => {
      if (isOpen) {
        editor?.complete();
      }
      cb?.(isOpen);
    },
    [editor, cb]
  );
  const trackEvent = (0, import_events.useUiEvents)();
  const onEvent = (0, import_react.useCallback)(
    (eventName) => {
      trackEvent(eventName, { source: "unknown", id });
    },
    [id, trackEvent]
  );
  return (0, import_editor.useGlobalMenuIsOpen)(editor ? `${id}-${editor.contextId}` : id, onChange, onEvent);
}
//# sourceMappingURL=useMenuIsOpen.js.map
