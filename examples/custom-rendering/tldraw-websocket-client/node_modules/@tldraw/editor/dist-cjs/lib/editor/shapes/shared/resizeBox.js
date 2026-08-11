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
var resizeBox_exports = {};
__export(resizeBox_exports, {
  resizeBox: () => resizeBox
});
module.exports = __toCommonJS(resizeBox_exports);
var import_Vec = require("../../../primitives/Vec");
function resizeBox(shape, info, opts = {}) {
  const { newPoint, handle, scaleX, scaleY } = info;
  const { minWidth = 1, maxWidth = Infinity, minHeight = 1, maxHeight = Infinity } = opts;
  let w = shape.props.w * scaleX;
  let h = shape.props.h * scaleY;
  const offset = new import_Vec.Vec(0, 0);
  if (w > 0) {
    if (w < minWidth) {
      switch (handle) {
        case "top_left":
        case "left":
        case "bottom_left": {
          offset.x = w - minWidth;
          break;
        }
        case "top":
        case "bottom": {
          offset.x = (w - minWidth) / 2;
          break;
        }
        default: {
          offset.x = 0;
        }
      }
      w = minWidth;
    }
  } else {
    offset.x = w;
    w = -w;
    if (w < minWidth) {
      switch (handle) {
        case "top_left":
        case "left":
        case "bottom_left": {
          offset.x = -w;
          break;
        }
        default: {
          offset.x = -minWidth;
        }
      }
      w = minWidth;
    }
  }
  if (h > 0) {
    if (h < minHeight) {
      switch (handle) {
        case "top_left":
        case "top":
        case "top_right": {
          offset.y = h - minHeight;
          break;
        }
        case "right":
        case "left": {
          offset.y = (h - minHeight) / 2;
          break;
        }
        default: {
          offset.y = 0;
        }
      }
      h = minHeight;
    }
  } else {
    offset.y = h;
    h = -h;
    if (h < minHeight) {
      switch (handle) {
        case "top_left":
        case "top":
        case "top_right": {
          offset.y = -h;
          break;
        }
        default: {
          offset.y = -minHeight;
        }
      }
      h = minHeight;
    }
  }
  const { x, y } = offset.rot(shape.rotation).add(newPoint);
  return {
    ...shape,
    x,
    y,
    props: {
      w: Math.min(maxWidth, w),
      h: Math.min(maxHeight, h)
    }
  };
}
//# sourceMappingURL=resizeBox.js.map
