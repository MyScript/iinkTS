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
var import_editor = require("@tldraw/editor");
function resizeScaled(shape, {
  initialBounds,
  scaleX,
  scaleY,
  newPoint
}) {
  const scaleDelta = Math.max(0.01, Math.min(Math.abs(scaleX), Math.abs(scaleY)));
  const offset = new import_editor.Vec(0, 0);
  if (scaleX < 0) {
    offset.x = -(initialBounds.width * scaleDelta);
  }
  if (scaleY < 0) {
    offset.y = -(initialBounds.height * scaleDelta);
  }
  const { x, y } = import_editor.Vec.Add(newPoint, offset.rot(shape.rotation));
  return {
    x,
    y,
    props: {
      scale: scaleDelta * shape.props.scale
    }
  };
}
//# sourceMappingURL=resizeScaled.js.map
