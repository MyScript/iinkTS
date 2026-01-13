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
var GeoShapeUtil_exports = {};
__export(GeoShapeUtil_exports, {
  GeoShapeUtil: () => GeoShapeUtil
});
module.exports = __toCommonJS(GeoShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_HyperlinkButton = require("../shared/HyperlinkButton");
var import_SvgTextLabel = require("../shared/SvgTextLabel");
var import_TextLabel = require("../shared/TextLabel");
var import_default_shape_constants = require("../shared/default-shape-constants");
var import_defaultStyleDefs = require("../shared/defaultStyleDefs");
var import_useDefaultColorTheme = require("../shared/useDefaultColorTheme");
var import_GeoShapeBody = require("./components/GeoShapeBody");
var import_geo_shape_helpers = require("./geo-shape-helpers");
var import_getLines = require("./getLines");
const MIN_SIZE_WITH_LABEL = 17 * 3;
class GeoShapeUtil extends import_editor.BaseBoxShapeUtil {
  static type = "geo";
  static props = import_editor.geoShapeProps;
  static migrations = import_editor.geoShapeMigrations;
  canEdit() {
    return true;
  }
  getDefaultProps() {
    return {
      w: 100,
      h: 100,
      geo: "rectangle",
      color: "black",
      labelColor: "black",
      fill: "none",
      dash: "draw",
      size: "m",
      font: "draw",
      text: "",
      align: "middle",
      verticalAlign: "middle",
      growY: 0,
      url: "",
      scale: 1
    };
  }
  getGeometry(shape) {
    const w = Math.max(1, shape.props.w);
    const h = Math.max(1, shape.props.h + shape.props.growY);
    const cx = w / 2;
    const cy = h / 2;
    const isFilled = shape.props.fill !== "none";
    let body;
    switch (shape.props.geo) {
      case "cloud": {
        body = new import_editor.Polygon2d({
          points: (0, import_geo_shape_helpers.cloudOutline)(w, h, shape.id, shape.props.size, shape.props.scale),
          isFilled
        });
        break;
      }
      case "triangle": {
        body = new import_editor.Polygon2d({
          points: [new import_editor.Vec(cx, 0), new import_editor.Vec(w, h), new import_editor.Vec(0, h)],
          isFilled
        });
        break;
      }
      case "diamond": {
        body = new import_editor.Polygon2d({
          points: [new import_editor.Vec(cx, 0), new import_editor.Vec(w, cy), new import_editor.Vec(cx, h), new import_editor.Vec(0, cy)],
          isFilled
        });
        break;
      }
      case "pentagon": {
        body = new import_editor.Polygon2d({
          points: (0, import_editor.getPolygonVertices)(w, h, 5),
          isFilled
        });
        break;
      }
      case "hexagon": {
        body = new import_editor.Polygon2d({
          points: (0, import_editor.getPolygonVertices)(w, h, 6),
          isFilled
        });
        break;
      }
      case "octagon": {
        body = new import_editor.Polygon2d({
          points: (0, import_editor.getPolygonVertices)(w, h, 8),
          isFilled
        });
        break;
      }
      case "ellipse": {
        body = new import_editor.Ellipse2d({
          width: w,
          height: h,
          isFilled
        });
        break;
      }
      case "oval": {
        body = new import_editor.Stadium2d({
          width: w,
          height: h,
          isFilled
        });
        break;
      }
      case "star": {
        const sides = 5;
        const step = import_editor.PI2 / sides / 2;
        const rightMostIndex = Math.floor(sides / 4) * 2;
        const leftMostIndex = sides * 2 - rightMostIndex;
        const topMostIndex = 0;
        const bottomMostIndex = Math.floor(sides / 2) * 2;
        const maxX = Math.cos(-import_editor.HALF_PI + rightMostIndex * step) * w / 2;
        const minX = Math.cos(-import_editor.HALF_PI + leftMostIndex * step) * w / 2;
        const minY = Math.sin(-import_editor.HALF_PI + topMostIndex * step) * h / 2;
        const maxY = Math.sin(-import_editor.HALF_PI + bottomMostIndex * step) * h / 2;
        const diffX = w - Math.abs(maxX - minX);
        const diffY = h - Math.abs(maxY - minY);
        const offsetX = w / 2 + minX - (w / 2 - maxX);
        const offsetY = h / 2 + minY - (h / 2 - maxY);
        const ratio = 1;
        const cx2 = (w - offsetX) / 2;
        const cy2 = (h - offsetY) / 2;
        const ox = (w + diffX) / 2;
        const oy = (h + diffY) / 2;
        const ix = ox * ratio / 2;
        const iy = oy * ratio / 2;
        body = new import_editor.Polygon2d({
          points: Array.from(Array(sides * 2)).map((_, i) => {
            const theta = -import_editor.HALF_PI + i * step;
            return new import_editor.Vec(
              cx2 + (i % 2 ? ix : ox) * Math.cos(theta),
              cy2 + (i % 2 ? iy : oy) * Math.sin(theta)
            );
          }),
          isFilled
        });
        break;
      }
      case "rhombus": {
        const offset = Math.min(w * 0.38, h * 0.38);
        body = new import_editor.Polygon2d({
          points: [new import_editor.Vec(offset, 0), new import_editor.Vec(w, 0), new import_editor.Vec(w - offset, h), new import_editor.Vec(0, h)],
          isFilled
        });
        break;
      }
      case "rhombus-2": {
        const offset = Math.min(w * 0.38, h * 0.38);
        body = new import_editor.Polygon2d({
          points: [new import_editor.Vec(0, 0), new import_editor.Vec(w - offset, 0), new import_editor.Vec(w, h), new import_editor.Vec(offset, h)],
          isFilled
        });
        break;
      }
      case "trapezoid": {
        const offset = Math.min(w * 0.38, h * 0.38);
        body = new import_editor.Polygon2d({
          points: [new import_editor.Vec(offset, 0), new import_editor.Vec(w - offset, 0), new import_editor.Vec(w, h), new import_editor.Vec(0, h)],
          isFilled
        });
        break;
      }
      case "arrow-right": {
        const ox = Math.min(w, h) * 0.38;
        const oy = h * 0.16;
        body = new import_editor.Polygon2d({
          points: [
            new import_editor.Vec(0, oy),
            new import_editor.Vec(w - ox, oy),
            new import_editor.Vec(w - ox, 0),
            new import_editor.Vec(w, h / 2),
            new import_editor.Vec(w - ox, h),
            new import_editor.Vec(w - ox, h - oy),
            new import_editor.Vec(0, h - oy)
          ],
          isFilled
        });
        break;
      }
      case "arrow-left": {
        const ox = Math.min(w, h) * 0.38;
        const oy = h * 0.16;
        body = new import_editor.Polygon2d({
          points: [
            new import_editor.Vec(ox, 0),
            new import_editor.Vec(ox, oy),
            new import_editor.Vec(w, oy),
            new import_editor.Vec(w, h - oy),
            new import_editor.Vec(ox, h - oy),
            new import_editor.Vec(ox, h),
            new import_editor.Vec(0, h / 2)
          ],
          isFilled
        });
        break;
      }
      case "arrow-up": {
        const ox = w * 0.16;
        const oy = Math.min(w, h) * 0.38;
        body = new import_editor.Polygon2d({
          points: [
            new import_editor.Vec(w / 2, 0),
            new import_editor.Vec(w, oy),
            new import_editor.Vec(w - ox, oy),
            new import_editor.Vec(w - ox, h),
            new import_editor.Vec(ox, h),
            new import_editor.Vec(ox, oy),
            new import_editor.Vec(0, oy)
          ],
          isFilled
        });
        break;
      }
      case "arrow-down": {
        const ox = w * 0.16;
        const oy = Math.min(w, h) * 0.38;
        body = new import_editor.Polygon2d({
          points: [
            new import_editor.Vec(ox, 0),
            new import_editor.Vec(w - ox, 0),
            new import_editor.Vec(w - ox, h - oy),
            new import_editor.Vec(w, h - oy),
            new import_editor.Vec(w / 2, h),
            new import_editor.Vec(0, h - oy),
            new import_editor.Vec(ox, h - oy)
          ],
          isFilled
        });
        break;
      }
      case "check-box":
      case "x-box":
      case "rectangle": {
        body = new import_editor.Rectangle2d({
          width: w,
          height: h,
          isFilled
        });
        break;
      }
      case "heart": {
        const parts = (0, import_geo_shape_helpers.getHeartParts)(w, h);
        const points = parts.reduce((acc, part) => {
          acc.push(...part.vertices);
          return acc;
        }, []);
        body = new import_editor.Polygon2d({
          points,
          isFilled
        });
        break;
      }
      default: {
        (0, import_editor.exhaustiveSwitchError)(shape.props.geo);
      }
    }
    const unscaledlabelSize = getUnscaledLabelSize(this.editor, shape);
    const unscaledW = w / shape.props.scale;
    const unscaledH = h / shape.props.scale;
    const unscaledminWidth = Math.min(100, unscaledW / 2);
    const unscaledMinHeight = Math.min(
      import_default_shape_constants.LABEL_FONT_SIZES[shape.props.size] * import_default_shape_constants.TEXT_PROPS.lineHeight + import_default_shape_constants.LABEL_PADDING * 2,
      unscaledH / 2
    );
    const unscaledLabelWidth = Math.min(
      unscaledW,
      Math.max(unscaledlabelSize.w, Math.min(unscaledminWidth, Math.max(1, unscaledW - 8)))
    );
    const unscaledLabelHeight = Math.min(
      unscaledH,
      Math.max(unscaledlabelSize.h, Math.min(unscaledMinHeight, Math.max(1, unscaledH - 8)))
    );
    const lines = (0, import_getLines.getLines)(shape.props, import_default_shape_constants.STROKE_SIZES[shape.props.size] * shape.props.scale);
    const edges = lines ? lines.map((line) => new import_editor.Polyline2d({ points: line })) : [];
    return new import_editor.Group2d({
      children: [
        body,
        new import_editor.Rectangle2d({
          x: shape.props.align === "start" ? 0 : shape.props.align === "end" ? (unscaledW - unscaledLabelWidth) * shape.props.scale : (unscaledW - unscaledLabelWidth) / 2 * shape.props.scale,
          y: shape.props.verticalAlign === "start" ? 0 : shape.props.verticalAlign === "end" ? (unscaledH - unscaledLabelHeight) * shape.props.scale : (unscaledH - unscaledLabelHeight) / 2 * shape.props.scale,
          width: unscaledLabelWidth * shape.props.scale,
          height: unscaledLabelHeight * shape.props.scale,
          isFilled: true,
          isLabel: true
        }),
        ...edges
      ]
    });
  }
  getHandleSnapGeometry(shape) {
    const geometry = this.getGeometry(shape);
    const outline = geometry.children[0];
    switch (shape.props.geo) {
      case "arrow-down":
      case "arrow-left":
      case "arrow-right":
      case "arrow-up":
      case "check-box":
      case "diamond":
      case "hexagon":
      case "octagon":
      case "pentagon":
      case "rectangle":
      case "rhombus":
      case "rhombus-2":
      case "star":
      case "trapezoid":
      case "triangle":
      case "x-box":
        return { outline, points: [...outline.getVertices(), geometry.bounds.center] };
      case "cloud":
      case "ellipse":
      case "heart":
      case "oval":
        return { outline, points: [geometry.bounds.center] };
      default:
        (0, import_editor.exhaustiveSwitchError)(shape.props.geo);
    }
  }
  getText(shape) {
    return shape.props.text;
  }
  onEditEnd(shape) {
    const {
      id,
      type,
      props: { text }
    } = shape;
    if (text.trimEnd() !== shape.props.text) {
      this.editor.updateShapes([
        {
          id,
          type,
          props: {
            text: text.trimEnd()
          }
        }
      ]);
    }
  }
  component(shape) {
    const { id, type, props } = shape;
    const { fill, font, align, verticalAlign, size, text } = props;
    const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
    const { editor } = this;
    const isOnlySelected = (0, import_editor.useValue)(
      "isGeoOnlySelected",
      () => shape.id === editor.getOnlySelectedShapeId(),
      []
    );
    const isEditingAnything = editor.getEditingShapeId() !== null;
    const showHtmlContainer = isEditingAnything || shape.props.text;
    const isForceSolid = (0, import_editor.useValue)(
      "force solid",
      () => {
        return editor.getZoomLevel() < 0.2;
      },
      [editor]
    );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.SVGContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_GeoShapeBody.GeoShapeBody, { shape, shouldScale: true, forceSolid: isForceSolid }) }),
      showHtmlContainer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_editor.HTMLContainer,
        {
          style: {
            overflow: "hidden",
            width: shape.props.w,
            height: shape.props.h + props.growY
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_TextLabel.TextLabel,
            {
              shapeId: id,
              type,
              font,
              fontSize: import_default_shape_constants.LABEL_FONT_SIZES[size] * shape.props.scale,
              lineHeight: import_default_shape_constants.TEXT_PROPS.lineHeight,
              padding: import_default_shape_constants.LABEL_PADDING * shape.props.scale,
              fill,
              align,
              verticalAlign,
              text,
              isSelected: isOnlySelected,
              labelColor: theme[props.labelColor].solid,
              wrap: true
            }
          )
        }
      ),
      shape.props.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_HyperlinkButton.HyperlinkButton, { url: shape.props.url })
    ] });
  }
  indicator(shape) {
    const { id, props } = shape;
    const { w, size } = props;
    const h = props.h + props.growY;
    const strokeWidth = import_default_shape_constants.STROKE_SIZES[size];
    const geometry = this.editor.getShapeGeometry(shape);
    switch (props.geo) {
      case "ellipse": {
        if (props.dash === "draw") {
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: (0, import_geo_shape_helpers.getEllipseDrawIndicatorPath)(id, w, h, strokeWidth) });
        }
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: geometry.getSvgPathData(true) });
      }
      case "heart": {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: (0, import_geo_shape_helpers.getHeartPath)(w, h) });
      }
      case "oval": {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: geometry.getSvgPathData(true) });
      }
      case "cloud": {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: (0, import_geo_shape_helpers.getCloudPath)(w, h, id, size, shape.props.scale) });
      }
      default: {
        const geometry2 = this.editor.getShapeGeometry(shape);
        const outline = geometry2 instanceof import_editor.Group2d ? geometry2.children[0].vertices : geometry2.vertices;
        let path;
        if (props.dash === "draw") {
          const polygonPoints = (0, import_geo_shape_helpers.getRoundedPolygonPoints)(
            id,
            outline,
            0,
            strokeWidth * 2 * shape.props.scale,
            1
          );
          path = (0, import_geo_shape_helpers.getRoundedInkyPolygonPath)(polygonPoints);
        } else {
          path = "M" + outline[0] + "L" + outline.slice(1) + "Z";
        }
        const lines = (0, import_getLines.getLines)(shape.props, strokeWidth);
        if (lines) {
          for (const [A, B] of lines) {
            path += `M${A.x},${A.y}L${B.x},${B.y}`;
          }
        }
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path });
      }
    }
  }
  toSvg(shape, ctx) {
    const newShape = {
      ...shape,
      props: {
        ...shape.props,
        w: shape.props.w / shape.props.scale,
        h: shape.props.h / shape.props.scale
      }
    };
    const props = newShape.props;
    ctx.addExportDef((0, import_defaultStyleDefs.getFillDefForExport)(props.fill));
    let textEl;
    if (props.text) {
      ctx.addExportDef((0, import_defaultStyleDefs.getFontDefForExport)(props.font));
      const theme = (0, import_editor.getDefaultColorTheme)(ctx);
      const bounds = new import_editor.Box(0, 0, props.w, props.h + props.growY);
      textEl = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_SvgTextLabel.SvgTextLabel,
        {
          fontSize: import_default_shape_constants.LABEL_FONT_SIZES[props.size],
          font: props.font,
          align: props.align,
          verticalAlign: props.verticalAlign,
          text: props.text,
          labelColor: theme[props.labelColor].solid,
          bounds,
          padding: 16
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_GeoShapeBody.GeoShapeBody, { shouldScale: false, shape: newShape, forceSolid: false }),
      textEl
    ] });
  }
  getCanvasSvgDefs() {
    return [(0, import_defaultStyleDefs.getFillDefForCanvas)()];
  }
  onResize(shape, { handle, newPoint, scaleX, scaleY, initialShape }) {
    const unscaledInitialW = initialShape.props.w / initialShape.props.scale;
    const unscaledInitialH = initialShape.props.h / initialShape.props.scale;
    const unscaledGrowY = initialShape.props.growY / initialShape.props.scale;
    let unscaledW = unscaledInitialW * scaleX;
    let unscaledH = (unscaledInitialH + unscaledGrowY) * scaleY;
    let overShrinkX = 0;
    let overShrinkY = 0;
    const min = MIN_SIZE_WITH_LABEL;
    if (shape.props.text.trim()) {
      let newW = Math.max(Math.abs(unscaledW), min);
      let newH = Math.max(Math.abs(unscaledH), min);
      if (newW < min && newH === min) newW = min;
      if (newW === min && newH < min) newH = min;
      const unscaledLabelSize = getUnscaledLabelSize(this.editor, {
        ...shape,
        props: {
          ...shape.props,
          w: newW * shape.props.scale,
          h: newH * shape.props.scale
        }
      });
      const nextW = Math.max(Math.abs(unscaledW), unscaledLabelSize.w) * Math.sign(unscaledW);
      const nextH = Math.max(Math.abs(unscaledH), unscaledLabelSize.h) * Math.sign(unscaledH);
      overShrinkX = Math.abs(nextW) - Math.abs(unscaledW);
      overShrinkY = Math.abs(nextH) - Math.abs(unscaledH);
      unscaledW = nextW;
      unscaledH = nextH;
    }
    const scaledW = unscaledW * shape.props.scale;
    const scaledH = unscaledH * shape.props.scale;
    const offset = new import_editor.Vec(0, 0);
    if (scaleX < 0) {
      offset.x += scaledW;
    }
    if (handle === "left" || handle === "top_left" || handle === "bottom_left") {
      offset.x += scaleX < 0 ? overShrinkX : -overShrinkX;
    }
    if (scaleY < 0) {
      offset.y += scaledH;
    }
    if (handle === "top" || handle === "top_left" || handle === "top_right") {
      offset.y += scaleY < 0 ? overShrinkY : -overShrinkY;
    }
    const { x, y } = offset.rot(shape.rotation).add(newPoint);
    return {
      x,
      y,
      props: {
        w: Math.max(Math.abs(scaledW), 1),
        h: Math.max(Math.abs(scaledH), 1),
        growY: 0
      }
    };
  }
  onBeforeCreate(shape) {
    if (!shape.props.text) {
      if (shape.props.growY) {
        return {
          ...shape,
          props: {
            ...shape.props,
            growY: 0
          }
        };
      } else {
        return;
      }
    }
    const unscaledPrevHeight = shape.props.h / shape.props.scale;
    const unscaledNextHeight = getUnscaledLabelSize(this.editor, shape).h;
    let growY = null;
    if (unscaledNextHeight > unscaledPrevHeight) {
      growY = unscaledNextHeight - unscaledPrevHeight;
    } else {
      if (shape.props.growY) {
        growY = 0;
      }
    }
    if (growY !== null) {
      return {
        ...shape,
        props: {
          ...shape.props,
          // scale the growY
          growY: growY * shape.props.scale
        }
      };
    }
  }
  onBeforeUpdate(prev, next) {
    const prevText = prev.props.text;
    const nextText = next.props.text;
    if (prevText === nextText && prev.props.font === next.props.font && prev.props.size === next.props.size) {
      return;
    }
    if (prevText && !nextText) {
      return {
        ...next,
        props: {
          ...next.props,
          growY: 0
        }
      };
    }
    const unscaledPrevWidth = prev.props.w / prev.props.scale;
    const unscaledPrevHeight = prev.props.h / prev.props.scale;
    const unscaledPrevGrowY = prev.props.growY / prev.props.scale;
    const unscaledNextLabelSize = getUnscaledLabelSize(this.editor, next);
    if (!prevText && nextText && nextText.length === 1) {
      let unscaledW = Math.max(unscaledPrevWidth, unscaledNextLabelSize.w);
      let unscaledH = Math.max(unscaledPrevHeight, unscaledNextLabelSize.h);
      const min = MIN_SIZE_WITH_LABEL;
      if (unscaledPrevWidth < min && unscaledPrevHeight < min) {
        unscaledW = Math.max(unscaledW, min);
        unscaledH = Math.max(unscaledH, min);
        unscaledW = Math.max(unscaledW, unscaledH);
        unscaledH = Math.max(unscaledW, unscaledH);
      }
      return {
        ...next,
        props: {
          ...next.props,
          // Scale the results
          w: unscaledW * next.props.scale,
          h: unscaledH * next.props.scale,
          growY: 0
        }
      };
    }
    let growY = null;
    if (unscaledNextLabelSize.h > unscaledPrevHeight) {
      growY = unscaledNextLabelSize.h - unscaledPrevHeight;
    } else {
      if (unscaledPrevGrowY) {
        growY = 0;
      }
    }
    if (growY !== null) {
      const unscaledNextWidth = next.props.w / next.props.scale;
      return {
        ...next,
        props: {
          ...next.props,
          // Scale the results
          growY: growY * next.props.scale,
          w: Math.max(unscaledNextWidth, unscaledNextLabelSize.w) * next.props.scale
        }
      };
    }
    if (unscaledNextLabelSize.w > unscaledPrevWidth) {
      return {
        ...next,
        props: {
          ...next.props,
          // Scale the results
          w: unscaledNextLabelSize.w * next.props.scale
        }
      };
    }
  }
  onDoubleClick(shape) {
    if (this.editor.inputs.altKey) {
      switch (shape.props.geo) {
        case "rectangle": {
          return {
            ...shape,
            props: {
              geo: "check-box"
            }
          };
        }
        case "check-box": {
          return {
            ...shape,
            props: {
              geo: "rectangle"
            }
          };
        }
      }
    }
    return;
  }
  getInterpolatedProps(startShape, endShape, t) {
    return {
      ...t > 0.5 ? endShape.props : startShape.props,
      w: (0, import_editor.lerp)(startShape.props.w, endShape.props.w, t),
      h: (0, import_editor.lerp)(startShape.props.h, endShape.props.h, t),
      scale: (0, import_editor.lerp)(startShape.props.scale, endShape.props.scale, t)
    };
  }
}
function getUnscaledLabelSize(editor, shape) {
  const { text, font, size, w } = shape.props;
  if (!text) {
    return { w: 0, h: 0 };
  }
  const minSize = editor.textMeasure.measureText("w", {
    ...import_default_shape_constants.TEXT_PROPS,
    fontFamily: import_default_shape_constants.FONT_FAMILIES[font],
    fontSize: import_default_shape_constants.LABEL_FONT_SIZES[size],
    maxWidth: 100
    // ?
  });
  const sizes = {
    s: 2,
    m: 3.5,
    l: 5,
    xl: 10
  };
  const textSize = editor.textMeasure.measureText(text, {
    ...import_default_shape_constants.TEXT_PROPS,
    fontFamily: import_default_shape_constants.FONT_FAMILIES[font],
    fontSize: import_default_shape_constants.LABEL_FONT_SIZES[size],
    minWidth: minSize.w,
    maxWidth: Math.max(
      // Guard because a DOM nodes can't be less 0
      0,
      // A 'w' width that we're setting as the min-width
      Math.ceil(minSize.w + sizes[size]),
      // The actual text size
      Math.ceil(w / shape.props.scale - import_default_shape_constants.LABEL_PADDING * 2)
    )
  });
  return {
    w: textSize.w + import_default_shape_constants.LABEL_PADDING * 2,
    h: textSize.h + import_default_shape_constants.LABEL_PADDING * 2
  };
}
//# sourceMappingURL=GeoShapeUtil.js.map
