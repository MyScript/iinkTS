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
var createTLStore_exports = {};
__export(createTLStore_exports, {
  createTLSchemaFromUtils: () => createTLSchemaFromUtils,
  createTLStore: () => createTLStore,
  inlineBase64AssetStore: () => inlineBase64AssetStore
});
module.exports = __toCommonJS(createTLStore_exports);
var import_store = require("@tldraw/store");
var import_tlschema = require("@tldraw/tlschema");
var import_utils = require("@tldraw/utils");
var import_Editor = require("../editor/Editor");
var import_TLEditorSnapshot = require("./TLEditorSnapshot");
var import_defaultBindings = require("./defaultBindings");
var import_defaultShapes = require("./defaultShapes");
const defaultAssetResolve = (asset) => asset.props.src;
const inlineBase64AssetStore = {
  upload: async (_, file) => {
    return { src: await import_utils.FileHelpers.blobToDataUrl(file) };
  }
};
function createTLSchemaFromUtils(opts) {
  if ("schema" in opts && opts.schema) return opts.schema;
  return (0, import_tlschema.createTLSchema)({
    shapes: "shapeUtils" in opts && opts.shapeUtils ? utilsToMap((0, import_defaultShapes.checkShapesAndAddCore)(opts.shapeUtils)) : void 0,
    bindings: "bindingUtils" in opts && opts.bindingUtils ? utilsToMap((0, import_defaultBindings.checkBindings)(opts.bindingUtils)) : void 0,
    migrations: "migrations" in opts ? opts.migrations : void 0
  });
}
function createTLStore({
  initialData,
  defaultName = "",
  id,
  assets = inlineBase64AssetStore,
  onMount,
  collaboration,
  ...rest
} = {}) {
  const schema = createTLSchemaFromUtils(rest);
  const store = new import_store.Store({
    id,
    schema,
    initialData,
    props: {
      defaultName,
      assets: {
        upload: assets.upload,
        resolve: assets.resolve ?? defaultAssetResolve,
        remove: assets.remove ?? (() => Promise.resolve())
      },
      onMount: (editor) => {
        (0, import_utils.assert)(editor instanceof import_Editor.Editor);
        onMount?.(editor);
      },
      collaboration
    }
  });
  if (rest.snapshot) {
    if (initialData) throw new Error("Cannot provide both initialData and snapshot");
    (0, import_TLEditorSnapshot.loadSnapshot)(store, rest.snapshot, { forceOverwriteSessionState: true });
  }
  return store;
}
function utilsToMap(utils) {
  return Object.fromEntries(
    utils.map((s) => [
      s.type,
      {
        props: s.props,
        migrations: s.migrations
      }
    ])
  );
}
//# sourceMappingURL=createTLStore.js.map
