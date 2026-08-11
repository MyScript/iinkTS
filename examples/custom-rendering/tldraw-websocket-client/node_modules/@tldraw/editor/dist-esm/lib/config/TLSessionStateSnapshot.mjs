import { computed } from "@tldraw/state";
import {
  CameraRecordType,
  InstancePageStateRecordType,
  TLINSTANCE_ID,
  pageIdValidator,
  pluckPreservingValues,
  shapeIdValidator
} from "@tldraw/tlschema";
import {
  deleteFromSessionStorage,
  getFromSessionStorage,
  isEqual,
  setInSessionStorage,
  structuredClone,
  uniqueId
} from "@tldraw/utils";
import { T } from "@tldraw/validate";
import { tlenv } from "../globals/environment.mjs";
const tabIdKey = "TLDRAW_TAB_ID_v2";
const window = globalThis.window;
function iOS() {
  if (!window) return false;
  return ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    window.navigator.platform
  ) || // iPad on iOS 13 detection
  tlenv.isDarwin && "ontouchend" in document;
}
const TAB_ID = window ? window[tabIdKey] ?? getFromSessionStorage(tabIdKey) ?? `TLDRAW_INSTANCE_STATE_V1_` + uniqueId() : "<error>";
if (window) {
  window[tabIdKey] = TAB_ID;
  if (iOS()) {
    setInSessionStorage(tabIdKey, TAB_ID);
  } else {
    deleteFromSessionStorage(tabIdKey);
  }
}
window?.addEventListener("beforeunload", () => {
  setInSessionStorage(tabIdKey, TAB_ID);
});
const Versions = {
  Initial: 0
};
const CURRENT_SESSION_STATE_SNAPSHOT_VERSION = Math.max(...Object.values(Versions));
function migrate(snapshot) {
  if (snapshot.version < Versions.Initial) {
  }
  snapshot.version = CURRENT_SESSION_STATE_SNAPSHOT_VERSION;
}
const sessionStateSnapshotValidator = T.object({
  version: T.number,
  currentPageId: pageIdValidator.optional(),
  isFocusMode: T.boolean.optional(),
  exportBackground: T.boolean.optional(),
  isDebugMode: T.boolean.optional(),
  isToolLocked: T.boolean.optional(),
  isGridMode: T.boolean.optional(),
  pageStates: T.arrayOf(
    T.object({
      pageId: pageIdValidator,
      camera: T.object({
        x: T.number,
        y: T.number,
        z: T.number
      }).optional(),
      selectedShapeIds: T.arrayOf(shapeIdValidator).optional(),
      focusedGroupId: shapeIdValidator.nullable().optional()
    })
  ).optional()
});
function migrateAndValidateSessionStateSnapshot(state) {
  if (!state || typeof state !== "object") {
    console.warn("Invalid instance state");
    return null;
  }
  if (!("version" in state) || typeof state.version !== "number") {
    console.warn("No version in instance state");
    return null;
  }
  if (state.version !== CURRENT_SESSION_STATE_SNAPSHOT_VERSION) {
    state = structuredClone(state);
    migrate(state);
  }
  try {
    return sessionStateSnapshotValidator.validate(state);
  } catch (e) {
    console.warn(e);
    return null;
  }
}
function createSessionStateSnapshotSignal(store) {
  const $allPageIds = store.query.ids("page");
  return computed(
    "sessionStateSnapshot",
    () => {
      const instanceState = store.get(TLINSTANCE_ID);
      if (!instanceState) return null;
      const allPageIds = [...$allPageIds.get()];
      return {
        version: CURRENT_SESSION_STATE_SNAPSHOT_VERSION,
        currentPageId: instanceState.currentPageId,
        exportBackground: instanceState.exportBackground,
        isFocusMode: instanceState.isFocusMode,
        isDebugMode: instanceState.isDebugMode,
        isToolLocked: instanceState.isToolLocked,
        isGridMode: instanceState.isGridMode,
        pageStates: allPageIds.map((id) => {
          const ps = store.get(InstancePageStateRecordType.createId(id));
          const camera = store.get(CameraRecordType.createId(id));
          return {
            pageId: id,
            camera: {
              x: camera?.x ?? 0,
              y: camera?.y ?? 0,
              z: camera?.z ?? 1
            },
            selectedShapeIds: ps?.selectedShapeIds ?? [],
            focusedGroupId: ps?.focusedGroupId ?? null
          };
        })
      };
    },
    { isEqual }
  );
}
function loadSessionStateSnapshotIntoStore(store, snapshot, opts) {
  const res = migrateAndValidateSessionStateSnapshot(snapshot);
  if (!res) return;
  const preserved = pluckPreservingValues(store.get(TLINSTANCE_ID));
  const primary = opts?.forceOverwrite ? res : preserved;
  const secondary = opts?.forceOverwrite ? preserved : res;
  const instanceState = store.schema.types.instance.create({
    id: TLINSTANCE_ID,
    ...preserved,
    // the integrity checker will ensure that the currentPageId is valid
    currentPageId: res.currentPageId,
    isDebugMode: primary?.isDebugMode ?? secondary?.isDebugMode,
    isFocusMode: primary?.isFocusMode ?? secondary?.isFocusMode,
    isToolLocked: primary?.isToolLocked ?? secondary?.isToolLocked,
    isGridMode: primary?.isGridMode ?? secondary?.isGridMode,
    exportBackground: primary?.exportBackground ?? secondary?.exportBackground
  });
  store.atomic(() => {
    for (const ps of res.pageStates ?? []) {
      if (!store.has(ps.pageId)) continue;
      const cameraId = CameraRecordType.createId(ps.pageId);
      const instancePageState = InstancePageStateRecordType.createId(ps.pageId);
      const previousCamera = store.get(cameraId);
      const previousInstanceState = store.get(instancePageState);
      store.put([
        CameraRecordType.create({
          id: cameraId,
          x: ps.camera?.x ?? previousCamera?.x,
          y: ps.camera?.y ?? previousCamera?.y,
          z: ps.camera?.z ?? previousCamera?.z
        }),
        InstancePageStateRecordType.create({
          id: instancePageState,
          pageId: ps.pageId,
          selectedShapeIds: ps.selectedShapeIds ?? previousInstanceState?.selectedShapeIds,
          focusedGroupId: ps.focusedGroupId ?? previousInstanceState?.focusedGroupId
        })
      ]);
    }
    store.put([instanceState]);
    store.ensureStoreIsUsable();
  });
}
function extractSessionStateFromLegacySnapshot(store) {
  const instanceRecords = [];
  for (const record of Object.values(store)) {
    if (record.typeName?.match(/^(instance.*|pointer|camera)$/)) {
      instanceRecords.push(record);
    }
  }
  const oldInstance = instanceRecords.filter(
    (r) => r.typeName === "instance" && r.id !== TLINSTANCE_ID
  )[0];
  if (!oldInstance) return null;
  const result = {
    version: CURRENT_SESSION_STATE_SNAPSHOT_VERSION,
    currentPageId: oldInstance.currentPageId,
    exportBackground: !!oldInstance.exportBackground,
    isFocusMode: !!oldInstance.isFocusMode,
    isDebugMode: !!oldInstance.isDebugMode,
    isToolLocked: !!oldInstance.isToolLocked,
    isGridMode: false,
    pageStates: instanceRecords.filter((r) => r.typeName === "instance_page_state" && r.instanceId === oldInstance.id).map((ps) => {
      const camera = store[ps.cameraId] ?? { x: 0, y: 0, z: 1 };
      return {
        pageId: ps.pageId,
        camera: {
          x: camera.x,
          y: camera.y,
          z: camera.z
        },
        selectedShapeIds: ps.selectedShapeIds,
        focusedGroupId: ps.focusedGroupId
      };
    })
  };
  try {
    sessionStateSnapshotValidator.validate(result);
    return result;
  } catch {
    return null;
  }
}
export {
  TAB_ID,
  createSessionStateSnapshotSignal,
  extractSessionStateFromLegacySnapshot,
  loadSessionStateSnapshotIntoStore
};
//# sourceMappingURL=TLSessionStateSnapshot.mjs.map
