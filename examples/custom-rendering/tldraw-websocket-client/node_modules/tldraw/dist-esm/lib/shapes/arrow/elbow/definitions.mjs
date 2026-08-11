import { Vec } from "@tldraw/editor";
const ElbowArrowSides = ["right", "bottom", "left", "top"];
const ElbowArrowSideDeltas = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
const ElbowArrowSideAxes = {
  left: "x",
  right: "x",
  top: "y",
  bottom: "y"
};
const ElbowArrowSideOpposites = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
};
const ElbowArrowAxes = {
  x: {
    v: (x, y) => new Vec(x, y),
    loEdge: "left",
    hiEdge: "right",
    crossMid: "midY",
    gap: "gapX",
    midRange: "midXRange",
    self: "x",
    cross: "y",
    size: "width"
  },
  y: {
    v: (y, x) => new Vec(x, y),
    loEdge: "top",
    hiEdge: "bottom",
    crossMid: "midX",
    gap: "gapY",
    midRange: "midYRange",
    self: "y",
    cross: "x",
    size: "height"
  }
};
export {
  ElbowArrowAxes,
  ElbowArrowSideAxes,
  ElbowArrowSideDeltas,
  ElbowArrowSideOpposites,
  ElbowArrowSides
};
//# sourceMappingURL=definitions.mjs.map
