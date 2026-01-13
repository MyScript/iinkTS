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
var minimap_webgl_shapes_exports = {};
__export(minimap_webgl_shapes_exports, {
  numArcSegmentsPerCorner: () => numArcSegmentsPerCorner,
  pie: () => pie,
  rectangle: () => rectangle,
  roundedRectangle: () => roundedRectangle,
  roundedRectangleDataSize: () => roundedRectangleDataSize
});
module.exports = __toCommonJS(minimap_webgl_shapes_exports);
var import_editor = require("@tldraw/editor");
const numArcSegmentsPerCorner = 10;
const roundedRectangleDataSize = (
  // num triangles in corners
  4 * 6 * numArcSegmentsPerCorner + // num triangles in center rect
  12 + // num triangles in outer rects
  4 * 12
);
function pie(array, {
  center,
  radius,
  numArcSegments = 20,
  startAngle = 0,
  endAngle = import_editor.PI2,
  offset = 0
}) {
  const angle = (endAngle - startAngle) / numArcSegments;
  let i = offset;
  for (let a = startAngle; a < endAngle; a += angle) {
    array[i++] = center.x;
    array[i++] = center.y;
    array[i++] = center.x + Math.cos(a) * radius;
    array[i++] = center.y + Math.sin(a) * radius;
    array[i++] = center.x + Math.cos(a + angle) * radius;
    array[i++] = center.y + Math.sin(a + angle) * radius;
  }
  return array;
}
function rectangle(array, offset, x, y, w, h) {
  array[offset++] = x;
  array[offset++] = y;
  array[offset++] = x;
  array[offset++] = y + h;
  array[offset++] = x + w;
  array[offset++] = y;
  array[offset++] = x + w;
  array[offset++] = y;
  array[offset++] = x;
  array[offset++] = y + h;
  array[offset++] = x + w;
  array[offset++] = y + h;
}
function roundedRectangle(data, box, radius) {
  const numArcSegments = numArcSegmentsPerCorner;
  radius = Math.min(radius, Math.min(box.w, box.h) / 2);
  const innerBox = import_editor.Box.ExpandBy(box, -radius);
  if (innerBox.w <= 0 || innerBox.h <= 0) {
    pie(data, { center: box.center, radius, numArcSegments: numArcSegmentsPerCorner * 4 });
    return numArcSegmentsPerCorner * 4 * 6;
  }
  let offset = 0;
  rectangle(data, offset, innerBox.minX, innerBox.minY, innerBox.w, innerBox.h);
  offset += 12;
  rectangle(data, offset, innerBox.minX, box.minY, innerBox.w, radius);
  offset += 12;
  rectangle(data, offset, innerBox.maxX, innerBox.minY, radius, innerBox.h);
  offset += 12;
  rectangle(data, offset, innerBox.minX, innerBox.maxY, innerBox.w, radius);
  offset += 12;
  rectangle(data, offset, box.minX, innerBox.minY, radius, innerBox.h);
  offset += 12;
  pie(data, {
    numArcSegments,
    offset,
    center: innerBox.point,
    radius,
    startAngle: import_editor.PI,
    endAngle: import_editor.PI * 1.5
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: import_editor.Vec.Add(innerBox.point, new import_editor.Vec(innerBox.w, 0)),
    radius,
    startAngle: import_editor.PI * 1.5,
    endAngle: import_editor.PI2
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: import_editor.Vec.Add(innerBox.point, innerBox.size),
    radius,
    startAngle: 0,
    endAngle: import_editor.HALF_PI
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: import_editor.Vec.Add(innerBox.point, new import_editor.Vec(0, innerBox.h)),
    radius,
    startAngle: import_editor.HALF_PI,
    endAngle: import_editor.PI
  });
  return roundedRectangleDataSize;
}
//# sourceMappingURL=minimap-webgl-shapes.js.map
