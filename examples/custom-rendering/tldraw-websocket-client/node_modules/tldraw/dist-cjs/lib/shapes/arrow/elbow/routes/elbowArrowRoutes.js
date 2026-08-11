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
var elbowArrowRoutes_exports = {};
__export(elbowArrowRoutes_exports, {
  routeRightToBottom: () => routeRightToBottom,
  routeRightToLeft: () => routeRightToLeft,
  routeRightToRight: () => routeRightToRight,
  routeRightToTop: () => routeRightToTop,
  tryRouteArrow: () => tryRouteArrow
});
module.exports = __toCommonJS(elbowArrowRoutes_exports);
var import_ElbowArrowRouteBuilder = require("./ElbowArrowRouteBuilder");
var import_ElbowArrowWorkingInfo = require("./ElbowArrowWorkingInfo");
function routeRightToLeft(info) {
  const aEdge = info.A.edges.right;
  const bEdge = info.B.edges.left;
  if (!aEdge || !bEdge) return null;
  if (aEdge.crossTarget > bEdge.crossTarget) {
    info.apply(import_ElbowArrowWorkingInfo.ElbowArrowTransform.FlipY);
  }
  if (info.gapX > 0 && info.midX !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to left 1").add(aEdge.value, aEdge.crossTarget).add(info.midX, aEdge.crossTarget).add(info.midX, bEdge.crossTarget).midpointHandle("x").add(bEdge.value, bEdge.crossTarget).build();
  }
  if (aEdge.expanded === null || bEdge.expanded === null) return null;
  if (info.midY !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to left 2").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.midY).add(bEdge.expanded, info.midY).midpointHandle("y").add(bEdge.expanded, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  const arrow3Distance = Math.abs(aEdge.value - info.common.expanded.right) + Math.abs(aEdge.crossTarget - info.common.expanded.bottom) + Math.abs(info.common.expanded.right - bEdge.expanded) + Math.abs(info.common.expanded.bottom - bEdge.crossTarget) + info.options.expandElbowLegLength + 6;
  const arrow4Distance = info.options.expandElbowLegLength + Math.abs(aEdge.crossTarget - info.common.expanded.top) + Math.abs(aEdge.expanded - info.common.expanded.left) + Math.abs(info.common.expanded.top - bEdge.crossTarget) + Math.abs(info.common.expanded.left - bEdge.value) + // 6 points in this arrow, plus bias towards down/right:
  6 + info.bias.y;
  const arrow5Distance = info.gapX < 0 && info.midX !== null ? info.options.expandElbowLegLength + Math.abs(aEdge.crossTarget - info.A.expanded.bottom) + info.common.expanded.width + Math.abs(info.A.expanded.bottom - info.B.expanded.top) + Math.abs(info.B.expanded.top - bEdge.crossTarget) + info.options.expandElbowLegLength + // 8 points in this arrow
  8 : Infinity;
  if (arrow3Distance < arrow4Distance && arrow3Distance < arrow5Distance) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to left 3").add(aEdge.value, aEdge.crossTarget).add(info.common.expanded.right, aEdge.crossTarget).add(info.common.expanded.right, info.common.expanded.bottom).add(bEdge.expanded, info.common.expanded.bottom).add(bEdge.expanded, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  if (arrow4Distance < arrow5Distance) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to left 4").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.common.expanded.top).add(info.common.expanded.left, info.common.expanded.top).add(info.common.expanded.left, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  if (info.midX !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to left 5").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.A.expanded.bottom).add(info.midX, info.A.expanded.bottom).add(info.midX, info.B.expanded.top).midpointHandle("y").add(bEdge.expanded, info.B.expanded.top).add(bEdge.expanded, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  return null;
}
function routeRightToTop(info) {
  const aEdge = info.A.edges.right;
  const bEdge = info.B.edges.top;
  if (!aEdge || !bEdge) return null;
  if (aEdge.crossTarget < (bEdge.expanded ?? bEdge.value) && bEdge.crossTarget > (aEdge.expanded ?? aEdge.value) || info.A.isPoint && info.B.expanded.containsPoint(info.A.original.center)) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 1").add(aEdge.value, aEdge.crossTarget).add(bEdge.crossTarget, aEdge.crossTarget).add(bEdge.crossTarget, bEdge.value).build();
  }
  if (info.gapX > 0 && info.midX !== null && bEdge.expanded !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 2").add(aEdge.value, aEdge.crossTarget).add(info.midX, aEdge.crossTarget).add(info.midX, bEdge.expanded).midpointHandle("x").add(bEdge.crossTarget, bEdge.expanded).add(bEdge.crossTarget, bEdge.value).build();
  }
  if (info.gapY > 0 && aEdge.expanded !== null && bEdge.crossTarget < aEdge.expanded && info.midY !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 3").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.midY).add(bEdge.crossTarget, info.midY).midpointHandle("y").add(bEdge.crossTarget, bEdge.value).build();
  }
  const arrow4Length = Math.abs(aEdge.value - info.common.expanded.right) + Math.abs(aEdge.crossTarget - info.common.expanded.top) + Math.abs(bEdge.crossTarget - info.common.expanded.right) + Math.abs(bEdge.value - info.common.expanded.top);
  const arrow5Length = aEdge.expanded !== null && info.midY !== null && bEdge.expanded !== null ? Math.abs(aEdge.value - aEdge.expanded) + Math.abs(info.B.expanded.left - aEdge.expanded) + Math.abs(info.B.expanded.left - bEdge.crossTarget) + Math.abs(aEdge.crossTarget - info.B.expanded.top) + Math.abs(bEdge.value - bEdge.expanded) : Infinity;
  const arrow6Length = aEdge.expanded !== null && info.midX !== null && bEdge.expanded !== null ? Math.abs(aEdge.value - info.common.expanded.right) + Math.abs(aEdge.crossTarget - info.A.expanded.bottom) + Math.abs(aEdge.expanded - bEdge.crossTarget) + Math.abs(info.A.expanded.bottom - bEdge.expanded) + Math.abs(bEdge.expanded - bEdge.value) : Infinity;
  if (arrow4Length < arrow5Length && arrow4Length < arrow6Length) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 4").add(aEdge.value, aEdge.crossTarget).add(info.common.expanded.right, aEdge.crossTarget).add(info.common.expanded.right, info.common.expanded.top).add(bEdge.crossTarget, info.common.expanded.top).add(bEdge.crossTarget, bEdge.value).build();
  }
  if (bEdge.expanded !== null && aEdge.expanded !== null && info.midY !== null && arrow5Length < arrow6Length) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 5").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.midY).add(info.B.expanded.left, info.midY).midpointHandle("y").add(info.B.expanded.left, bEdge.expanded).add(bEdge.crossTarget, bEdge.expanded).add(bEdge.crossTarget, bEdge.value).build();
  }
  if (bEdge.expanded !== null && aEdge.expanded !== null && info.midX !== null) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to top 6").add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.A.expanded.bottom).add(info.midX, info.A.expanded.bottom).add(info.midX, bEdge.expanded).midpointHandle("x").add(bEdge.crossTarget, bEdge.expanded).add(bEdge.crossTarget, bEdge.value).build();
  }
  return null;
}
function routeRightToBottom(info) {
  info.apply(import_ElbowArrowWorkingInfo.ElbowArrowTransform.FlipY);
  return routeRightToTop(info);
}
function routeRightToRight(info) {
  const aEdge = info.A.edges.right;
  const bEdge = info.B.edges.right;
  if (!aEdge || !bEdge) return null;
  if ((info.gapX <= 0 || aEdge.crossTarget > info.B.expanded.bottom || aEdge.crossTarget < info.B.expanded.top) && (bEdge.value > info.A.original.left || bEdge.crossTarget > info.A.expanded.bottom || bEdge.crossTarget < info.A.expanded.top)) {
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, "to right 1").add(aEdge.value, aEdge.crossTarget).add(info.common.expanded.right, aEdge.crossTarget).add(info.common.expanded.right, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  if (info.midX === null) return null;
  if (bEdge.expanded !== null && info.gapX >= 0) {
    const viaBottomLength = Math.abs(bEdge.crossTarget - info.B.expanded.bottom) + Math.abs(aEdge.crossTarget - info.B.expanded.bottom);
    const viaTopLength = Math.abs(bEdge.crossTarget - info.B.expanded.top) + Math.abs(aEdge.crossTarget - info.B.expanded.top);
    const topOrBottom = viaBottomLength < viaTopLength ? "bottom" : "top";
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, `to right 2 via ${topOrBottom}`).add(aEdge.value, aEdge.crossTarget).add(info.midX, aEdge.crossTarget).add(info.midX, info.B.expanded[topOrBottom]).midpointHandle("x").add(bEdge.expanded, info.B.expanded[topOrBottom]).add(bEdge.expanded, bEdge.crossTarget).add(bEdge.value, bEdge.crossTarget).build();
  }
  if (aEdge.expanded !== null && info.gapX <= 0) {
    const viaBottomLength = Math.abs(bEdge.crossTarget - info.A.expanded.bottom) + Math.abs(aEdge.crossTarget - info.A.expanded.bottom);
    const viaTopLength = Math.abs(bEdge.crossTarget - info.A.expanded.top) + Math.abs(aEdge.crossTarget - info.A.expanded.top);
    const topOrBottom = viaBottomLength < viaTopLength ? "bottom" : "top";
    return new import_ElbowArrowRouteBuilder.ElbowArrowRouteBuilder(info, `to right 3 via ${topOrBottom}`).add(aEdge.value, aEdge.crossTarget).add(aEdge.expanded, aEdge.crossTarget).add(aEdge.expanded, info.A.expanded[topOrBottom]).add(info.midX, info.A.expanded[topOrBottom]).add(info.midX, bEdge.crossTarget).midpointHandle("x").add(bEdge.value, bEdge.crossTarget).build();
  }
  return null;
}
const routes = {
  top: {
    top: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate270, routeRightToRight],
    left: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate270, routeRightToTop],
    bottom: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate270, routeRightToLeft],
    right: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate270, routeRightToBottom]
  },
  right: {
    top: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Identity, routeRightToTop],
    right: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Identity, routeRightToRight],
    bottom: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Identity, routeRightToBottom],
    left: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Identity, routeRightToLeft]
  },
  bottom: {
    top: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate90, routeRightToLeft],
    left: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate90, routeRightToBottom],
    bottom: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate90, routeRightToRight],
    right: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate90, routeRightToTop]
  },
  left: {
    top: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate180, routeRightToBottom],
    left: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate180, routeRightToRight],
    bottom: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate180, routeRightToTop],
    right: [import_ElbowArrowWorkingInfo.ElbowArrowTransform.Rotate180, routeRightToLeft]
  }
};
function tryRouteArrow(info, aEdge, bEdge) {
  const [transform, routeFn] = routes[aEdge][bEdge];
  info.apply(transform);
  const route = routeFn(info);
  info.reset();
  return route;
}
//# sourceMappingURL=elbowArrowRoutes.js.map
