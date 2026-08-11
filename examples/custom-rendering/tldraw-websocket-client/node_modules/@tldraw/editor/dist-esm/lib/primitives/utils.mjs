import { Vec } from "./Vec.mjs";
function precise(A) {
  return `${toDomPrecision(A.x)},${toDomPrecision(A.y)} `;
}
function average(A, B) {
  return `${toDomPrecision((A.x + B.x) / 2)},${toDomPrecision((A.y + B.y) / 2)} `;
}
const PI = Math.PI;
const HALF_PI = PI / 2;
const PI2 = PI * 2;
const SIN = Math.sin;
function clamp(n, min, max) {
  return Math.max(min, typeof max !== "undefined" ? Math.min(n, max) : n);
}
function toPrecision(n, precision = 1e10) {
  if (!n) return 0;
  return Math.round(n * precision) / precision;
}
function approximately(a, b, precision = 1e-6) {
  return Math.abs(a - b) <= precision;
}
function approximatelyLte(a, b, precision = 1e-6) {
  return a < b || approximately(a, b, precision);
}
function perimeterOfEllipse(rx, ry) {
  const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
  return PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
}
function canonicalizeRotation(a) {
  a = a % PI2;
  if (a < 0) {
    a = a + PI2;
  } else if (a === 0) {
    a = 0;
  }
  return a;
}
function clockwiseAngleDist(a0, a1) {
  a0 = canonicalizeRotation(a0);
  a1 = canonicalizeRotation(a1);
  if (a0 > a1) {
    a1 += PI2;
  }
  return a1 - a0;
}
function counterClockwiseAngleDist(a0, a1) {
  return PI2 - clockwiseAngleDist(a0, a1);
}
function shortAngleDist(a0, a1) {
  const da = (a1 - a0) % PI2;
  return 2 * da % PI2 - da;
}
function clampRadians(r) {
  return (PI2 + r) % PI2;
}
function snapAngle(r, segments) {
  const seg = PI2 / segments;
  let ang = Math.floor((clampRadians(r) + seg / 2) / seg) * seg % PI2;
  if (ang < PI) ang += PI2;
  if (ang > PI) ang -= PI2;
  return ang;
}
function areAnglesCompatible(a, b) {
  return a === b || approximately(a % (Math.PI / 2) - b % (Math.PI / 2), 0);
}
function degreesToRadians(d) {
  return d * PI / 180;
}
function radiansToDegrees(r) {
  return r * 180 / PI;
}
function getPointOnCircle(center, r, a) {
  return new Vec(center.x, center.y).add(Vec.FromAngle(a, r));
}
function getPolygonVertices(width, height, sides) {
  const cx = width / 2;
  const cy = height / 2;
  const pointsOnPerimeter = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < sides; i++) {
    const step = PI2 / sides;
    const t = -HALF_PI + i * step;
    const x = cx + cx * Math.cos(t);
    const y = cy + cy * Math.sin(t);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    pointsOnPerimeter.push(new Vec(x, y));
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const dx = width - w;
  const dy = height - h;
  if (dx !== 0 || dy !== 0) {
    for (let i = 0; i < pointsOnPerimeter.length; i++) {
      const pt = pointsOnPerimeter[i];
      pt.x = (pt.x - minX) / w * width;
      pt.y = (pt.y - minY) / h * height;
    }
  }
  return pointsOnPerimeter;
}
function rangesOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}
function rangeIntersection(a0, a1, b0, b1) {
  const min = Math.max(a0, b0);
  const max = Math.min(a1, b1);
  if (min <= max) {
    return [min, max];
  }
  return null;
}
function cross(x, y, z) {
  return (y.x - x.x) * (z.y - x.y) - (z.x - x.x) * (y.y - x.y);
}
function pointInPolygon(A, points) {
  let windingNumber = 0;
  let a;
  let b;
  for (let i = 0; i < points.length; i++) {
    a = points[i];
    if (a.x === A.x && a.y === A.y) return true;
    b = points[(i + 1) % points.length];
    if (Vec.Dist(A, a) + Vec.Dist(A, b) === Vec.Dist(a, b)) return true;
    if (a.y <= A.y) {
      if (b.y > A.y && cross(a, b, A) > 0) {
        windingNumber += 1;
      }
    } else if (b.y <= A.y && cross(a, b, A) < 0) {
      windingNumber -= 1;
    }
  }
  return windingNumber !== 0;
}
function toDomPrecision(v) {
  return Math.round(v * 1e4) / 1e4;
}
function toFixed(v) {
  return Math.round(v * 100) / 100;
}
const isSafeFloat = (n) => {
  return Math.abs(n) < Number.MAX_SAFE_INTEGER;
};
function angleDistance(fromAngle, toAngle, direction) {
  const dist = direction < 0 ? clockwiseAngleDist(fromAngle, toAngle) : counterClockwiseAngleDist(fromAngle, toAngle);
  return dist;
}
function getPointInArcT(mAB, A, B, P) {
  let mAP;
  if (Math.abs(mAB) > PI) {
    mAP = shortAngleDist(A, P);
    const mPB = shortAngleDist(P, B);
    if (Math.abs(mAP) < Math.abs(mPB)) {
      return mAP / mAB;
    } else {
      return (mAB - mPB) / mAB;
    }
  } else {
    mAP = shortAngleDist(A, P);
    const t = mAP / mAB;
    if (Math.sign(mAP) !== Math.sign(mAB)) {
      return Math.abs(t) > 0.5 ? 1 : 0;
    }
    return t;
  }
}
function getArcMeasure(A, B, sweepFlag, largeArcFlag) {
  const m = 2 * ((B - A) % PI2) % PI2 - (B - A) % PI2;
  if (!largeArcFlag) return m;
  return (PI2 - Math.abs(m)) * (sweepFlag ? 1 : -1);
}
function centerOfCircleFromThreePoints(a, b, c) {
  const u = -2 * (a.x * (b.y - c.y) - a.y * (b.x - c.x) + b.x * c.y - c.x * b.y);
  const x = ((a.x * a.x + a.y * a.y) * (c.y - b.y) + (b.x * b.x + b.y * b.y) * (a.y - c.y) + (c.x * c.x + c.y * c.y) * (b.y - a.y)) / u;
  const y = ((a.x * a.x + a.y * a.y) * (b.x - c.x) + (b.x * b.x + b.y * b.y) * (c.x - a.x) + (c.x * c.x + c.y * c.y) * (a.x - b.x)) / u;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return new Vec(x, y);
}
function getPointsOnArc(startPoint, endPoint, center, radius, numPoints) {
  if (center === null) {
    return [Vec.From(startPoint), Vec.From(endPoint)];
  }
  const results = [];
  const startAngle = Vec.Angle(center, startPoint);
  const endAngle = Vec.Angle(center, endPoint);
  const l = clockwiseAngleDist(startAngle, endAngle);
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = startAngle + l * t;
    const point = getPointOnCircle(center, radius, angle);
    results.push(point);
  }
  return results;
}
export {
  HALF_PI,
  PI,
  PI2,
  SIN,
  angleDistance,
  approximately,
  approximatelyLte,
  areAnglesCompatible,
  average,
  canonicalizeRotation,
  centerOfCircleFromThreePoints,
  clamp,
  clampRadians,
  clockwiseAngleDist,
  counterClockwiseAngleDist,
  degreesToRadians,
  getArcMeasure,
  getPointInArcT,
  getPointOnCircle,
  getPointsOnArc,
  getPolygonVertices,
  isSafeFloat,
  perimeterOfEllipse,
  pointInPolygon,
  precise,
  radiansToDegrees,
  rangeIntersection,
  rangesOverlap,
  shortAngleDist,
  snapAngle,
  toDomPrecision,
  toFixed,
  toPrecision
};
//# sourceMappingURL=utils.mjs.map
