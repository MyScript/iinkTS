import { Vec } from "@tldraw/editor";
function flipEdgeCrossInPlace(edge) {
  if (!edge) return;
  const tmp = edge.cross.min;
  edge.cross.min = -edge.cross.max;
  edge.cross.max = -tmp;
  edge.crossTarget = -edge.crossTarget;
}
function flipEdgeValueInPlace(edge) {
  if (!edge) return;
  edge.value = -edge.value;
  edge.expanded = edge.expanded === null ? null : -edge.expanded;
}
const ElbowArrowTransform = {
  Identity: { x: 1, y: 1, transpose: false },
  Rotate90: { x: -1, y: 1, transpose: true },
  Rotate180: { x: -1, y: -1, transpose: false },
  Rotate270: { x: 1, y: -1, transpose: true },
  FlipX: { x: -1, y: 1, transpose: false },
  FlipY: { x: 1, y: -1, transpose: false }
};
function invertElbowArrowTransform(transform) {
  if (transform.transpose) {
    return {
      x: transform.y,
      y: transform.x,
      transpose: true
    };
  }
  return transform;
}
function transformElbowArrowTransform(a, b) {
  const next = { ...a };
  if (b.transpose) {
    swap(next, "x", "y");
    next.transpose = !next.transpose;
  }
  if (b.x === -1) {
    next.x = -next.x;
  }
  if (b.y === -1) {
    next.y = -next.y;
  }
  return next;
}
function swap(object, a, b) {
  const temp = object[a];
  object[a] = object[b];
  object[b] = temp;
}
function transformVecInPlace(transform, point) {
  point.x = transform.x * point.x;
  point.y = transform.y * point.y;
  if (transform.transpose) {
    swap(point, "x", "y");
  }
}
function transformBoxInPlace(transform, box) {
  if (transform.x === -1) {
    box.x = -(box.x + box.width);
  }
  if (transform.y === -1) {
    box.y = -(box.y + box.height);
  }
  if (transform.transpose) {
    swap(box, "x", "y");
    swap(box, "width", "height");
  }
}
function transformEdgesInPlace(transform, edges) {
  if (transform.x === -1) {
    swap(edges, "left", "right");
    flipEdgeCrossInPlace(edges.top);
    flipEdgeCrossInPlace(edges.bottom);
    flipEdgeValueInPlace(edges.left);
    flipEdgeValueInPlace(edges.right);
  }
  if (transform.y === -1) {
    swap(edges, "top", "bottom");
    flipEdgeCrossInPlace(edges.left);
    flipEdgeCrossInPlace(edges.right);
    flipEdgeValueInPlace(edges.top);
    flipEdgeValueInPlace(edges.bottom);
  }
  if (transform.transpose) {
    swap(edges, "left", "top");
    swap(edges, "right", "bottom");
  }
}
function debugElbowArrowTransform(transform) {
  switch (`${transform.transpose ? "t" : ""}${transform.x === -1 ? "x" : ""}${transform.y === -1 ? "y" : ""}`) {
    case "":
      return "Identity";
    case "t":
      return "Transpose";
    case "x":
      return "FlipX";
    case "y":
      return "FlipY";
    case "tx":
      return "Rotate90";
    case "ty":
      return "Rotate270";
    case "xy":
      return "Rotate180";
    case "txy":
      return "spooky (transpose + flip both)";
    default:
      throw new Error("Unknown transform");
  }
}
class ElbowArrowWorkingInfo {
  options;
  A;
  B;
  common;
  gapX;
  gapY;
  midX;
  midY;
  bias;
  constructor(info) {
    this.options = info.options;
    this.A = info.A;
    this.B = info.B;
    this.common = info.common;
    this.midX = info.midX;
    this.midY = info.midY;
    this.gapX = info.gapX;
    this.gapY = info.gapY;
    this.bias = new Vec(1, 1);
  }
  transform = ElbowArrowTransform.Identity;
  inverse = ElbowArrowTransform.Identity;
  apply(transform) {
    this.transform = transformElbowArrowTransform(transform, this.transform);
    this.inverse = invertElbowArrowTransform(this.transform);
    transformBoxInPlace(transform, this.A.original);
    transformBoxInPlace(transform, this.B.original);
    transformBoxInPlace(transform, this.common.original);
    transformBoxInPlace(transform, this.A.expanded);
    transformBoxInPlace(transform, this.B.expanded);
    transformBoxInPlace(transform, this.common.expanded);
    transformEdgesInPlace(transform, this.A.edges);
    transformEdgesInPlace(transform, this.B.edges);
    transformVecInPlace(transform, this.bias);
    if (transform.x === -1) {
      this.gapX = -this.gapX;
      this.midX = this.midX === null ? null : -this.midX;
    }
    if (transform.y === -1) {
      this.gapY = -this.gapY;
      this.midY = this.midY === null ? null : -this.midY;
    }
    if (transform.transpose) {
      let temp = this.midX;
      this.midX = this.midY;
      this.midY = temp;
      temp = this.gapX;
      this.gapX = this.gapY;
      this.gapY = temp;
    }
  }
  reset() {
    this.apply(this.inverse);
  }
  vec(x, y) {
    const point = new Vec(x, y);
    transformVecInPlace(this.inverse, point);
    return point;
  }
}
export {
  ElbowArrowTransform,
  ElbowArrowWorkingInfo,
  debugElbowArrowTransform,
  transformElbowArrowTransform
};
//# sourceMappingURL=ElbowArrowWorkingInfo.mjs.map
