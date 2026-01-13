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
var createPresenceStateDerivation_exports = {};
__export(createPresenceStateDerivation_exports, {
  createPresenceStateDerivation: () => createPresenceStateDerivation,
  getDefaultUserPresence: () => getDefaultUserPresence
});
module.exports = __toCommonJS(createPresenceStateDerivation_exports);
var import_state = require("@tldraw/state");
var import_TLCamera = require("./records/TLCamera");
var import_TLInstance = require("./records/TLInstance");
var import_TLPageState = require("./records/TLPageState");
var import_TLPointer = require("./records/TLPointer");
var import_TLPresence = require("./records/TLPresence");
function createPresenceStateDerivation($user, instanceId) {
  return (store) => {
    return (0, import_state.computed)("instancePresence", () => {
      const user = $user.get();
      if (!user) return null;
      const state = getDefaultUserPresence(store, user);
      if (!state) return null;
      return import_TLPresence.InstancePresenceRecordType.create({
        ...state,
        id: instanceId ?? import_TLPresence.InstancePresenceRecordType.createId(store.id)
      });
    });
  };
}
function getDefaultUserPresence(store, user) {
  const instance = store.get(import_TLInstance.TLINSTANCE_ID);
  const pageState = store.get(import_TLPageState.InstancePageStateRecordType.createId(instance?.currentPageId));
  const camera = store.get(import_TLCamera.CameraRecordType.createId(instance?.currentPageId));
  const pointer = store.get(import_TLPointer.TLPOINTER_ID);
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
//# sourceMappingURL=createPresenceStateDerivation.js.map
