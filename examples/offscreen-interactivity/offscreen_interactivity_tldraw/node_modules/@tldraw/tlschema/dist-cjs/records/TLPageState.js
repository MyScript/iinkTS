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
var TLPageState_exports = {};
__export(TLPageState_exports, {
  InstancePageStateRecordType: () => InstancePageStateRecordType,
  instancePageStateMigrations: () => instancePageStateMigrations,
  instancePageStateValidator: () => instancePageStateValidator,
  instancePageStateVersions: () => instancePageStateVersions
});
module.exports = __toCommonJS(TLPageState_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
var import_TLBaseShape = require("../shapes/TLBaseShape");
var import_TLPage = require("./TLPage");
const instancePageStateValidator = import_validate.T.model(
  "instance_page_state",
  import_validate.T.object({
    typeName: import_validate.T.literal("instance_page_state"),
    id: (0, import_id_validator.idValidator)("instance_page_state"),
    pageId: import_TLPage.pageIdValidator,
    selectedShapeIds: import_validate.T.arrayOf(import_TLBaseShape.shapeIdValidator),
    hintingShapeIds: import_validate.T.arrayOf(import_TLBaseShape.shapeIdValidator),
    erasingShapeIds: import_validate.T.arrayOf(import_TLBaseShape.shapeIdValidator),
    hoveredShapeId: import_TLBaseShape.shapeIdValidator.nullable(),
    editingShapeId: import_TLBaseShape.shapeIdValidator.nullable(),
    croppingShapeId: import_TLBaseShape.shapeIdValidator.nullable(),
    focusedGroupId: import_TLBaseShape.shapeIdValidator.nullable(),
    meta: import_validate.T.jsonValue
  })
);
const instancePageStateVersions = (0, import_store.createMigrationIds)("com.tldraw.instance_page_state", {
  AddCroppingId: 1,
  RemoveInstanceIdAndCameraId: 2,
  AddMeta: 3,
  RenameProperties: 4,
  RenamePropertiesAgain: 5
});
const instancePageStateMigrations = (0, import_store.createRecordMigrationSequence)({
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
const InstancePageStateRecordType = (0, import_store.createRecordType)(
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
//# sourceMappingURL=TLPageState.js.map
