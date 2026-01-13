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
var getLines_exports = {};
__export(getLines_exports, {
  getLines: () => getLines
});
module.exports = __toCommonJS(getLines_exports);
var import_editor = require("@tldraw/editor");
function getLines(props, sw) {
  switch (props.geo) {
    case "x-box": {
      return getXBoxLines(props.w, props.h, sw, props.dash);
    }
    case "check-box": {
      return getCheckBoxLines(props.w, props.h);
    }
    default: {
      return void 0;
    }
  }
}
function getXBoxLines(w, h, sw, dash) {
  const inset = dash === "draw" ? 0.62 : 0;
  if (dash === "dashed") {
    return [
      [new import_editor.Vec(0, 0), new import_editor.Vec(w / 2, h / 2)],
      [new import_editor.Vec(w, h), new import_editor.Vec(w / 2, h / 2)],
      [new import_editor.Vec(0, h), new import_editor.Vec(w / 2, h / 2)],
      [new import_editor.Vec(w, 0), new import_editor.Vec(w / 2, h / 2)]
    ];
  }
  const clampX = (x) => Math.max(0, Math.min(w, x));
  const clampY = (y) => Math.max(0, Math.min(h, y));
  return [
    [
      new import_editor.Vec(clampX(sw * inset), clampY(sw * inset)),
      new import_editor.Vec(clampX(w - sw * inset), clampY(h - sw * inset))
    ],
    [
      new import_editor.Vec(clampX(sw * inset), clampY(h - sw * inset)),
      new import_editor.Vec(clampX(w - sw * inset), clampY(sw * inset))
    ]
  ];
}
function getCheckBoxLines(w, h) {
  const size = Math.min(w, h) * 0.82;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const clampX = (x) => Math.max(0, Math.min(w, x));
  const clampY = (y) => Math.max(0, Math.min(h, y));
  return [
    [
      new import_editor.Vec(clampX(ox + size * 0.25), clampY(oy + size * 0.52)),
      new import_editor.Vec(clampX(ox + size * 0.45), clampY(oy + size * 0.82))
    ],
    [
      new import_editor.Vec(clampX(ox + size * 0.45), clampY(oy + size * 0.82)),
      new import_editor.Vec(clampX(ox + size * 0.82), clampY(oy + size * 0.22))
    ]
  ];
}
//# sourceMappingURL=getLines.js.map
