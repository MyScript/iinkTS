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
var TLBookmarkAsset_exports = {};
__export(TLBookmarkAsset_exports, {
  bookmarkAssetMigrations: () => bookmarkAssetMigrations,
  bookmarkAssetValidator: () => bookmarkAssetValidator,
  bookmarkAssetVersions: () => Versions
});
module.exports = __toCommonJS(TLBookmarkAsset_exports);
var import_store = require("@tldraw/store");
var import_validate = require("@tldraw/validate");
var import_TLBaseAsset = require("./TLBaseAsset");
const bookmarkAssetValidator = (0, import_TLBaseAsset.createAssetValidator)(
  "bookmark",
  import_validate.T.object({
    title: import_validate.T.string,
    description: import_validate.T.string,
    image: import_validate.T.string,
    favicon: import_validate.T.string,
    src: import_validate.T.srcUrl.nullable()
  })
);
const Versions = (0, import_store.createMigrationIds)("com.tldraw.asset.bookmark", {
  MakeUrlsValid: 1,
  AddFavicon: 2
});
const bookmarkAssetMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.asset.bookmark",
  recordType: "asset",
  filter: (asset) => asset.type === "bookmark",
  sequence: [
    {
      id: Versions.MakeUrlsValid,
      up: (asset) => {
        if (!import_validate.T.srcUrl.isValid(asset.props.src)) {
          asset.props.src = "";
        }
      },
      down: (_asset) => {
      }
    },
    {
      id: Versions.AddFavicon,
      up: (asset) => {
        if (!import_validate.T.srcUrl.isValid(asset.props.favicon)) {
          asset.props.favicon = "";
        }
      },
      down: (asset) => {
        delete asset.props.favicon;
      }
    }
  ]
});
//# sourceMappingURL=TLBookmarkAsset.js.map
