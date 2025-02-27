import { EASINGS } from "@tldraw/editor";
const { min } = Math;
const RATE_OF_PRESSURE_CHANGE = 0.275;
function setStrokePointRadii(strokePoints, options) {
  const {
    size = 16,
    thinning = 0.5,
    simulatePressure = true,
    easing = (t) => t,
    start = {},
    end = {}
  } = options;
  const { easing: taperStartEase = EASINGS.easeOutQuad } = start;
  const { easing: taperEndEase = EASINGS.easeOutCubic } = end;
  const totalLength = strokePoints[strokePoints.length - 1].runningLength;
  let firstRadius;
  let prevPressure = strokePoints[0].pressure;
  let strokePoint;
  if (!simulatePressure && totalLength < size) {
    const max = strokePoints.reduce((max2, curr) => Math.max(max2, curr.pressure), 0.5);
    strokePoints.forEach((sp) => {
      sp.pressure = max;
      sp.radius = size * easing(0.5 - thinning * (0.5 - sp.pressure));
    });
    return strokePoints;
  } else {
    let p;
    for (let i = 0, n = strokePoints.length; i < n; i++) {
      strokePoint = strokePoints[i];
      if (strokePoint.runningLength > size * 5) break;
      const sp = min(1, strokePoint.distance / size);
      if (simulatePressure) {
        const rp = min(1, 1 - sp);
        p = min(1, prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE));
      } else {
        p = min(1, prevPressure + (strokePoint.pressure - prevPressure) * 0.5);
      }
      prevPressure = prevPressure + (p - prevPressure) * 0.5;
    }
    for (let i = 0; i < strokePoints.length; i++) {
      strokePoint = strokePoints[i];
      if (thinning) {
        let { pressure } = strokePoint;
        const sp = min(1, strokePoint.distance / size);
        if (simulatePressure) {
          const rp = min(1, 1 - sp);
          pressure = min(1, prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE));
        } else {
          pressure = min(
            1,
            prevPressure + (pressure - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE)
          );
        }
        strokePoint.radius = size * easing(0.5 - thinning * (0.5 - pressure));
        prevPressure = pressure;
      } else {
        strokePoint.radius = size / 2;
      }
      if (firstRadius === void 0) {
        firstRadius = strokePoint.radius;
      }
    }
  }
  const taperStart = start.taper === false ? 0 : start.taper === true ? Math.max(size, totalLength) : start.taper;
  const taperEnd = end.taper === false ? 0 : end.taper === true ? Math.max(size, totalLength) : end.taper;
  if (taperStart || taperEnd) {
    for (let i = 0; i < strokePoints.length; i++) {
      strokePoint = strokePoints[i];
      const { runningLength } = strokePoint;
      const ts = runningLength < taperStart ? taperStartEase(runningLength / taperStart) : 1;
      const te = totalLength - runningLength < taperEnd ? taperEndEase((totalLength - runningLength) / taperEnd) : 1;
      strokePoint.radius = Math.max(0.01, strokePoint.radius * Math.min(ts, te));
    }
  }
  return strokePoints;
}
export {
  setStrokePointRadii
};
//# sourceMappingURL=setStrokePointRadii.mjs.map
