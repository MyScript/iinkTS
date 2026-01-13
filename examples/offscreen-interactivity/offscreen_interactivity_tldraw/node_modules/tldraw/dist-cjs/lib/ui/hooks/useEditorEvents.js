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
var useEditorEvents_exports = {};
__export(useEditorEvents_exports, {
  useEditorEvents: () => useEditorEvents
});
module.exports = __toCommonJS(useEditorEvents_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_toasts = require("../context/toasts");
function useEditorEvents() {
  const editor = (0, import_editor.useEditor)();
  const { addToast } = (0, import_toasts.useToasts)();
  (0, import_react.useEffect)(() => {
    function handleMaxShapes({ name, count }) {
      addToast({
        title: "Maximum Shapes Reached",
        description: `You've reached the maximum number of shapes allowed on ${name} (${count}). Please delete some shapes or move to a different page to continue.`,
        severity: "warning"
      });
    }
    editor.addListener("max-shapes", handleMaxShapes);
    return () => {
      editor.removeListener("max-shapes", handleMaxShapes);
    };
  }, [editor, addToast]);
}
//# sourceMappingURL=useEditorEvents.js.map
