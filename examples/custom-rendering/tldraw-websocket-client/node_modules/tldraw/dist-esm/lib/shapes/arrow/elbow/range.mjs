import { assert, clamp } from "@tldraw/editor";
function expandRange(range, amount) {
  const newRange = {
    min: range.min - amount,
    max: range.max + amount
  };
  if (newRange.min > newRange.max) {
    return null;
  }
  return newRange;
}
function clampToRange(value, range) {
  return clamp(value, range.min, range.max);
}
function subtractRange(a, b) {
  assert(a.min <= a.max && b.min <= b.max);
  if (a.min <= b.min && b.max <= a.max) {
    return [
      { min: a.min, max: b.min },
      { min: b.max, max: a.max }
    ];
  }
  if (b.max <= a.min || b.min >= a.max) {
    return [a];
  }
  if (b.min <= a.min && a.max <= b.max) {
    return [];
  }
  if (isWithinRange(a.min, b)) {
    return [{ min: b.max, max: a.max }];
  }
  if (isWithinRange(a.max, b)) {
    return [{ min: a.min, max: b.min }];
  }
  return [];
}
function createRange(a, b) {
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
function doRangesOverlap(a, b) {
  return a.min <= b.max && a.max >= b.min;
}
function isWithinRange(value, range) {
  return value >= range.min && value <= range.max;
}
function rangeSize(range) {
  return range.max - range.min;
}
function rangeCenter(range) {
  return (range.min + range.max) / 2;
}
export {
  clampToRange,
  createRange,
  doRangesOverlap,
  expandRange,
  isWithinRange,
  rangeCenter,
  rangeSize,
  subtractRange
};
//# sourceMappingURL=range.mjs.map
