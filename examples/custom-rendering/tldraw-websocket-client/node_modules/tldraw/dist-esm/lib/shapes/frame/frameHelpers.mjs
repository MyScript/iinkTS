import {
  Box,
  canonicalizeRotation,
  last,
  toDomPrecision
} from "@tldraw/editor";
import { defaultEmptyAs } from "./FrameShapeUtil.mjs";
function getFrameHeadingSide(editor, shape) {
  const pageRotation = canonicalizeRotation(editor.getShapePageTransform(shape.id).rotation());
  const offsetRotation = pageRotation + Math.PI / 4;
  const scaledRotation = (offsetRotation * (2 / Math.PI) + 4) % 4;
  return Math.floor(scaledRotation);
}
const measurementWeakmap = /* @__PURE__ */ new WeakMap();
function getFrameHeadingSize(editor, shape, opts) {
  if (process.env.NODE_ENV === "test") {
    return new Box(0, -opts.height, shape.props.w, opts.height);
  }
  let width = measurementWeakmap.get(shape.props);
  if (!width) {
    const frameTitle = defaultEmptyAs(shape.props.name, "Frame") + String.fromCharCode(8203);
    const spans = editor.textMeasure.measureTextSpans(frameTitle, opts);
    const firstSpan = spans[0];
    const lastSpan = last(spans);
    width = lastSpan.box.w + lastSpan.box.x - firstSpan.box.x;
    measurementWeakmap.set(shape.props, width);
  }
  return new Box(0, -opts.height, width, opts.height);
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
      labelTranslate = `translate(${toDomPrecision(shape.props.w)}${u}, 0${u}) rotate(90${r})`;
      break;
    case 2:
      labelTranslate = `translate(${toDomPrecision(shape.props.w)}${u}, ${toDomPrecision(
        shape.props.h
      )}${u}) rotate(180${r})`;
      break;
    case 1:
      labelTranslate = `translate(0${u}, ${toDomPrecision(shape.props.h)}${u}) rotate(270${r})`;
      break;
    default:
      throw Error("labelSide out of bounds");
  }
  return labelTranslate;
}
export {
  getFrameHeadingOpts,
  getFrameHeadingSide,
  getFrameHeadingSize,
  getFrameHeadingTranslation
};
//# sourceMappingURL=frameHelpers.mjs.map
