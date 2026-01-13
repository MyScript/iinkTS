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
var TLPage_exports = {};
__export(TLPage_exports, {
  PageRecordType: () => PageRecordType,
  isPageId: () => isPageId,
  pageIdValidator: () => pageIdValidator,
  pageMigrations: () => pageMigrations,
  pageValidator: () => pageValidator,
  pageVersions: () => pageVersions
});
module.exports = __toCommonJS(TLPage_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
const pageIdValidator = (0, import_id_validator.idValidator)("page");
const pageValidator = import_validate.T.model(
  "page",
  import_validate.T.object({
    typeName: import_validate.T.literal("page"),
    id: pageIdValidator,
    name: import_validate.T.string,
    index: import_validate.T.indexKey,
    meta: import_validate.T.jsonValue
  })
);
const pageVersions = (0, import_store.createMigrationIds)("com.tldraw.page", {
  AddMeta: 1
});
const pageMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.page",
  recordType: "page",
  sequence: [
    {
      id: pageVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
const PageRecordType = (0, import_store.createRecordType)("page", {
  validator: pageValidator,
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));
function isPageId(id) {
  return PageRecordType.isId(id);
}
//# sourceMappingURL=TLPage.js.map
