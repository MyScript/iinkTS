import { Store } from "@tldraw/store";
import {
  createTLSchema
} from "@tldraw/tlschema";
import { FileHelpers, assert } from "@tldraw/utils";
import { Editor } from "../editor/Editor.mjs";
import { loadSnapshot } from "./TLEditorSnapshot.mjs";
import { checkBindings } from "./defaultBindings.mjs";
import { checkShapesAndAddCore } from "./defaultShapes.mjs";
const defaultAssetResolve = (asset) => asset.props.src;
const inlineBase64AssetStore = {
  upload: async (_, file) => {
    return { src: await FileHelpers.blobToDataUrl(file) };
  }
};
function createTLSchemaFromUtils(opts) {
  if ("schema" in opts && opts.schema) return opts.schema;
  return createTLSchema({
    shapes: "shapeUtils" in opts && opts.shapeUtils ? utilsToMap(checkShapesAndAddCore(opts.shapeUtils)) : void 0,
    bindings: "bindingUtils" in opts && opts.bindingUtils ? utilsToMap(checkBindings(opts.bindingUtils)) : void 0,
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
  const store = new Store({
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
        assert(editor instanceof Editor);
        onMount?.(editor);
      },
      collaboration
    }
  });
  if (rest.snapshot) {
    if (initialData) throw new Error("Cannot provide both initialData and snapshot");
    loadSnapshot(store, rest.snapshot, { forceOverwriteSessionState: true });
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
export {
  createTLSchemaFromUtils,
  createTLStore,
  inlineBase64AssetStore
};
//# sourceMappingURL=createTLStore.mjs.map
