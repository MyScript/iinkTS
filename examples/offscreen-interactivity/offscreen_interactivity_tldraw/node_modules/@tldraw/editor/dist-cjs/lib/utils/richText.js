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
var richText_exports = {};
__export(richText_exports, {
  getFontsFromRichText: () => getFontsFromRichText,
  getTipTapSchema: () => getTipTapSchema
});
module.exports = __toCommonJS(richText_exports);
var import_core = require("@tiptap/core");
var import_model = require("@tiptap/pm/model");
var import_utils = require("@tldraw/utils");
const schemaCache = new import_utils.WeakCache();
function getTipTapSchema(tipTapConfig) {
  return schemaCache.get(tipTapConfig, () => (0, import_core.getSchema)(tipTapConfig.extensions ?? []));
}
function getFontsFromRichText(editor, richText, initialState) {
  const { tipTapConfig, addFontsFromNode } = editor.getTextOptions();
  (0, import_utils.assert)(tipTapConfig, "textOptions.tipTapConfig must be set to use rich text");
  (0, import_utils.assert)(addFontsFromNode, "textOptions.addFontsFromNode must be set to use rich text");
  const schema = getTipTapSchema(tipTapConfig);
  const rootNode = import_model.Node.fromJSON(schema, richText);
  const fonts = /* @__PURE__ */ new Set();
  function addFont(font) {
    fonts.add(font);
  }
  function visit(node, state) {
    state = addFontsFromNode(node, state, addFont);
    for (const child of node.children) {
      visit(child, state);
    }
  }
  visit(rootNode, initialState);
  return Array.from(fonts);
}
//# sourceMappingURL=richText.js.map
