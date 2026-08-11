import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { boxModelValidator } from "../misc/geometry-types.mjs";
import { idValidator } from "../misc/id-validator.mjs";
import { cursorTypeValidator } from "../misc/TLCursor.mjs";
import { scribbleValidator } from "../misc/TLScribble.mjs";
const instancePresenceValidator = T.model(
  "instance_presence",
  T.object({
    typeName: T.literal("instance_presence"),
    id: idValidator("instance_presence"),
    userId: T.string,
    userName: T.string,
    lastActivityTimestamp: T.number.nullable(),
    followingUserId: T.string.nullable(),
    cursor: T.object({
      x: T.number,
      y: T.number,
      type: cursorTypeValidator,
      rotation: T.number
    }).nullable(),
    color: T.string,
    camera: T.object({
      x: T.number,
      y: T.number,
      z: T.number
    }).nullable(),
    screenBounds: boxModelValidator.nullable(),
    selectedShapeIds: T.arrayOf(idValidator("shape")),
    currentPageId: idValidator("page"),
    brush: boxModelValidator.nullable(),
    scribbles: T.arrayOf(scribbleValidator),
    chatMessage: T.string,
    meta: T.jsonValue
  })
);
const instancePresenceVersions = createMigrationIds("com.tldraw.instance_presence", {
  AddScribbleDelay: 1,
  RemoveInstanceId: 2,
  AddChatMessage: 3,
  AddMeta: 4,
  RenameSelectedShapeIds: 5,
  NullableCameraCursor: 6
});
const instancePresenceMigrations = createRecordMigrationSequence({
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
const InstancePresenceRecordType = createRecordType(
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
export {
  InstancePresenceRecordType,
  instancePresenceMigrations,
  instancePresenceValidator,
  instancePresenceVersions
};
//# sourceMappingURL=TLPresence.mjs.map
