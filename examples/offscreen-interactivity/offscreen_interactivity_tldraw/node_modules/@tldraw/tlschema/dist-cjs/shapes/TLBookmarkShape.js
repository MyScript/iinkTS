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
var TLBookmarkShape_exports = {};
__export(TLBookmarkShape_exports, {
  bookmarkShapeMigrations: () => bookmarkShapeMigrations,
  bookmarkShapeProps: () => bookmarkShapeProps,
  bookmarkShapeVersions: () => Versions
});
module.exports = __toCommonJS(TLBookmarkShape_exports);
var import_validate = require("@tldraw/validate");
var import_TLBaseAsset = require("../assets/TLBaseAsset");
var import_TLShape = require("../records/TLShape");
const bookmarkShapeProps = {
  w: import_validate.T.nonZeroNumber,
  h: import_validate.T.nonZeroNumber,
  assetId: import_TLBaseAsset.assetIdValidator.nullable(),
  url: import_validate.T.linkUrl
};
const Versions = (0, import_TLShape.createShapePropsMigrationIds)("bookmark", {
  NullAssetId: 1,
  MakeUrlsValid: 2
});
const bookmarkShapeMigrations = (0, import_TLShape.createShapePropsMigrationSequence)({
  sequence: [
    {
      id: Versions.NullAssetId,
      up: (props) => {
        if (props.assetId === void 0) {
          props.assetId = null;
        }
      },
      down: "retired"
    },
    {
      id: Versions.MakeUrlsValid,
      up: (props) => {
        if (!import_validate.T.linkUrl.isValid(props.url)) {
          props.url = "";
        }
      },
      down: (_props) => {
      }
    }
  ]
});
//# sourceMappingURL=TLBookmarkShape.js.map
