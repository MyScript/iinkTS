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
var crop_helpers_exports = {};
__export(crop_helpers_exports, {
  getTranslateCroppedImageChange: () => getTranslateCroppedImageChange
});
module.exports = __toCommonJS(crop_helpers_exports);
var import_editor = require("@tldraw/editor");
function getTranslateCroppedImageChange(editor, shape, delta) {
  if (!shape) {
    throw Error("Needs to translate a cropped shape!");
  }
  const { crop: oldCrop } = shape.props;
  if (!oldCrop) {
    return;
  }
  const flatten = editor.inputs.shiftKey ? Math.abs(delta.x) < Math.abs(delta.y) ? "x" : "y" : null;
  if (flatten === "x") {
    delta.x = 0;
  } else if (flatten === "y") {
    delta.y = 0;
  }
  delta.rot(-shape.rotation);
  const w = 1 / (oldCrop.bottomRight.x - oldCrop.topLeft.x) * shape.props.w;
  const h = 1 / (oldCrop.bottomRight.y - oldCrop.topLeft.y) * shape.props.h;
  const yCrop = oldCrop.bottomRight.y - oldCrop.topLeft.y;
  const xCrop = oldCrop.bottomRight.x - oldCrop.topLeft.x;
  const newCrop = (0, import_editor.structuredClone)(oldCrop);
  newCrop.topLeft.x = Math.min(1 - xCrop, Math.max(0, newCrop.topLeft.x - delta.x / w));
  newCrop.topLeft.y = Math.min(1 - yCrop, Math.max(0, newCrop.topLeft.y - delta.y / h));
  newCrop.bottomRight.x = newCrop.topLeft.x + xCrop;
  newCrop.bottomRight.y = newCrop.topLeft.y + yCrop;
  const partial = {
    id: shape.id,
    type: shape.type,
    props: {
      crop: newCrop
    }
  };
  return partial;
}
//# sourceMappingURL=crop_helpers.js.map
