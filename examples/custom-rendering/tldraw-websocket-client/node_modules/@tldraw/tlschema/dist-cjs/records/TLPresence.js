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
var TLPresence_exports = {};
__export(TLPresence_exports, {
  InstancePresenceRecordType: () => InstancePresenceRecordType,
  instancePresenceMigrations: () => instancePresenceMigrations,
  instancePresenceValidator: () => instancePresenceValidator,
  instancePresenceVersions: () => instancePresenceVersions
});
module.exports = __toCommonJS(TLPresence_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_geometry_types = require("../misc/geometry-types");
var import_id_validator = require("../misc/id-validator");
var import_TLCursor = require("../misc/TLCursor");
var import_TLScribble = require("../misc/TLScribble");
const instancePresenceValidator = import_validate.T.model(
  "instance_presence",
  import_validate.T.object({
    typeName: import_validate.T.literal("instance_presence"),
    id: (0, import_id_validator.idValidator)("instance_presence"),
    userId: import_validate.T.string,
    userName: import_validate.T.string,
    lastActivityTimestamp: import_validate.T.number.nullable(),
    followingUserId: import_validate.T.string.nullable(),
    cursor: import_validate.T.object({
      x: import_validate.T.number,
      y: import_validate.T.number,
      type: import_TLCursor.cursorTypeValidator,
      rotation: import_validate.T.number
    }).nullable(),
    color: import_validate.T.string,
    camera: import_validate.T.object({
      x: import_validate.T.number,
      y: import_validate.T.number,
      z: import_validate.T.number
    }).nullable(),
    screenBounds: import_geometry_types.boxModelValidator.nullable(),
    selectedShapeIds: import_validate.T.arrayOf((0, import_id_validator.idValidator)("shape")),
    currentPageId: (0, import_id_validator.idValidator)("page"),
    brush: import_geometry_types.boxModelValidator.nullable(),
    scribbles: import_validate.T.arrayOf(import_TLScribble.scribbleValidator),
    chatMessage: import_validate.T.string,
    meta: import_validate.T.jsonValue
  })
);
const instancePresenceVersions = (0, import_store.createMigrationIds)("com.tldraw.instance_presence", {
  AddScribbleDelay: 1,
  RemoveInstanceId: 2,
  AddChatMessage: 3,
  AddMeta: 4,
  RenameSelectedShapeIds: 5,
  NullableCameraCursor: 6
});
const instancePresenceMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.instance_presence",
  recordType: "instance_presence",
  sequence: [
    {
      id: instancePresenceVersions.AddScribbleDelay,
      up: (instance) => {
        if (instance.scribble !== null) {
          instance.scribble.delay = 0;
        }
      }
    },
    {
      id: instancePresenceVersions.RemoveInstanceId,
      up: (instance) => {
        delete instance.instanceId;
      }
    },
    {
      id: instancePresenceVersions.AddChatMessage,
      up: (instance) => {
        instance.chatMessage = "";
      }
    },
    {
      id: instancePresenceVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: instancePresenceVersions.RenameSelectedShapeIds,
      up: (_record) => {
      }
    },
    {
      id: instancePresenceVersions.NullableCameraCursor,
      up: (_record) => {
      },
      down: (record) => {
        if (record.camera === null) {
          record.camera = { x: 0, y: 0, z: 1 };
        }
        if (record.lastActivityTimestamp === null) {
          record.lastActivityTimestamp = 0;
        }
        if (record.cursor === null) {
          record.cursor = { type: "default", x: 0, y: 0, rotation: 0 };
        }
        if (record.screenBounds === null) {
          record.screenBounds = { x: 0, y: 0, w: 1, h: 1 };
        }
      }
    }
  ]
});
const InstancePresenceRecordType = (0, import_store.createRecordType)(
  "instance_presence",
  {
    validator: instancePresenceValidator,
    scope: "presence"
  }
).withDefaultProperties(() => ({
  lastActivityTimestamp: null,
  followingUserId: null,
  color: "#FF0000",
  camera: null,
  cursor: null,
  screenBounds: null,
  selectedShapeIds: [],
  brush: null,
  scribbles: [],
  chatMessage: "",
  meta: {}
}));
//# sourceMappingURL=TLPresence.js.map
