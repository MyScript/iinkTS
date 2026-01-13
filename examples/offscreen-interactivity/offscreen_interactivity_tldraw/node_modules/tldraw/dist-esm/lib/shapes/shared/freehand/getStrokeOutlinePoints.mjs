import { Vec } from "@tldraw/editor";
const { PI } = Math;
const FIXED_PI = PI + 1e-4;
function getStrokeOutlineTracks(strokePoints, options = {}) {
  const { size = 16, smoothing = 0.5 } = options;
  if (strokePoints.length === 0 || size <= 0) {
    return { left: [], right: [] };
  }
  const firstStrokePoint = strokePoints[0];
  const lastStrokePoint = strokePoints[strokePoints.length - 1];
  const totalLength = lastStrokePoint.runningLength;
  const minDistance = Math.pow(size * smoothing, 2);
  const leftPts = [];
  const rightPts = [];
  let prevVector = strokePoints[0].vector;
  let pl = strokePoints[0].point;
  let pr = pl;
  let tl = pl;
  let tr = pr;
  let isPrevPointSharpCorner = false;
  let strokePoint;
  for (let i = 0; i < strokePoints.length; i++) {
    strokePoint = strokePoints[i];
    const { point, vector } = strokePoints[i];
    const prevDpr = strokePoint.vector.dpr(prevVector);
    const nextVector = (i < strokePoints.length - 1 ? strokePoints[i + 1] : strokePoints[i]).vector;
    const nextDpr = i < strokePoints.length - 1 ? nextVector.dpr(strokePoint.vector) : 1;
    const isPointSharpCorner = prevDpr < 0 && !isPrevPointSharpCorner;
    const isNextPointSharpCorner = nextDpr !== null && nextDpr < 0.2;
    if (isPointSharpCorner || isNextPointSharpCorner) {
      if (nextDpr > -0.62 && totalLength - strokePoint.runningLength > strokePoint.radius) {
        const offset2 = prevVector.clone().mul(strokePoint.radius);
        const cpr = prevVector.clone().cpr(nextVector);
        if (cpr < 0) {
          tl = Vec.Add(point, offset2);
          tr = Vec.Sub(point, offset2);
        } else {
          tl = Vec.Sub(point, offset2);
          tr = Vec.Add(point, offset2);
        }
        leftPts.push(tl);
        rightPts.push(tr);
      } else {
        const offset2 = prevVector.clone().mul(strokePoint.radius).per();
        const start = Vec.Sub(strokePoint.input, offset2);
        for (let step = 1 / 13, t = 0; t < 1; t += step) {
          tl = Vec.RotWith(start, strokePoint.input, FIXED_PI * t);
          leftPts.push(tl);
          tr = Vec.RotWith(start, strokePoint.input, FIXED_PI + FIXED_PI * -t);
          rightPts.push(tr);
        }
      }
      pl = tl;
      pr = tr;
      if (isNextPointSharpCorner) {
        isPrevPointSharpCorner = true;
      }
      continue;
    }
    isPrevPointSharpCorner = false;
    if (strokePoint === firstStrokePoint || strokePoint === lastStrokePoint) {
      const offset2 = Vec.Per(vector).mul(strokePoint.radius);
      leftPts.push(Vec.Sub(point, offset2));
      rightPts.push(Vec.Add(point, offset2));
      continue;
    }
    const offset = Vec.Lrp(nextVector, vector, nextDpr).per().mul(strokePoint.radius);
    tl = Vec.Sub(point, offset);
    if (i <= 1 || Vec.Dist2(pl, tl) > minDistance) {
      leftPts.push(tl);
      pl = tl;
    }
    tr = Vec.Add(point, offset);
    if (i <= 1 || Vec.Dist2(pr, tr) > minDistance) {
      rightPts.push(tr);
      pr = tr;
    }
    prevVector = vector;
    continue;
  }
  return {
    left: leftPts,
    right: rightPts
  };
}
function getStrokeOutlinePoints(strokePoints, options = {}) {
  const { size = 16, start = {}, end = {}, last: isComplete = false } = options;
  const { cap: capStart = true } = start;
  const { cap: capEnd = true } = end;
  if (strokePoints.length === 0 || size <= 0) {
    return [];
  }
  const firstStrokePoint = strokePoints[0];
  const lastStrokePoint = strokePoints[strokePoints.length - 1];
  const totalLength = lastStrokePoint.runningLength;
  const taperStart = start.taper === false ? 0 : start.taper === true ? Math.max(size, totalLength) : start.taper;
  const taperEnd = end.taper === false ? 0 : end.taper === true ? Math.max(size, totalLength) : end.taper;
  const { left: leftPts, right: rightPts } = getStrokeOutlineTracks(strokePoints, options);
  const firstPoint = firstStrokePoint.point;
  const lastPoint = strokePoints.length > 1 ? strokePoints[strokePoints.length - 1].point : Vec.AddXY(firstStrokePoint.point, 1, 1);
  if (strokePoints.length === 1) {
    if (!(taperStart || taperEnd) || isComplete) {
      const start2 = Vec.Add(
        firstPoint,
        Vec.Sub(firstPoint, lastPoint).uni().per().mul(-firstStrokePoint.radius)
      );
      const dotPts = [];
      for (let step = 1 / 13, t = step; t <= 1; t += step) {
        dotPts.push(Vec.RotWith(start2, firstPoint, FIXED_PI * 2 * t));
      }
      return dotPts;
    }
  }
  const startCap = [];
  if (taperStart || taperEnd && strokePoints.length === 1) {
  } else if (capStart) {
    for (let step = 1 / 8, t = step; t <= 1; t += step) {
      const pt = Vec.RotWith(rightPts[0], firstPoint, FIXED_PI * t);
      startCap.push(pt);
    }
  } else {
    const cornersVector = Vec.Sub(leftPts[0], rightPts[0]);
    const offsetA = Vec.Mul(cornersVector, 0.5);
    const offsetB = Vec.Mul(cornersVector, 0.51);
    startCap.push(
      Vec.Sub(firstPoint, offsetA),
      Vec.Sub(firstPoint, offsetB),
      Vec.Add(firstPoint, offsetB),
      Vec.Add(firstPoint, offsetA)
    );
  }
  const endCap = [];
  const direction = lastStrokePoint.vector.clone().per().neg();
  if (taperEnd || taperStart && strokePoints.length === 1) {
    endCap.push(lastPoint);
  } else if (capEnd) {
    const start2 = Vec.Add(lastPoint, Vec.Mul(direction, lastStrokePoint.radius));
    for (let step = 1 / 29, t = step; t < 1; t += step) {
      endCap.push(Vec.RotWith(start2, lastPoint, FIXED_PI * 3 * t));
    }
  } else {
    endCap.push(
      Vec.Add(lastPoint, Vec.Mul(direction, lastStrokePoint.radius)),
      Vec.Add(lastPoint, Vec.Mul(direction, lastStrokePoint.radius * 0.99)),
      Vec.Sub(lastPoint, Vec.Mul(direction, lastStrokePoint.radius * 0.99)),
      Vec.Sub(lastPoint, Vec.Mul(direction, lastStrokePoint.radius))
    );
  }
  return leftPts.concat(endCap, rightPts.reverse(), startCap);
}
export {
  getStrokeOutlinePoints,
  getStrokeOutlineTracks
};
//# sourceMappingURL=getStrokeOutlinePoints.mjs.map
