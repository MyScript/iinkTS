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
var resizeScaled_exports = {};
__export(resizeScaled_exports, {
  resizeScaled: () => resizeScaled
});
module.exports = __toCommonJS(resizeScaled_exports);
var import_utils = require("@tldraw/utils");
var import_Vec = require("../../../primitives/Vec");
function resizeScaled(shape, { initialBounds, scaleX, scaleY, newPoint, handle }) {
  let scaleDelta;
  switch (handle) {
    case "bottom_left":
    case "bottom_right":
    case "top_left":
    case "top_right": {
      scaleDelta = Math.max(0.01, Math.max(Math.abs(scaleX), Math.abs(scaleY)));
      break;
    }
    case "left":
    case "right": {
      scaleDelta = Math.max(0.01, Math.abs(scaleX));
      break;
    }
    case "bottom":
    case "top": {
      scaleDelta = Math.max(0.01, Math.abs(scaleY));
      break;
    }
    default: {
      throw (0, import_utils.exhaustiveSwitchError)(handle);
    }
  }
  const offset = new import_Vec.Vec(0, 0);
  if (scaleX < 0) {
    offset.x = -(initialBounds.width * scaleDelta);
  }
  if (scaleY < 0) {
    offset.y = -(initialBounds.height * scaleDelta);
  }
  const { x, y } = import_Vec.Vec.Add(newPoint, offset.rot(shape.rotation));
  return {
    x,
    y,
    props: {
      scale: scaleDelta * shape.props.scale
    }
  };
}
//# sourceMappingURL=resizeScaled.js.map
