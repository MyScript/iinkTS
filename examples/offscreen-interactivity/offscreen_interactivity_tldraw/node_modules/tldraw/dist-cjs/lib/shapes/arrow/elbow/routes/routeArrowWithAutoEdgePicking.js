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
var routeArrowWithAutoEdgePicking_exports = {};
__export(routeArrowWithAutoEdgePicking_exports, {
  routeArrowWithAutoEdgePicking: () => routeArrowWithAutoEdgePicking,
  routeArrowWithManualEdgePicking: () => routeArrowWithManualEdgePicking,
  routeArrowWithPartialEdgePicking: () => routeArrowWithPartialEdgePicking
});
module.exports = __toCommonJS(routeArrowWithAutoEdgePicking_exports);
var import_editor = require("@tldraw/editor");
var import_definitions = require("../definitions");
var import_elbowArrowRoutes = require("./elbowArrowRoutes");
function routeArrowWithAutoEdgePicking(info, reason) {
  let idealRoute = null;
  if (
    // +1 to bias us towards the x-axis. without this, we get flicker as we move an arrow locket
    // to 45 deg (as gapx/gapy are almost equal and the result depends on floating point
    // precision)
    Math.abs(info.gapX) + 1 > Math.abs(info.gapY) && info.midX !== null
  ) {
    if (info.gapX > 0) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "left");
    } else {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "right");
    }
  } else {
    const aRight = info.A.edges.right;
    const aLeft = info.A.edges.left;
    const bTop = info.B.edges.top;
    const bBottom = info.B.edges.bottom;
    if (info.A.isPoint && info.B.isPoint) {
      if (info.gapY > 0) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "bottom", "top");
      } else {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "top", "bottom");
      }
    } else if (aRight && bTop && (aRight.expanded ?? aRight.value) <= bTop.crossTarget && aRight.crossTarget <= (bTop.expanded ?? bTop.value)) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "top");
    } else if (aRight && bBottom && (aRight.expanded ?? aRight.value) <= bBottom.crossTarget && aRight.crossTarget >= (bBottom.expanded ?? bBottom.value)) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "bottom");
    } else if (aLeft && bTop && (aLeft.expanded ?? aLeft.value) >= bTop.crossTarget && aLeft.crossTarget <= (bTop.expanded ?? bTop.value)) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "top");
    } else if (aLeft && bBottom && (aLeft.expanded ?? aLeft.value) >= bBottom.crossTarget && aLeft.crossTarget >= (bBottom.expanded ?? bBottom.value)) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "bottom");
    } else if (info.gapY > 0 && info.midY !== null) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "bottom", "top");
    } else if (info.gapY < 0 && info.midY !== null) {
      idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "top", "bottom");
    }
  }
  if (idealRoute) {
    idealRoute.aEdgePicking = reason;
    idealRoute.bEdgePicking = reason;
    return idealRoute;
  }
  const aAvailableSide = import_definitions.ElbowArrowSides.filter((side) => info.A.edges[side]);
  const bAvailableSides = import_definitions.ElbowArrowSides.filter((side) => info.B.edges[side]);
  const nonPartialRouteCandidates = aAvailableSide.flatMap(
    (aSide) => bAvailableSides.map((bSide) => [aSide, bSide, reason, reason])
  );
  return pickBest(info, nonPartialRouteCandidates);
}
function routeArrowWithPartialEdgePicking(info, aSide) {
  let idealRoute = null;
  const aRight = info.A.edges.right;
  const aLeft = info.A.edges.left;
  const bTop = info.B.edges.top;
  const bBottom = info.B.edges.bottom;
  switch (aSide) {
    case "right":
      if (info.gapX > 0 && info.gapX > Math.abs(info.gapY) && info.midX !== null) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "left");
      } else if (aRight && bTop && (aRight.expanded ?? aRight.value) <= bTop.crossTarget && aRight.crossTarget <= (bTop.expanded ?? bTop.value)) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "top");
      } else if (aRight && bBottom && (aRight.expanded ?? aRight.value) <= bBottom.crossTarget && aRight.crossTarget >= (bBottom.expanded ?? bBottom.value)) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "right", "bottom");
      }
      break;
    case "left":
      if (info.gapX < 0 && Math.abs(info.gapX) > Math.abs(info.gapY) && info.midX !== null) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "right");
      } else if (aLeft && bTop && (aLeft.expanded ?? aLeft.value) >= bTop.crossTarget && aLeft.crossTarget <= (bTop.expanded ?? bTop.value)) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "top");
      } else if (aLeft && bBottom && (aLeft.expanded ?? aLeft.value) >= bBottom.crossTarget && aLeft.crossTarget >= (bBottom.expanded ?? bBottom.value)) {
        idealRoute = (0, import_elbowArrowRoutes.tryRouteArrow)(info, "left", "bottom");
      }
      break;
    case "top":
    case "bottom":
      break;
    default:
      (0, import_editor.exhaustiveSwitchError)(aSide);
  }
  if (idealRoute) {
    idealRoute.aEdgePicking = "manual";
    idealRoute.bEdgePicking = "auto";
    return idealRoute;
  }
  switch (aSide) {
    case "top":
      return pickBest(info, [
        ["top", "bottom", "manual", "auto"],
        ["top", "right", "manual", "auto"],
        ["top", "left", "manual", "auto"],
        ["top", "top", "manual", "auto"]
      ]);
    case "bottom":
      return pickBest(info, [
        ["bottom", "top", "manual", "auto"],
        ["bottom", "right", "manual", "auto"],
        ["bottom", "left", "manual", "auto"],
        ["bottom", "bottom", "manual", "auto"]
      ]);
    case "left":
      return pickBest(info, [
        ["left", "right", "manual", "auto"],
        ["left", "bottom", "manual", "auto"],
        ["left", "left", "manual", "auto"],
        ["left", "top", "manual", "auto"]
      ]);
    case "right":
      return pickBest(info, [
        ["right", "left", "manual", "auto"],
        ["right", "bottom", "manual", "auto"],
        ["right", "right", "manual", "auto"],
        ["right", "top", "manual", "auto"]
      ]);
  }
}
function routeArrowWithManualEdgePicking(info, aSide, bSide) {
  const route = (0, import_elbowArrowRoutes.tryRouteArrow)(info, aSide, bSide);
  if (route) return route;
  if (info.A.isPoint && info.B.isPoint) {
    return pickBest(info, [
      [import_definitions.ElbowArrowSideOpposites[aSide], import_definitions.ElbowArrowSideOpposites[bSide], "manual", "manual"],
      [aSide, import_definitions.ElbowArrowSideOpposites[bSide], "manual", "auto"],
      [import_definitions.ElbowArrowSideOpposites[aSide], bSide, "auto", "manual"]
    ]);
  } else if (info.A.isPoint) {
    return (0, import_elbowArrowRoutes.tryRouteArrow)(info, import_definitions.ElbowArrowSideOpposites[aSide], bSide);
  } else if (info.B.isPoint) {
    return (0, import_elbowArrowRoutes.tryRouteArrow)(info, aSide, import_definitions.ElbowArrowSideOpposites[bSide]);
  }
  return null;
}
function pickBest(info, edges) {
  let bestRoute = null;
  let bestCornerCount = Infinity;
  let bestDistance = Infinity;
  let distanceBias = 0;
  for (const [aSide, bSide, aEdgePicking, bEdgePicking] of edges) {
    distanceBias += 1;
    const route = (0, import_elbowArrowRoutes.tryRouteArrow)(info, aSide, bSide);
    if (route) {
      route.aEdgePicking = aEdgePicking;
      route.bEdgePicking = bEdgePicking;
      if (route.points.length < bestCornerCount) {
        bestCornerCount = route.points.length;
        bestDistance = route.distance;
        bestRoute = route;
      } else if (route.points.length === bestCornerCount && route.distance + distanceBias < bestDistance) {
        bestDistance = route.distance;
        bestRoute = route;
      }
    }
  }
  return bestRoute;
}
//# sourceMappingURL=routeArrowWithAutoEdgePicking.js.map
