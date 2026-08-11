import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
import { shapeIdValidator } from "../shapes/TLBaseShape.mjs";
import { pageIdValidator } from "./TLPage.mjs";
const instancePageStateValidator = T.model(
  "instance_page_state",
  T.object({
    typeName: T.literal("instance_page_state"),
    id: idValidator("instance_page_state"),
    pageId: pageIdValidator,
    selectedShapeIds: T.arrayOf(shapeIdValidator),
    hintingShapeIds: T.arrayOf(shapeIdValidator),
    erasingShapeIds: T.arrayOf(shapeIdValidator),
    hoveredShapeId: shapeIdValidator.nullable(),
    editingShapeId: shapeIdValidator.nullable(),
    croppingShapeId: shapeIdValidator.nullable(),
    focusedGroupId: shapeIdValidator.nullable(),
    meta: T.jsonValue
  })
);
const instancePageStateVersions = createMigrationIds("com.tldraw.instance_page_state", {
  AddCroppingId: 1,
  RemoveInstanceIdAndCameraId: 2,
  AddMeta: 3,
  RenameProperties: 4,
  RenamePropertiesAgain: 5
});
const instancePageStateMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.instance_page_state",
  recordType: "instance_page_state",
  sequence: [
    {
      id: instancePageStateVersions.AddCroppingId,
      up(instance) {
        instance.croppingShapeId = null;
      }
    },
    {
      id: instancePageStateVersions.RemoveInstanceIdAndCameraId,
      up(instance) {
        delete instance.instanceId;
        delete instance.cameraId;
      }
    },
    {
      id: instancePageStateVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: instancePageStateVersions.RenameProperties,
      // this migration is cursed: it was written wrong and doesn't do anything.
      // rather than replace it, I've added another migration below that fixes it.
      up: (_record) => {
      },
      down: (_record) => {
      }
    },
    {
      id: instancePageStateVersions.RenamePropertiesAgain,
      up: (record) => {
        record.selectedShapeIds = record.selectedIds;
        delete record.selectedIds;
        record.hintingShapeIds = record.hintingIds;
        delete record.hintingIds;
        record.erasingShapeIds = record.erasingIds;
        delete record.erasingIds;
        record.hoveredShapeId = record.hoveredId;
        delete record.hoveredId;
        record.editingShapeId = record.editingId;
        delete record.editingId;
        record.croppingShapeId = record.croppingShapeId ?? record.croppingId ?? null;
        delete record.croppingId;
        record.focusedGroupId = record.focusLayerId;
        delete record.focusLayerId;
      },
      down: (record) => {
        record.selectedIds = record.selectedShapeIds;
        delete record.selectedShapeIds;
        record.hintingIds = record.hintingShapeIds;
        delete record.hintingShapeIds;
        record.erasingIds = record.erasingShapeIds;
        delete record.erasingShapeIds;
        record.hoveredId = record.hoveredShapeId;
        delete record.hoveredShapeId;
        record.editingId = record.editingShapeId;
        delete record.editingShapeId;
        record.croppingId = record.croppingShapeId;
        delete record.croppingShapeId;
        record.focusLayerId = record.focusedGroupId;
        delete record.focusedGroupId;
      }
    }
  ]
});
const InstancePageStateRecordType = createRecordType(
  "instance_page_state",
  {
    validator: instancePageStateValidator,
    scope: "session",
    ephemeralKeys: {
      pageId: false,
      selectedShapeIds: false,
      editingShapeId: false,
      croppingShapeId: false,
      meta: false,
      hintingShapeIds: true,
      erasingShapeIds: true,
      hoveredShapeId: true,
      focusedGroupId: true
    }
  }
).withDefaultProperties(
  () => ({
    editingShapeId: null,
    croppingShapeId: null,
    selectedShapeIds: [],
    hoveredShapeId: null,
    erasingShapeIds: [],
    hintingShapeIds: [],
    focusedGroupId: null,
    meta: {}
  })
);
export {
  InstancePageStateRecordType,
  instancePageStateMigrations,
  instancePageStateValidator,
  instancePageStateVersions
};
//# sourceMappingURL=TLPageState.mjs.map
