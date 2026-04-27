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
var useLocalStore_exports = {};
__export(useLocalStore_exports, {
  useLocalStore: () => useLocalStore
});
module.exports = __toCommonJS(useLocalStore_exports);
var import_utils = require("@tldraw/utils");
var import_react = require("react");
var import_createTLStore = require("../config/createTLStore");
var import_TLLocalSyncClient = require("../utils/sync/TLLocalSyncClient");
var import_useIdentity = require("./useIdentity");
var import_useRefState = require("./useRefState");
function useLocalStore(options) {
  const [state, setState] = (0, import_useRefState.useRefState)({ status: "loading" });
  options = (0, import_useIdentity.useShallowObjectIdentity)(options);
  (0, import_react.useEffect)(() => {
    const { persistenceKey, sessionId, ...rest } = options;
    if (!persistenceKey) {
      setState({
        status: "not-synced",
        store: (0, import_createTLStore.createTLStore)(rest)
      });
      return;
    }
    setState({ status: "loading" });
    const objectURLCache = new import_utils.WeakCache();
    const assets = {
      upload: async (asset, file) => {
        await client.db.storeAsset(asset.id, file);
        return { src: asset.id };
      },
      resolve: async (asset) => {
        if (!asset.props.src) return null;
        if (asset.props.src.startsWith("asset:")) {
          return await objectURLCache.get(asset, async () => {
            const blob = await client.db.getAsset(asset.id);
            if (!blob) return null;
            return URL.createObjectURL(blob);
          });
        }
        return asset.props.src;
      },
      remove: async (assetIds) => {
        await client.db.removeAssets(assetIds);
      },
      ...rest.assets
    };
    const store = (0, import_createTLStore.createTLStore)({ ...rest, assets });
    let isClosed = false;
    const client = new import_TLLocalSyncClient.TLLocalSyncClient(store, {
      sessionId,
      persistenceKey,
      onLoad() {
        if (isClosed) return;
        setState({ store, status: "synced-local" });
      },
      onLoadError(err) {
        if (isClosed) return;
        setState({ status: "error", error: err });
      }
    });
    return () => {
      isClosed = true;
      client.close();
    };
  }, [options, setState]);
  return state;
}
//# sourceMappingURL=useLocalStore.js.map
