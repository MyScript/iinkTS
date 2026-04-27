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
var frameHelpers_exports = {};
__export(frameHelpers_exports, {
  getFrameHeadingOpts: () => getFrameHeadingOpts,
  getFrameHeadingSide: () => getFrameHeadingSide,
  getFrameHeadingSize: () => getFrameHeadingSize,
  getFrameHeadingTranslation: () => getFrameHeadingTranslation
});
module.exports = __toCommonJS(frameHelpers_exports);
var import_editor = require("@tldraw/editor");
var import_FrameShapeUtil = require("./FrameShapeUtil");
function getFrameHeadingSide(editor, shape) {
  const pageRotation = (0, import_editor.canonicalizeRotation)(editor.getShapePageTransform(shape.id).rotation());
  const offsetRotation = pageRotation + Math.PI / 4;
  const scaledRotation = (offsetRotation * (2 / Math.PI) + 4) % 4;
  return Math.floor(scaledRotation);
}
const measurementWeakmap = /* @__PURE__ */ new WeakMap();
function getFrameHeadingSize(editor, shape, opts) {
  if (process.env.NODE_ENV === "test") {
    return new import_editor.Box(0, -opts.height, shape.props.w, opts.height);
  }
  let width = measurementWeakmap.get(shape.props);
  if (!width) {
    const frameTitle = (0, import_FrameShapeUtil.defaultEmptyAs)(shape.props.name, "Frame") + String.fromCharCode(8203);
    const spans = editor.textMeasure.measureTextSpans(frameTitle, opts);
    const firstSpan = spans[0];
    const lastSpan = (0, import_editor.last)(spans);
    width = lastSpan.box.w + lastSpan.box.x - firstSpan.box.x;
    measurementWeakmap.set(shape.props, width);
  }
  return new import_editor.Box(0, -opts.height, width, opts.height);
}
function getFrameHeadingOpts(width, isSvg) {
  return {
    fontSize: 12,
    fontFamily: isSvg ? "Arial" : "Inter, sans-serif",
    textAlign: "start",
    width,
    height: 24,
    // --frame-height
    padding: 0,
    lineHeight: 1,
    fontStyle: "normal",
    fontWeight: "normal",
    overflow: "truncate-ellipsis",
    verticalTextAlign: "middle",
    offsetY: -(32 + 2),
    // --frame-minimum-height + (border width * 2)
    offsetX: 0
  };
}
function getFrameHeadingTranslation(shape, side, isSvg) {
  const u = isSvg ? "" : "px";
  const r = isSvg ? "" : "deg";
  let labelTranslate;
  switch (side) {
    case 0:
      labelTranslate = ``;
      break;
    case 3:
      labelTranslate = `translate(${(0, import_editor.toDomPrecision)(shape.props.w)}${u}, 0${u}) rotate(90${r})`;
      break;
    case 2:
      labelTranslate = `translate(${(0, import_editor.toDomPrecision)(shape.props.w)}${u}, ${(0, import_editor.toDomPrecision)(
        shape.props.h
      )}${u}) rotate(180${r})`;
      break;
    case 1:
      labelTranslate = `translate(0${u}, ${(0, import_editor.toDomPrecision)(shape.props.h)}${u}) rotate(270${r})`;
      break;
    default:
      throw Error("labelSide out of bounds");
  }
  return labelTranslate;
}
//# sourceMappingURL=frameHelpers.js.map
