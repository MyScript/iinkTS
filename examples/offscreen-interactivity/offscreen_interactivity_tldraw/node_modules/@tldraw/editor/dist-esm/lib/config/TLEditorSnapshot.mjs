import { TLINSTANCE_ID, pluckPreservingValues } from "@tldraw/tlschema";
import { WeakCache, filterEntries } from "@tldraw/utils";
import {
  createSessionStateSnapshotSignal,
  loadSessionStateSnapshotIntoStore
} from "./TLSessionStateSnapshot.mjs";
function loadSnapshot(store, _snapshot, opts) {
  let snapshot = {};
  if ("store" in _snapshot) {
    const migrationResult = store.schema.migrateStoreSnapshot(_snapshot);
    if (migrationResult.type !== "success") {
      throw new Error("Failed to migrate store snapshot: " + migrationResult.reason);
    }
    snapshot.document = {
      schema: store.schema.serialize(),
      store: filterEntries(
        migrationResult.value,
        (_, { typeName }) => store.scopedTypes.document.has(typeName)
      )
    };
  } else {
    snapshot = _snapshot;
  }
  const preservingInstanceState = pluckPreservingValues(store.get(TLINSTANCE_ID));
  const preservingSessionState = sessionStateCache.get(store, createSessionStateSnapshotSignal).get();
  store.atomic(() => {
    if (snapshot.document) {
      store.loadStoreSnapshot(snapshot.document);
    }
    if (preservingInstanceState) {
      store.update(TLINSTANCE_ID, (r) => ({ ...r, ...preservingInstanceState }));
    }
    if (preservingSessionState) {
      loadSessionStateSnapshotIntoStore(store, preservingSessionState);
    }
    if (snapshot.session) {
      loadSessionStateSnapshotIntoStore(store, snapshot.session, {
        forceOverwrite: opts?.forceOverwriteSessionState
      });
    }
  });
}
const sessionStateCache = new WeakCache();
function getSnapshot(store) {
  const sessionState$ = sessionStateCache.get(store, createSessionStateSnapshotSignal);
  const session = sessionState$.get();
  if (!session) {
    throw new Error("Session state is not ready yet");
  }
  return {
    document: store.getStoreSnapshot(),
    session
  };
}
export {
  getSnapshot,
  loadSnapshot
};
//# sourceMappingURL=TLEditorSnapshot.mjs.map
