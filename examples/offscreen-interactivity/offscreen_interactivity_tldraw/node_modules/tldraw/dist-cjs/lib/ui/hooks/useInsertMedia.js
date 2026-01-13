"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useInsertMedia_exports = {};
__export(useInsertMedia_exports, {
  MimeTypeContext: () => MimeTypeContext,
  useInsertMedia: () => useInsertMedia
});
module.exports = __toCommonJS(useInsertMedia_exports);
var import_editor = require("@tldraw/editor");
var import_react = __toESM(require("react"));
const MimeTypeContext = import_react.default.createContext([]);
function useInsertMedia() {
  const editor = (0, import_editor.useEditor)();
  const inputRef = (0, import_react.useRef)();
  const mimeTypes = (0, import_editor.useShallowArrayIdentity)(import_react.default.useContext(MimeTypeContext));
  (0, import_react.useEffect)(() => {
    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = mimeTypes?.join(",") ?? import_editor.DEFAULT_SUPPORTED_MEDIA_TYPE_LIST;
    input.multiple = true;
    inputRef.current = input;
    async function onchange(e) {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      editor.markHistoryStoppingPoint("insert media");
      await editor.putExternalContent({
        type: "files",
        files: Array.from(fileList),
        point: editor.getViewportPageBounds().center,
        ignoreParent: false
      });
      input.value = "";
    }
    input.addEventListener("change", onchange);
    return () => {
      inputRef.current = void 0;
      input.removeEventListener("change", onchange);
    };
  }, [editor, mimeTypes]);
  return (0, import_react.useCallback)(() => {
    inputRef.current?.click();
  }, [inputRef]);
}
//# sourceMappingURL=useInsertMedia.js.map
