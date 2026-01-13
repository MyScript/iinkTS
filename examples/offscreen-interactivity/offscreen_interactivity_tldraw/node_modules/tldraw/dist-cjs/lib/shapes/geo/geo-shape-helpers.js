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
var geo_shape_helpers_exports = {};
__export(geo_shape_helpers_exports, {
  cloudOutline: () => cloudOutline,
  getCloudArcs: () => getCloudArcs,
  getCloudPath: () => getCloudPath,
  getDrawHeartPath: () => getDrawHeartPath,
  getEllipseDrawIndicatorPath: () => getEllipseDrawIndicatorPath,
  getEllipsePath: () => getEllipsePath,
  getHeartParts: () => getHeartParts,
  getHeartPath: () => getHeartPath,
  getHeartPoints: () => getHeartPoints,
  getOvalPerimeter: () => getOvalPerimeter,
  getRoundedInkyPolygonPath: () => getRoundedInkyPolygonPath,
  getRoundedPolygonPoints: () => getRoundedPolygonPoints,
  inkyCloudSvgPath: () => inkyCloudSvgPath
});
module.exports = __toCommonJS(geo_shape_helpers_exports);
var import_editor = require("@tldraw/editor");
var import_getStrokePoints = require("../shared/freehand/getStrokePoints");
var import_svg = require("../shared/freehand/svg");
var import_editor2 = require("@tldraw/editor");
function getOvalPerimeter(h, w) {
  if (h > w) return (import_editor.PI * (w / 2) + (h - w)) * 2;
  else return (import_editor.PI * (h / 2) + (w - h)) * 2;
}
function getHeartPath(w, h) {
  return getHeartParts(w, h).map((c, i) => c.getSvgPathData(i === 0)).join(" ") + " Z";
}
function getDrawHeartPath(w, h, sw, id) {
  const o = w / 4;
  const k = h / 4;
  const random = (0, import_editor.rng)(id);
  const mutDistance = sw * 0.75;
  const mut = (v) => v.addXY(random() * mutDistance, random() * mutDistance);
  const A = new import_editor.Vec(w / 2, h);
  const B = new import_editor.Vec(0, k * 1.2);
  const C = new import_editor.Vec(w / 2, k * 0.9);
  const D = new import_editor.Vec(w, k * 1.2);
  const Am = mut(new import_editor.Vec(w / 2, h));
  const Bm = mut(new import_editor.Vec(0, k * 1.2));
  const Cm = mut(new import_editor.Vec(w / 2, k * 0.9));
  const Dm = mut(new import_editor.Vec(w, k * 1.2));
  const parts = [
    new import_editor.CubicBezier2d({
      start: A,
      cp1: new import_editor.Vec(o * 1.5, k * 3),
      cp2: new import_editor.Vec(0, k * 2.5),
      end: B
    }),
    new import_editor.CubicBezier2d({
      start: B,
      cp1: new import_editor.Vec(0, -k * 0.32),
      cp2: new import_editor.Vec(o * 1.85, -k * 0.32),
      end: C
    }),
    new import_editor.CubicBezier2d({
      start: C,
      cp1: new import_editor.Vec(o * 2.15, -k * 0.32),
      cp2: new import_editor.Vec(w, -k * 0.32),
      end: D
    }),
    new import_editor.CubicBezier2d({
      start: D,
      cp1: new import_editor.Vec(w, k * 2.5),
      cp2: new import_editor.Vec(o * 2.5, k * 3),
      end: Am
    }),
    new import_editor.CubicBezier2d({
      start: Am,
      cp1: new import_editor.Vec(o * 1.5, k * 3),
      cp2: new import_editor.Vec(0, k * 2.5),
      end: Bm
    }),
    new import_editor.CubicBezier2d({
      start: Bm,
      cp1: new import_editor.Vec(0, -k * 0.32),
      cp2: new import_editor.Vec(o * 1.85, -k * 0.32),
      end: Cm
    }),
    new import_editor.CubicBezier2d({
      start: Cm,
      cp1: new import_editor.Vec(o * 2.15, -k * 0.32),
      cp2: new import_editor.Vec(w, -k * 0.32),
      end: Dm
    }),
    new import_editor.CubicBezier2d({
      start: Dm,
      cp1: new import_editor.Vec(w, k * 2.5),
      cp2: new import_editor.Vec(o * 2.5, k * 3),
      end: A
    })
  ];
  return parts.map((c, i) => c.getSvgPathData(i === 0)).join(" ") + " Z";
}
function getHeartPoints(w, h) {
  const points = [];
  const curves = getHeartParts(w, h);
  for (let i = 0; i < curves.length; i++) {
    for (let j = 0; j < 20; j++) {
      points.push(import_editor.CubicBezier2d.GetAtT(curves[i], j / 20));
    }
    if (i === curves.length - 1) {
      points.push(import_editor.CubicBezier2d.GetAtT(curves[i], 1));
    }
  }
}
function getHeartParts(w, h) {
  const o = w / 4;
  const k = h / 4;
  return [
    new import_editor.CubicBezier2d({
      start: new import_editor.Vec(w / 2, h),
      cp1: new import_editor.Vec(o * 1.5, k * 3),
      cp2: new import_editor.Vec(0, k * 2.5),
      end: new import_editor.Vec(0, k * 1.2)
    }),
    new import_editor.CubicBezier2d({
      start: new import_editor.Vec(0, k * 1.2),
      cp1: new import_editor.Vec(0, -k * 0.32),
      cp2: new import_editor.Vec(o * 1.85, -k * 0.32),
      end: new import_editor.Vec(w / 2, k * 0.9)
    }),
    new import_editor.CubicBezier2d({
      start: new import_editor.Vec(w / 2, k * 0.9),
      cp1: new import_editor.Vec(o * 2.15, -k * 0.32),
      cp2: new import_editor.Vec(w, -k * 0.32),
      end: new import_editor.Vec(w, k * 1.2)
    }),
    new import_editor.CubicBezier2d({
      start: new import_editor.Vec(w, k * 1.2),
      cp1: new import_editor.Vec(w, k * 2.5),
      cp2: new import_editor.Vec(o * 2.5, k * 3),
      end: new import_editor.Vec(w / 2, h)
    })
  ];
}
function getEllipseStrokeOptions(strokeWidth) {
  return {
    size: 1 + strokeWidth,
    thinning: 0.25,
    end: { taper: strokeWidth },
    start: { taper: strokeWidth },
    streamline: 0,
    smoothing: 1,
    simulatePressure: false
  };
}
function getEllipseStrokePoints(id, width, height, strokeWidth) {
  const getRandom = (0, import_editor.rng)(id);
  const rx = width / 2;
  const ry = height / 2;
  const perimeter = (0, import_editor.perimeterOfEllipse)(rx, ry);
  const points = [];
  const start = import_editor.PI2 * getRandom();
  const length = import_editor.PI2 + import_editor.HALF_PI / 2 + Math.abs(getRandom()) * import_editor.HALF_PI;
  const count = Math.max(16, perimeter / 10);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const r = start + t * length;
    const c = Math.cos(r);
    const s = Math.sin(r);
    points.push(
      new import_editor.Vec(
        rx * c + width * 0.5 + 0.05 * getRandom(),
        ry * s + height / 2 + 0.05 * getRandom(),
        Math.min(
          1,
          0.5 + Math.abs(0.5 - (getRandom() > 0 ? import_editor.EASINGS.easeInOutSine(t) : import_editor.EASINGS.easeInExpo(t))) / 2
        )
      )
    );
  }
  return (0, import_getStrokePoints.getStrokePoints)(points, getEllipseStrokeOptions(strokeWidth));
}
function getEllipseDrawIndicatorPath(id, width, height, strokeWidth) {
  return (0, import_svg.getSvgPathFromStrokePoints)(getEllipseStrokePoints(id, width, height, strokeWidth));
}
function getEllipsePath(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(0, cx);
  const ry = Math.max(0, cy);
  return `M${cx - rx},${cy}a${rx},${ry},0,1,1,${rx * 2},0a${rx},${ry},0,1,1,-${rx * 2},0`;
}
function getRoundedInkyPolygonPath(points) {
  let polylineA = `M`;
  const len = points.length;
  let p0;
  let p1;
  let p2;
  for (let i = 0, n = len; i < n; i += 3) {
    p0 = points[i];
    p1 = points[i + 1];
    p2 = points[i + 2];
    polylineA += `${(0, import_editor2.precise)(p0)}L${(0, import_editor2.precise)(p1)}Q${(0, import_editor2.precise)(p2)}`;
  }
  polylineA += `${(0, import_editor2.precise)(points[0])}`;
  return polylineA;
}
function getRoundedPolygonPoints(id, outline, offset, roundness, passes) {
  const results = [];
  const random = (0, import_editor.rng)(id);
  let p0 = outline[0];
  let p1;
  const len = outline.length;
  for (let i = 0, n = len * passes; i < n; i++) {
    p1 = import_editor.Vec.AddXY(outline[(i + 1) % len], random() * offset, random() * offset);
    const delta = import_editor.Vec.Sub(p1, p0);
    const distance = import_editor.Vec.Len(delta);
    const vector = import_editor.Vec.Div(delta, distance).mul(Math.min(distance / 4, roundness));
    results.push(import_editor.Vec.Add(p0, vector), import_editor.Vec.Add(p1, vector.neg()), p1);
    p0 = p1;
  }
  return results;
}
function getPillPoints(width, height, numPoints) {
  const radius = Math.min(width, height) / 2;
  const longSide = Math.max(width, height) - radius * 2;
  const circumference = Math.PI * (radius * 2) + 2 * longSide;
  const spacing = circumference / numPoints;
  const sections = width > height ? [
    {
      type: "straight",
      start: new import_editor.Vec(radius, 0),
      delta: new import_editor.Vec(1, 0)
    },
    {
      type: "arc",
      center: new import_editor.Vec(width - radius, radius),
      startAngle: -import_editor.PI / 2
    },
    {
      type: "straight",
      start: new import_editor.Vec(width - radius, height),
      delta: new import_editor.Vec(-1, 0)
    },
    {
      type: "arc",
      center: new import_editor.Vec(radius, radius),
      startAngle: import_editor.PI / 2
    }
  ] : [
    {
      type: "straight",
      start: new import_editor.Vec(width, radius),
      delta: new import_editor.Vec(0, 1)
    },
    {
      type: "arc",
      center: new import_editor.Vec(radius, height - radius),
      startAngle: 0
    },
    {
      type: "straight",
      start: new import_editor.Vec(0, height - radius),
      delta: new import_editor.Vec(0, -1)
    },
    {
      type: "arc",
      center: new import_editor.Vec(radius, radius),
      startAngle: import_editor.PI
    }
  ];
  let sectionOffset = 0;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const section = sections[0];
    if (section.type === "straight") {
      points.push(import_editor.Vec.Add(section.start, import_editor.Vec.Mul(section.delta, sectionOffset)));
    } else {
      points.push(
        (0, import_editor.getPointOnCircle)(section.center, radius, section.startAngle + sectionOffset / radius)
      );
    }
    sectionOffset += spacing;
    let sectionLength = section.type === "straight" ? longSide : import_editor.PI * radius;
    while (sectionOffset > sectionLength) {
      sectionOffset -= sectionLength;
      sections.push(sections.shift());
      sectionLength = sections[0].type === "straight" ? longSide : import_editor.PI * radius;
    }
  }
  return points;
}
const SIZES = {
  s: 50,
  m: 70,
  l: 100,
  xl: 130
};
const BUMP_PROTRUSION = 0.2;
function getCloudArcs(width, height, seed, size, scale) {
  const getRandom = (0, import_editor.rng)(seed);
  const pillCircumference = getOvalPerimeter(width, height);
  const numBumps = Math.max(
    Math.ceil(pillCircumference / SIZES[size]),
    6,
    Math.ceil(pillCircumference / Math.min(width, height))
  );
  const targetBumpProtrusion = pillCircumference / numBumps * BUMP_PROTRUSION;
  const innerWidth = Math.max(width - targetBumpProtrusion * 2, 1);
  const innerHeight = Math.max(height - targetBumpProtrusion * 2, 1);
  const innerCircumference = getOvalPerimeter(innerWidth, innerHeight);
  const distanceBetweenPointsOnPerimeter = innerCircumference / numBumps;
  const paddingX = (width - innerWidth) / 2;
  const paddingY = (height - innerHeight) / 2;
  const bumpPoints = getPillPoints(innerWidth, innerHeight, numBumps).map((p) => {
    return p.addXY(paddingX, paddingY);
  });
  const maxWiggleX = width < 20 ? 0 : targetBumpProtrusion * 0.3;
  const maxWiggleY = height < 20 ? 0 : targetBumpProtrusion * 0.3;
  const wiggledPoints = bumpPoints.slice(0);
  for (let i = 0; i < Math.floor(numBumps / 2); i++) {
    wiggledPoints[i] = import_editor.Vec.AddXY(
      wiggledPoints[i],
      getRandom() * maxWiggleX * scale,
      getRandom() * maxWiggleY * scale
    );
    wiggledPoints[numBumps - i - 1] = import_editor.Vec.AddXY(
      wiggledPoints[numBumps - i - 1],
      getRandom() * maxWiggleX * scale,
      getRandom() * maxWiggleY * scale
    );
  }
  const arcs = [];
  for (let i = 0; i < wiggledPoints.length; i++) {
    const j = i === wiggledPoints.length - 1 ? 0 : i + 1;
    const leftWigglePoint = wiggledPoints[i];
    const rightWigglePoint = wiggledPoints[j];
    const leftPoint = bumpPoints[i];
    const rightPoint = bumpPoints[j];
    const distanceBetweenOriginalPoints = import_editor.Vec.Dist(leftPoint, rightPoint);
    const curvatureOffset = distanceBetweenPointsOnPerimeter - distanceBetweenOriginalPoints;
    const distanceBetweenWigglePoints = import_editor.Vec.Dist(leftWigglePoint, rightWigglePoint);
    const relativeSize = distanceBetweenWigglePoints / distanceBetweenOriginalPoints;
    const finalDistance = (Math.max(paddingX, paddingY) + curvatureOffset) * relativeSize;
    const arcPoint = import_editor.Vec.Lrp(leftPoint, rightPoint, 0.5).add(
      import_editor.Vec.Sub(rightPoint, leftPoint).uni().per().mul(finalDistance)
    );
    if (arcPoint.x < 0) {
      arcPoint.x = 0;
    } else if (arcPoint.x > width) {
      arcPoint.x = width;
    }
    if (arcPoint.y < 0) {
      arcPoint.y = 0;
    } else if (arcPoint.y > height) {
      arcPoint.y = height;
    }
    const center = (0, import_editor.centerOfCircleFromThreePoints)(leftWigglePoint, rightWigglePoint, arcPoint);
    const radius = import_editor.Vec.Dist(
      center ? center : import_editor.Vec.Average([leftWigglePoint, rightWigglePoint]),
      leftWigglePoint
    );
    arcs.push({
      leftPoint: leftWigglePoint,
      rightPoint: rightWigglePoint,
      arcPoint,
      center,
      radius
    });
  }
  return arcs;
}
function cloudOutline(width, height, seed, size, scale) {
  const path = [];
  const arcs = getCloudArcs(width, height, seed, size, scale);
  for (const { center, radius, leftPoint, rightPoint } of arcs) {
    path.push(...(0, import_editor.getPointsOnArc)(leftPoint, rightPoint, center, radius, 10));
  }
  return path;
}
function getCloudPath(width, height, seed, size, scale) {
  const arcs = getCloudArcs(width, height, seed, size, scale);
  let path = `M${arcs[0].leftPoint.toFixed()}`;
  for (const { leftPoint, rightPoint, radius, center } of arcs) {
    if (center === null) {
      path += ` L${rightPoint.toFixed()}`;
      continue;
    }
    const arc = import_editor.Vec.Clockwise(leftPoint, rightPoint, center) ? "0" : "1";
    path += ` A${(0, import_editor.toDomPrecision)(radius)},${(0, import_editor.toDomPrecision)(radius)} 0 ${arc},1 ${rightPoint.toFixed()}`;
  }
  path += " Z";
  return path;
}
const DRAW_OFFSETS = {
  s: 0.5,
  m: 0.7,
  l: 0.9,
  xl: 1.6
};
function inkyCloudSvgPath(width, height, seed, size, scale) {
  const getRandom = (0, import_editor.rng)(seed);
  const mutMultiplier = DRAW_OFFSETS[size] * scale;
  const arcs = getCloudArcs(width, height, seed, size, scale);
  const avgArcLengthSquared = arcs.reduce((sum, arc) => sum + import_editor.Vec.Dist2(arc.leftPoint, arc.rightPoint), 0) / arcs.length;
  const shouldMutatePoints = avgArcLengthSquared > (mutMultiplier * 15) ** 2;
  const mutPoint = shouldMutatePoints ? (p) => import_editor.Vec.AddXY(p, getRandom() * mutMultiplier * 2, getRandom() * mutMultiplier * 2) : (p) => p;
  let pathA = `M${arcs[0].leftPoint.toFixed()}`;
  let leftMutPoint = mutPoint(arcs[0].leftPoint);
  let pathB = `M${leftMutPoint.toFixed()}`;
  for (const { leftPoint, center, rightPoint, radius, arcPoint } of arcs) {
    if (center === null) {
      pathA += ` L${rightPoint.toFixed()}`;
      const rightMutPoint2 = mutPoint(rightPoint);
      pathB += ` L${rightMutPoint2.toFixed()}`;
      leftMutPoint = rightMutPoint2;
      continue;
    }
    const arc = import_editor.Vec.Clockwise(leftPoint, rightPoint, center) ? "0" : "1";
    pathA += ` A${(0, import_editor.toDomPrecision)(radius)},${(0, import_editor.toDomPrecision)(radius)} 0 ${arc},1 ${rightPoint.toFixed()}`;
    const rightMutPoint = mutPoint(rightPoint);
    const mutArcPoint = mutPoint(arcPoint);
    const mutCenter = (0, import_editor.centerOfCircleFromThreePoints)(leftMutPoint, rightMutPoint, mutArcPoint);
    if (!mutCenter) {
      pathB += ` L${rightMutPoint.toFixed()}`;
      leftMutPoint = rightMutPoint;
      continue;
    }
    const mutRadius = Math.abs(import_editor.Vec.Dist(mutCenter, leftMutPoint));
    pathB += ` A${(0, import_editor.toDomPrecision)(mutRadius)},${(0, import_editor.toDomPrecision)(
      mutRadius
    )} 0 ${arc},1 ${rightMutPoint.toFixed()}`;
    leftMutPoint = rightMutPoint;
  }
  return pathA + pathB + " Z";
}
//# sourceMappingURL=geo-shape-helpers.js.map
