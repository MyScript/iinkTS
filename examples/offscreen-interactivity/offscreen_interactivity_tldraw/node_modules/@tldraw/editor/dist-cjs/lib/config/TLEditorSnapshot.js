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
var TLEditorSnapshot_exports = {};
__export(TLEditorSnapshot_exports, {
  getSnapshot: () => getSnapshot,
  loadSnapshot: () => loadSnapshot
});
module.exports = __toCommonJS(TLEditorSnapshot_exports);
var import_tlschema = require("@tldraw/tlschema");
var import_utils = require("@tldraw/utils");
var import_TLSessionStateSnapshot = require("./TLSessionStateSnapshot");
function loadSnapshot(store, _snapshot, opts) {
  let snapshot = {};
  if ("store" in _snapshot) {
    const migrationResult = store.schema.migrateStoreSnapshot(_snapshot);
    if (migrationResult.type !== "success") {
      throw new Error("Failed to migrate store snapshot: " + migrationResult.reason);
    }
    snapshot.document = {
      schema: store.schema.serialize(),
      store: (0, import_utils.filterEntries)(
        migrationResult.value,
        (_, { typeName }) => store.scopedTypes.document.has(typeName)
      )
    };
  } else {
    snapshot = _snapshot;
  }
  const preservingInstanceState = (0, import_tlschema.pluckPreservingValues)(store.get(import_tlschema.TLINSTANCE_ID));
  const preservingSessionState = sessionStateCache.get(store, import_TLSessionStateSnapshot.createSessionStateSnapshotSignal).get();
  store.atomic(() => {
    if (snapshot.document) {
      store.loadStoreSnapshot(snapshot.document);
    }
    if (preservingInstanceState) {
      store.update(import_tlschema.TLINSTANCE_ID, (r) => ({ ...r, ...preservingInstanceState }));
    }
    if (preservingSessionState) {
      (0, import_TLSessionStateSnapshot.loadSessionStateSnapshotIntoStore)(store, preservingSessionState);
    }
    if (snapshot.session) {
      (0, import_TLSessionStateSnapshot.loadSessionStateSnapshotIntoStore)(store, snapshot.session, {
        forceOverwrite: opts?.forceOverwriteSessionState
      });
    }
  });
}
const sessionStateCache = new import_utils.WeakCache();
function getSnapshot(store) {
  const sessionState$ = sessionStateCache.get(store, import_TLSessionStateSnapshot.createSessionStateSnapshotSignal);
  const session = sessionState$.get();
  if (!session) {
    throw new Error("Session state is not ready yet");
  }
  return {
    document: store.getStoreSnapshot(),
    session
  };
}
//# sourceMappingURL=TLEditorSnapshot.js.map
