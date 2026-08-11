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
var BaseBoxShapeUtil_exports = {};
__export(BaseBoxShapeUtil_exports, {
  BaseBoxShapeUtil: () => BaseBoxShapeUtil
});
module.exports = __toCommonJS(BaseBoxShapeUtil_exports);
var import_utils = require("@tldraw/utils");
var import_Rectangle2d = require("../../primitives/geometry/Rectangle2d");
var import_ShapeUtil = require("./ShapeUtil");
var import_resizeBox = require("./shared/resizeBox");
class BaseBoxShapeUtil extends import_ShapeUtil.ShapeUtil {
  getGeometry(shape) {
    return new import_Rectangle2d.Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true
    });
  }
  onResize(shape, info) {
    return (0, import_resizeBox.resizeBox)(shape, info);
  }
  getHandleSnapGeometry(shape) {
    return {
      points: this.getGeometry(shape).bounds.cornersAndCenter
    };
  }
  getInterpolatedProps(startShape, endShape, t) {
    return {
      ...endShape.props,
      w: (0, import_utils.lerp)(startShape.props.w, endShape.props.w, t),
      h: (0, import_utils.lerp)(startShape.props.h, endShape.props.h, t)
    };
  }
}
//# sourceMappingURL=BaseBoxShapeUtil.js.map
