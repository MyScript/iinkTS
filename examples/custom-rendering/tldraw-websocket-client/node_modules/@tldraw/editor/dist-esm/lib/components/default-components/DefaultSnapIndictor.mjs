import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import classNames from "classnames";
import * as React from "react";
import { rangeIntersection } from "../../primitives/utils.mjs";
function PointsSnapIndicator({ points, zoom }) {
  const l = 2.5 / zoom;
  const minX = points.reduce((acc, p) => Math.min(acc, p.x), Infinity);
  const maxX = points.reduce((acc, p) => Math.max(acc, p.x), -Infinity);
  const minY = points.reduce((acc, p) => Math.min(acc, p.y), Infinity);
  const maxY = points.reduce((acc, p) => Math.max(acc, p.y), -Infinity);
  const useNWtoSEdireciton = points.some((p) => p.x === minX && p.y === minY);
  let firstX, firstY, secondX, secondY;
  if (useNWtoSEdireciton) {
    firstX = minX;
    firstY = minY;
    secondX = maxX;
    secondY = maxY;
  } else {
    firstX = minX;
    firstY = maxY;
    secondX = maxX;
    secondY = minY;
  }
  return /* @__PURE__ */ jsxs("g", { className: "tl-snap-indicator", stroke: "lime", children: [
    /* @__PURE__ */ jsx("line", { x1: firstX, y1: firstY, x2: secondX, y2: secondY }),
    points.map((p, i) => /* @__PURE__ */ jsx("g", { transform: `translate(${p.x},${p.y})`, children: /* @__PURE__ */ jsx(
      "path",
      {
        className: "tl-snap-point",
        d: `M ${-l},${-l} L ${l},${l} M ${-l},${l} L ${l},${-l}`
      }
    ) }, i))
  ] });
}
function GapsSnapIndicator({ gaps, direction, zoom }) {
  const l = 3.5 / zoom;
  let edgeIntersection = [-Infinity, Infinity];
  let nextEdgeIntersection = null;
  const horizontal = direction === "horizontal";
  for (const gap of gaps) {
    nextEdgeIntersection = rangeIntersection(
      edgeIntersection[0],
      edgeIntersection[1],
      horizontal ? gap.startEdge[0].y : gap.startEdge[0].x,
      horizontal ? gap.startEdge[1].y : gap.startEdge[1].x
    );
    if (nextEdgeIntersection) {
      edgeIntersection = nextEdgeIntersection;
    } else {
      continue;
    }
    nextEdgeIntersection = rangeIntersection(
      edgeIntersection[0],
      edgeIntersection[1],
      horizontal ? gap.endEdge[0].y : gap.endEdge[0].x,
      horizontal ? gap.endEdge[1].y : gap.endEdge[1].x
    );
    if (nextEdgeIntersection) {
      edgeIntersection = nextEdgeIntersection;
    } else {
      continue;
    }
  }
  if (edgeIntersection === null) {
    return null;
  }
  const midPoint = (edgeIntersection[0] + edgeIntersection[1]) / 2;
  return (
    /* @__PURE__ */ jsx("g", { className: "tl-snap-indicator", stroke: "cyan", children: gaps.map(({ startEdge, endEdge }, i) => /* @__PURE__ */ jsx(React.Fragment, { children: horizontal ? (
      // horizontal gap
      /* @__PURE__ */ (jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: startEdge[0].x,
            y1: midPoint - 2 * l,
            x2: startEdge[1].x,
            y2: midPoint + 2 * l
          }
        ),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: endEdge[0].x,
            y1: midPoint - 2 * l,
            x2: endEdge[1].x,
            y2: midPoint + 2 * l
          }
        ),
        /* @__PURE__ */ jsx("line", { x1: startEdge[0].x, y1: midPoint, x2: endEdge[0].x, y2: midPoint }),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: (startEdge[0].x + endEdge[0].x) / 2,
            y1: midPoint - l,
            x2: (startEdge[0].x + endEdge[0].x) / 2,
            y2: midPoint + l
          }
        )
      ] }))
    ) : (
      // vertical gap
      /* @__PURE__ */ (jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: midPoint - 2 * l,
            y1: startEdge[0].y,
            x2: midPoint + 2 * l,
            y2: startEdge[1].y
          }
        ),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: midPoint - 2 * l,
            y1: endEdge[0].y,
            x2: midPoint + 2 * l,
            y2: endEdge[1].y
          }
        ),
        /* @__PURE__ */ jsx("line", { x1: midPoint, y1: startEdge[0].y, x2: midPoint, y2: endEdge[0].y }),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: midPoint - l,
            y1: (startEdge[0].y + endEdge[0].y) / 2,
            x2: midPoint + l,
            y2: (startEdge[0].y + endEdge[0].y) / 2
          }
        )
      ] }))
    ) }, i)) })
  );
}
function DefaultSnapIndicator({ className, line, zoom }) {
  return /* @__PURE__ */ jsx("svg", { className: classNames("tl-overlays__item", className), "aria-hidden": "true", children: line.type === "points" ? /* @__PURE__ */ jsx(PointsSnapIndicator, { ...line, zoom }) : line.type === "gaps" ? /* @__PURE__ */ jsx(GapsSnapIndicator, { ...line, zoom }) : null });
}
export {
  DefaultSnapIndicator
};
//# sourceMappingURL=DefaultSnapIndictor.mjs.map
