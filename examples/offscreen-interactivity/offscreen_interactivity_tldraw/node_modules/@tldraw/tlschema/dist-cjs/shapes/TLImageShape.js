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
var TLImageShape_exports = {};
__export(TLImageShape_exports, {
  ImageShapeCrop: () => ImageShapeCrop,
  imageShapeMigrations: () => imageShapeMigrations,
  imageShapeProps: () => imageShapeProps,
  imageShapeVersions: () => Versions
});
module.exports = __toCommonJS(TLImageShape_exports);
var import_validate = require("@tldraw/validate");
var import_TLBaseAsset = require("../assets/TLBaseAsset");
var import_geometry_types = require("../misc/geometry-types");
var import_TLShape = require("../records/TLShape");
const ImageShapeCrop = import_validate.T.object({
  topLeft: import_geometry_types.vecModelValidator,
  bottomRight: import_geometry_types.vecModelValidator,
  isCircle: import_validate.T.boolean.optional()
});
const imageShapeProps = {
  w: import_validate.T.nonZeroNumber,
  h: import_validate.T.nonZeroNumber,
  playing: import_validate.T.boolean,
  url: import_validate.T.linkUrl,
  assetId: import_TLBaseAsset.assetIdValidator.nullable(),
  crop: ImageShapeCrop.nullable(),
  flipX: import_validate.T.boolean,
  flipY: import_validate.T.boolean,
  altText: import_validate.T.string
};
const Versions = (0, import_TLShape.createShapePropsMigrationIds)("image", {
  AddUrlProp: 1,
  AddCropProp: 2,
  MakeUrlsValid: 3,
  AddFlipProps: 4,
  AddAltText: 5
});
const imageShapeMigrations = (0, import_TLShape.createShapePropsMigrationSequence)({
  sequence: [
    {
      id: Versions.AddUrlProp,
      up: (props) => {
        props.url = "";
      },
      down: "retired"
    },
    {
      id: Versions.AddCropProp,
      up: (props) => {
        props.crop = null;
      },
      down: (props) => {
        delete props.crop;
      }
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
      id: Versions.AddFlipProps,
      up: (props) => {
        props.flipX = false;
        props.flipY = false;
      },
      down: (props) => {
        delete props.flipX;
        delete props.flipY;
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
    }
  ]
});
//# sourceMappingURL=TLImageShape.js.map
