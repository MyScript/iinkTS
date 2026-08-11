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
var TLSessionStateSnapshot_exports = {};
__export(TLSessionStateSnapshot_exports, {
  TAB_ID: () => TAB_ID,
  createSessionStateSnapshotSignal: () => createSessionStateSnapshotSignal,
  extractSessionStateFromLegacySnapshot: () => extractSessionStateFromLegacySnapshot,
  loadSessionStateSnapshotIntoStore: () => loadSessionStateSnapshotIntoStore
});
module.exports = __toCommonJS(TLSessionStateSnapshot_exports);
var import_state = require("@tldraw/state");
var import_tlschema = require("@tldraw/tlschema");
var import_utils = require("@tldraw/utils");
var import_validate = require("@tldraw/validate");
var import_environment = require("../globals/environment");
const tabIdKey = "TLDRAW_TAB_ID_v2";
const window = globalThis.window;
function iOS() {
  if (!window) return false;
  return ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    window.navigator.platform
  ) || // iPad on iOS 13 detection
  import_environment.tlenv.isDarwin && "ontouchend" in document;
}
const TAB_ID = window ? window[tabIdKey] ?? (0, import_utils.getFromSessionStorage)(tabIdKey) ?? `TLDRAW_INSTANCE_STATE_V1_` + (0, import_utils.uniqueId)() : "<error>";
if (window) {
  window[tabIdKey] = TAB_ID;
  if (iOS()) {
    (0, import_utils.setInSessionStorage)(tabIdKey, TAB_ID);
  } else {
    (0, import_utils.deleteFromSessionStorage)(tabIdKey);
  }
}
window?.addEventListener("beforeunload", () => {
  (0, import_utils.setInSessionStorage)(tabIdKey, TAB_ID);
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
const sessionStateSnapshotValidator = import_validate.T.object({
  version: import_validate.T.number,
  currentPageId: import_tlschema.pageIdValidator.optional(),
  isFocusMode: import_validate.T.boolean.optional(),
  exportBackground: import_validate.T.boolean.optional(),
  isDebugMode: import_validate.T.boolean.optional(),
  isToolLocked: import_validate.T.boolean.optional(),
  isGridMode: import_validate.T.boolean.optional(),
  pageStates: import_validate.T.arrayOf(
    import_validate.T.object({
      pageId: import_tlschema.pageIdValidator,
      camera: import_validate.T.object({
        x: import_validate.T.number,
        y: import_validate.T.number,
        z: import_validate.T.number
      }).optional(),
      selectedShapeIds: import_validate.T.arrayOf(import_tlschema.shapeIdValidator).optional(),
      focusedGroupId: import_tlschema.shapeIdValidator.nullable().optional()
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
    state = (0, import_utils.structuredClone)(state);
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
  return (0, import_state.computed)(
    "sessionStateSnapshot",
    () => {
      const instanceState = store.get(import_tlschema.TLINSTANCE_ID);
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
          const ps = store.get(import_tlschema.InstancePageStateRecordType.createId(id));
          const camera = store.get(import_tlschema.CameraRecordType.createId(id));
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
    { isEqual: import_utils.isEqual }
  );
}
function loadSessionStateSnapshotIntoStore(store, snapshot, opts) {
  const res = migrateAndValidateSessionStateSnapshot(snapshot);
  if (!res) return;
  const preserved = (0, import_tlschema.pluckPreservingValues)(store.get(import_tlschema.TLINSTANCE_ID));
  const primary = opts?.forceOverwrite ? res : preserved;
  const secondary = opts?.forceOverwrite ? preserved : res;
  const instanceState = store.schema.types.instance.create({
    id: import_tlschema.TLINSTANCE_ID,
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
      const cameraId = import_tlschema.CameraRecordType.createId(ps.pageId);
      const instancePageState = import_tlschema.InstancePageStateRecordType.createId(ps.pageId);
      const previousCamera = store.get(cameraId);
      const previousInstanceState = store.get(instancePageState);
      store.put([
        import_tlschema.CameraRecordType.create({
          id: cameraId,
          x: ps.camera?.x ?? previousCamera?.x,
          y: ps.camera?.y ?? previousCamera?.y,
          z: ps.camera?.z ?? previousCamera?.z
        }),
        import_tlschema.InstancePageStateRecordType.create({
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
    (r) => r.typeName === "instance" && r.id !== import_tlschema.TLINSTANCE_ID
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
//# sourceMappingURL=TLSessionStateSnapshot.js.map
