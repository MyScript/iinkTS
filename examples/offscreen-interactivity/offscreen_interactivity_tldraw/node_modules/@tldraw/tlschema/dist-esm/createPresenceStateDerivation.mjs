import { computed } from "@tldraw/state";
import { CameraRecordType } from "./records/TLCamera.mjs";
import { TLINSTANCE_ID } from "./records/TLInstance.mjs";
import { InstancePageStateRecordType } from "./records/TLPageState.mjs";
import { TLPOINTER_ID } from "./records/TLPointer.mjs";
import { InstancePresenceRecordType } from "./records/TLPresence.mjs";
function createPresenceStateDerivation($user, instanceId) {
  return (store) => {
    return computed("instancePresence", () => {
      const user = $user.get();
      if (!user) return null;
      const state = getDefaultUserPresence(store, user);
      if (!state) return null;
      return InstancePresenceRecordType.create({
        ...state,
        id: instanceId ?? InstancePresenceRecordType.createId(store.id)
      });
    });
  };
}
function getDefaultUserPresence(store, user) {
  const instance = store.get(TLINSTANCE_ID);
  const pageState = store.get(InstancePageStateRecordType.createId(instance?.currentPageId));
  const camera = store.get(CameraRecordType.createId(instance?.currentPageId));
  const pointer = store.get(TLPOINTER_ID);
  if (!pageState || !instance || !camera || !pointer) {
    return null;
  }
  return {
    selectedShapeIds: pageState.selectedShapeIds,
    brush: instance.brush,
    scribbles: instance.scribbles,
    userId: user.id,
    userName: user.name ?? "",
    followingUserId: instance.followingUserId,
    camera: {
      x: camera.x,
      y: camera.y,
      z: camera.z
    },
    color: user.color ?? "#FF0000",
    currentPageId: instance.currentPageId,
    cursor: {
      x: pointer.x,
      y: pointer.y,
      rotation: instance.cursor.rotation,
      type: instance.cursor.type
    },
    lastActivityTimestamp: pointer.lastActivityTimestamp,
    screenBounds: instance.screenBounds,
    chatMessage: instance.chatMessage,
    meta: {}
  };
}
export {
  createPresenceStateDerivation,
  getDefaultUserPresence
};
//# sourceMappingURL=createPresenceStateDerivation.mjs.map
