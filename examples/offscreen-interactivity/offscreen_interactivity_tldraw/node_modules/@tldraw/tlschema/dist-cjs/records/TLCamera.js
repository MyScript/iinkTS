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
var TLCamera_exports = {};
__export(TLCamera_exports, {
  CameraRecordType: () => CameraRecordType,
  cameraMigrations: () => cameraMigrations,
  cameraValidator: () => cameraValidator,
  cameraVersions: () => cameraVersions
});
module.exports = __toCommonJS(TLCamera_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
const cameraValidator = import_validate.T.model(
  "camera",
  import_validate.T.object({
    typeName: import_validate.T.literal("camera"),
    id: (0, import_id_validator.idValidator)("camera"),
    x: import_validate.T.number,
    y: import_validate.T.number,
    z: import_validate.T.number,
    meta: import_validate.T.jsonValue
  })
);
const cameraVersions = (0, import_store.createMigrationIds)("com.tldraw.camera", {
  AddMeta: 1
});
const cameraMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.camera",
  recordType: "camera",
  sequence: [
    {
      id: cameraVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const CameraRecordType = (0, import_store.createRecordType)("camera", {
  validator: cameraValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    z: 1,
    meta: {}
  })
);
//# sourceMappingURL=TLCamera.js.map
