import { getSchema } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { assert, WeakCache } from "@tldraw/utils";
const schemaCache = new WeakCache();
function getTipTapSchema(tipTapConfig) {
  return schemaCache.get(tipTapConfig, () => getSchema(tipTapConfig.extensions ?? []));
}
function getFontsFromRichText(editor, richText, initialState) {
  const { tipTapConfig, addFontsFromNode } = editor.getTextOptions();
  assert(tipTapConfig, "textOptions.tipTapConfig must be set to use rich text");
  assert(addFontsFromNode, "textOptions.addFontsFromNode must be set to use rich text");
  const schema = getTipTapSchema(tipTapConfig);
  const rootNode = Node.fromJSON(schema, richText);
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
export {
  getFontsFromRichText,
  getTipTapSchema
};
//# sourceMappingURL=richText.mjs.map
