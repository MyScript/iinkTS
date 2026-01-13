import { Box, HALF_PI, PI, PI2, Vec } from "@tldraw/editor";
const numArcSegmentsPerCorner = 10;
const roundedRectangleDataSize = (
  // num triangles in corners
  (// num triangles in outer rects
  4 * 6 * numArcSegmentsPerCorner + // num triangles in center rect
  12 + 4 * 12)
);
function pie(array, {
  center,
  radius,
  numArcSegments = 20,
  startAngle = 0,
  endAngle = PI2,
  offset = 0
}) {
  const angle = (endAngle - startAngle) / numArcSegments;
  let i = offset;
  for (let a = startAngle; a < endAngle; a += angle) {
    array[i++] = center.x;
    array[i++] = center.y;
    array[i++] = center.x + Math.cos(a) * radius;
    array[i++] = center.y + Math.sin(a) * radius;
    array[i++] = center.x + Math.cos(a + angle) * radius;
    array[i++] = center.y + Math.sin(a + angle) * radius;
  }
  return array;
}
function rectangle(array, offset, x, y, w, h) {
  array[offset++] = x;
  array[offset++] = y;
  array[offset++] = x;
  array[offset++] = y + h;
  array[offset++] = x + w;
  array[offset++] = y;
  array[offset++] = x + w;
  array[offset++] = y;
  array[offset++] = x;
  array[offset++] = y + h;
  array[offset++] = x + w;
  array[offset++] = y + h;
}
function roundedRectangle(data, box, radius) {
  const numArcSegments = numArcSegmentsPerCorner;
  radius = Math.min(radius, Math.min(box.w, box.h) / 2);
  const innerBox = Box.ExpandBy(box, -radius);
  if (innerBox.w <= 0 || innerBox.h <= 0) {
    pie(data, { center: box.center, radius, numArcSegments: numArcSegmentsPerCorner * 4 });
    return numArcSegmentsPerCorner * 4 * 6;
  }
  let offset = 0;
  rectangle(data, offset, innerBox.minX, innerBox.minY, innerBox.w, innerBox.h);
  offset += 12;
  rectangle(data, offset, innerBox.minX, box.minY, innerBox.w, radius);
  offset += 12;
  rectangle(data, offset, innerBox.maxX, innerBox.minY, radius, innerBox.h);
  offset += 12;
  rectangle(data, offset, innerBox.minX, innerBox.maxY, innerBox.w, radius);
  offset += 12;
  rectangle(data, offset, box.minX, innerBox.minY, radius, innerBox.h);
  offset += 12;
  pie(data, {
    numArcSegments,
    offset,
    center: innerBox.point,
    radius,
    startAngle: PI,
    endAngle: PI * 1.5
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: Vec.Add(innerBox.point, new Vec(innerBox.w, 0)),
    radius,
    startAngle: PI * 1.5,
    endAngle: PI2
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: Vec.Add(innerBox.point, innerBox.size),
    radius,
    startAngle: 0,
    endAngle: HALF_PI
  });
  offset += numArcSegments * 6;
  pie(data, {
    numArcSegments,
    offset,
    center: Vec.Add(innerBox.point, new Vec(0, innerBox.h)),
    radius,
    startAngle: HALF_PI,
    endAngle: PI
  });
  return roundedRectangleDataSize;
}
export {
  numArcSegmentsPerCorner,
  pie,
  rectangle,
  roundedRectangle,
  roundedRectangleDataSize
};
//# sourceMappingURL=minimap-webgl-shapes.mjs.map
