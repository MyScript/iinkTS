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
var TLPointer_exports = {};
__export(TLPointer_exports, {
  PointerRecordType: () => PointerRecordType,
  TLPOINTER_ID: () => TLPOINTER_ID,
  pointerMigrations: () => pointerMigrations,
  pointerValidator: () => pointerValidator,
  pointerVersions: () => pointerVersions
});
module.exports = __toCommonJS(TLPointer_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
const pointerValidator = import_validate.T.model(
  "pointer",
  import_validate.T.object({
    typeName: import_validate.T.literal("pointer"),
    id: (0, import_id_validator.idValidator)("pointer"),
    x: import_validate.T.number,
    y: import_validate.T.number,
    lastActivityTimestamp: import_validate.T.number,
    meta: import_validate.T.jsonValue
  })
);
const pointerVersions = (0, import_store.createMigrationIds)("com.tldraw.pointer", {
  AddMeta: 1
});
const pointerMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.pointer",
  recordType: "pointer",
  sequence: [
    {
      id: pointerVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
const PointerRecordType = (0, import_store.createRecordType)("pointer", {
  validator: pointerValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    lastActivityTimestamp: 0,
    meta: {}
  })
);
const TLPOINTER_ID = PointerRecordType.createId("pointer");
//# sourceMappingURL=TLPointer.js.map
