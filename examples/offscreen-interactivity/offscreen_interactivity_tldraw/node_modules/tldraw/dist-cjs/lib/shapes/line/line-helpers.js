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
var line_helpers_exports = {};
__export(line_helpers_exports, {
  getDrawLinePathData: () => getDrawLinePathData
});
module.exports = __toCommonJS(line_helpers_exports);
var import_editor = require("@tldraw/editor");
function getDrawLinePathData(id, outline, strokeWidth) {
  let innerPathData = `M ${(0, import_editor.precise)(outline[0])}L`;
  let outerPathData2 = `M ${(0, import_editor.precise)(outline[0])}L`;
  const offset = strokeWidth / 3;
  const roundness = strokeWidth * 2;
  const random = (0, import_editor.rng)(id);
  let p0 = outline[0];
  let p1;
  let s0 = outline[0];
  let s1;
  const len = outline.length;
  for (let i = 0, n = len - 1; i < n; i++) {
    p1 = outline[i + 1];
    s1 = import_editor.Vec.AddXY(outline[i + 1], random() * offset, random() * offset);
    const delta = import_editor.Vec.Sub(p1, p0);
    const distance = import_editor.Vec.Len(delta);
    const vector = import_editor.Vec.Div(delta, distance).mul(Math.min(distance / 4, roundness));
    const q0 = import_editor.Vec.Add(p0, vector);
    const q1 = import_editor.Vec.Add(p1, vector.neg());
    const sDelta = import_editor.Vec.Sub(s1, s0);
    const sDistance = import_editor.Vec.Len(sDelta);
    const sVector = import_editor.Vec.Div(sDelta, sDistance).mul(Math.min(sDistance / 4, roundness));
    const sq0 = import_editor.Vec.Add(s0, sVector);
    const sq1 = import_editor.Vec.Add(s1, sVector.neg());
    if (i === n - 1) {
      innerPathData += `${(0, import_editor.precise)(q0)}L ${(0, import_editor.precise)(p1)}`;
      outerPathData2 += `${(0, import_editor.precise)(sq0)}L ${(0, import_editor.precise)(s1)}`;
    } else {
      innerPathData += `${(0, import_editor.precise)(q0)}L ${(0, import_editor.precise)(q1)}Q ${(0, import_editor.precise)(p1)}`;
      outerPathData2 += `${(0, import_editor.precise)(sq0)}L ${(0, import_editor.precise)(sq1)}Q ${(0, import_editor.precise)(s1)}`;
      p0 = p1;
      s0 = s1;
    }
  }
  return [innerPathData, innerPathData + outerPathData2];
}
//# sourceMappingURL=line-helpers.js.map
