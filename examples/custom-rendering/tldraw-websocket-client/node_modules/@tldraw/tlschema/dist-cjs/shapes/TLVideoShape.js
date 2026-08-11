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
var TLVideoShape_exports = {};
__export(TLVideoShape_exports, {
  videoShapeMigrations: () => videoShapeMigrations,
  videoShapeProps: () => videoShapeProps,
  videoShapeVersions: () => Versions
});
module.exports = __toCommonJS(TLVideoShape_exports);
var import_validate = require("@tldraw/validate");
var import_TLBaseAsset = require("../assets/TLBaseAsset");
var import_TLShape = require("../records/TLShape");
const videoShapeProps = {
  w: import_validate.T.nonZeroNumber,
  h: import_validate.T.nonZeroNumber,
  time: import_validate.T.number,
  playing: import_validate.T.boolean,
  autoplay: import_validate.T.boolean,
  url: import_validate.T.linkUrl,
  assetId: import_TLBaseAsset.assetIdValidator.nullable(),
  altText: import_validate.T.string
};
const Versions = (0, import_TLShape.createShapePropsMigrationIds)("video", {
  AddUrlProp: 1,
  MakeUrlsValid: 2,
  AddAltText: 3,
  AddAutoplay: 4
});
const videoShapeMigrations = (0, import_TLShape.createShapePropsMigrationSequence)({
  sequence: [
    {
      id: Versions.AddUrlProp,
      up: (props) => {
        props.url = "";
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
    },
    {
      id: Versions.AddAltText,
      up: (props) => {
        props.altText = "";
      },
      down: (props) => {
        delete props.altText;
      }
    },
    {
      id: Versions.AddAutoplay,
      up: (props) => {
        props.autoplay = true;
      },
      down: (props) => {
        delete props.autoplay;
      }
    }
  ]
});
//# sourceMappingURL=TLVideoShape.js.map
