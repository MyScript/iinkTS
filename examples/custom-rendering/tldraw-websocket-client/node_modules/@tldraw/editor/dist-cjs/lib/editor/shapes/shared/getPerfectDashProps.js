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
var getPerfectDashProps_exports = {};
__export(getPerfectDashProps_exports, {
  getPerfectDashProps: () => getPerfectDashProps
});
module.exports = __toCommonJS(getPerfectDashProps_exports);
function getPerfectDashProps(totalLength, strokeWidth, opts = {}) {
  const {
    closed = false,
    snap = 1,
    start = "outset",
    end = "outset",
    lengthRatio = 2,
    style = "dashed",
    forceSolid = false
  } = opts;
  let dashLength = 0;
  let dashCount = 0;
  let ratio = 1;
  let gapLength = 0;
  let strokeDashoffset = 0;
  if (forceSolid) {
    return {
      strokeDasharray: "none",
      strokeDashoffset: "none"
    };
  }
  switch (style) {
    case "dashed": {
      ratio = 1;
      dashLength = Math.min(strokeWidth * lengthRatio, totalLength / 4);
      break;
    }
    case "dotted": {
      ratio = 100;
      dashLength = strokeWidth / ratio;
      break;
    }
    default: {
      return {
        strokeDasharray: "none",
        strokeDashoffset: "none"
      };
    }
  }
  if (!closed) {
    if (start === "outset") {
      totalLength += dashLength / 2;
      strokeDashoffset += dashLength / 2;
    } else if (start === "skip") {
      totalLength -= dashLength;
      strokeDashoffset -= dashLength;
    }
    if (end === "outset") {
      totalLength += dashLength / 2;
    } else if (end === "skip") {
      totalLength -= dashLength;
    }
  }
  dashCount = Math.floor(totalLength / dashLength / (2 * ratio));
  dashCount -= dashCount % snap;
  if (dashCount < 3 && style === "dashed") {
    if (totalLength / strokeWidth < 4) {
      dashLength = totalLength;
      dashCount = 1;
      gapLength = 0;
    } else {
      dashLength = totalLength * (1 / 3);
      gapLength = totalLength * (1 / 3);
    }
  } else {
    dashLength = totalLength / dashCount / (2 * ratio);
    if (closed) {
      strokeDashoffset = dashLength / 2;
      gapLength = (totalLength - dashCount * dashLength) / dashCount;
    } else {
      gapLength = (totalLength - dashCount * dashLength) / Math.max(1, dashCount - 1);
    }
  }
  return {
    strokeDasharray: [dashLength, gapLength].join(" "),
    strokeDashoffset: strokeDashoffset.toString()
  };
}
//# sourceMappingURL=getPerfectDashProps.js.map
