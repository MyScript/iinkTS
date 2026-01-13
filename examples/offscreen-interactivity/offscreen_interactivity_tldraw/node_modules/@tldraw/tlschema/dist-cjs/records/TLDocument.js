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
var TLDocument_exports = {};
__export(TLDocument_exports, {
  DocumentRecordType: () => DocumentRecordType,
  TLDOCUMENT_ID: () => TLDOCUMENT_ID,
  documentMigrations: () => documentMigrations,
  documentValidator: () => documentValidator,
  documentVersions: () => documentVersions,
  isDocument: () => isDocument
});
module.exports = __toCommonJS(TLDocument_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
const documentValidator = import_validate.T.model(
  "document",
  import_validate.T.object({
    typeName: import_validate.T.literal("document"),
    id: import_validate.T.literal("document:document"),
    gridSize: import_validate.T.number,
    name: import_validate.T.string,
    meta: import_validate.T.jsonValue
  })
);
function isDocument(record) {
  if (!record) return false;
  return record.typeName === "document";
}
const documentVersions = (0, import_store.createMigrationIds)("com.tldraw.document", {
  AddName: 1,
  AddMeta: 2
});
const documentMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.document",
  recordType: "document",
  sequence: [
    {
      id: documentVersions.AddName,
      up: (document) => {
        ;
        document.name = "";
      },
      down: (document) => {
        delete document.name;
      }
    },
    {
      id: documentVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const DocumentRecordType = (0, import_store.createRecordType)("document", {
  validator: documentValidator,
  scope: "document"
}).withDefaultProperties(
  () => ({
    gridSize: 10,
    name: "",
    meta: {}
  })
);
const TLDOCUMENT_ID = DocumentRecordType.createId("document");
//# sourceMappingURL=TLDocument.js.map
