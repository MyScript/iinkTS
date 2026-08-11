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
var TLBinding_exports = {};
__export(TLBinding_exports, {
  createBindingId: () => createBindingId,
  createBindingPropsMigrationIds: () => createBindingPropsMigrationIds,
  createBindingPropsMigrationSequence: () => createBindingPropsMigrationSequence,
  createBindingRecordType: () => createBindingRecordType,
  isBinding: () => isBinding,
  isBindingId: () => isBindingId,
  rootBindingMigrations: () => rootBindingMigrations,
  rootBindingVersions: () => rootBindingVersions
});
module.exports = __toCommonJS(TLBinding_exports);
var import_store = require("@tldraw/store");
var import_utils = require("@tldraw/utils");
var import_validate = require("@tldraw/validate");
var import_TLBaseBinding = require("../bindings/TLBaseBinding");
const rootBindingVersions = (0, import_store.createMigrationIds)("com.tldraw.binding", {});
const rootBindingMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.binding",
  recordType: "binding",
  sequence: []
});
function isBinding(record) {
  if (!record) return false;
  return record.typeName === "binding";
}
function isBindingId(id) {
  if (!id) return false;
  return id.startsWith("binding:");
}
function createBindingId(id) {
  return `binding:${id ?? (0, import_utils.uniqueId)()}`;
}
function createBindingPropsMigrationSequence(migrations) {
  return migrations;
}
function createBindingPropsMigrationIds(bindingType, ids) {
  return (0, import_utils.mapObjectMapValues)(ids, (_k, v) => `com.tldraw.binding.${bindingType}/${v}`);
}
function createBindingRecordType(bindings) {
  return (0, import_store.createRecordType)("binding", {
    scope: "document",
    validator: import_validate.T.model(
      "binding",
      import_validate.T.union(
        "type",
        (0, import_utils.mapObjectMapValues)(
          bindings,
          (type, { props, meta }) => (0, import_TLBaseBinding.createBindingValidator)(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    meta: {}
  }));
}
//# sourceMappingURL=TLBinding.js.map
