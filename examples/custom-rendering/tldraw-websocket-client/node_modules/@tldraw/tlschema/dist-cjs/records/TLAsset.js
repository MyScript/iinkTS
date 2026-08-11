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
var TLAsset_exports = {};
__export(TLAsset_exports, {
  AssetRecordType: () => AssetRecordType,
  assetMigrations: () => assetMigrations,
  assetValidator: () => assetValidator,
  assetVersions: () => assetVersions
});
module.exports = __toCommonJS(TLAsset_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_TLBookmarkAsset = require("../assets/TLBookmarkAsset");
var import_TLImageAsset = require("../assets/TLImageAsset");
var import_TLVideoAsset = require("../assets/TLVideoAsset");
const assetValidator = import_validate.T.model(
  "asset",
  import_validate.T.union("type", {
    image: import_TLImageAsset.imageAssetValidator,
    video: import_TLVideoAsset.videoAssetValidator,
    bookmark: import_TLBookmarkAsset.bookmarkAssetValidator
  })
);
const assetVersions = (0, import_store.createMigrationIds)("com.tldraw.asset", {
  AddMeta: 1
});
const assetMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.asset",
  recordType: "asset",
  sequence: [
    {
      id: assetVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const AssetRecordType = (0, import_store.createRecordType)("asset", {
  validator: assetValidator,
  scope: "document"
}).withDefaultProperties(() => ({
  meta: {}
}));
//# sourceMappingURL=TLAsset.js.map
