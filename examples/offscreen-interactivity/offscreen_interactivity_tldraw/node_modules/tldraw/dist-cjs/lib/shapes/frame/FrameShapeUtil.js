"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var FrameShapeUtil_exports = {};
__export(FrameShapeUtil_exports, {
  FrameShapeUtil: () => FrameShapeUtil,
  defaultEmptyAs: () => defaultEmptyAs
});
module.exports = __toCommonJS(FrameShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_createTextJsxFromSpans = require("../shared/createTextJsxFromSpans");
var import_useDefaultColorTheme = require("../shared/useDefaultColorTheme");
var import_FrameHeading = require("./components/FrameHeading");
var import_frameHelpers = require("./frameHelpers");
function defaultEmptyAs(str, dflt) {
  if (str.match(/^\s*$/)) {
    return dflt;
  }
  return str;
}
class FrameShapeUtil extends import_editor.BaseBoxShapeUtil {
  static type = "frame";
  static props = import_editor.frameShapeProps;
  static migrations = import_editor.frameShapeMigrations;
  canEdit() {
    return true;
  }
  getDefaultProps() {
    return { w: 160 * 2, h: 90 * 2, name: "" };
  }
  getGeometry(shape) {
    const { editor } = this;
    const z = editor.getZoomLevel();
    const opts = (0, import_frameHelpers.getFrameHeadingOpts)(shape, "black");
    const headingInfo = (0, import_frameHelpers.getFrameHeadingInfo)(editor, shape, opts);
    const labelSide = (0, import_frameHelpers.getFrameHeadingSide)(editor, shape);
    let x, y, w, h;
    const { w: hw, h: hh } = headingInfo.box;
    const scaledW = Math.min(hw, shape.props.w * z);
    const scaledH = Math.min(hh, shape.props.h * z);
    switch (labelSide) {
      case 0: {
        x = -8 / z;
        y = (-hh - 4) / z;
        w = (scaledW + 16) / z;
        h = hh / z;
        break;
      }
      case 1: {
        x = (-hh - 4) / z;
        h = (scaledH + 16) / z;
        y = shape.props.h - h + 8 / z;
        w = hh / z;
        break;
      }
      case 2: {
        x = shape.props.w - (scaledW + 8) / z;
        y = shape.props.h + 4 / z;
        w = (scaledH + 16) / z;
        h = hh / z;
        break;
      }
      case 3: {
        x = shape.props.w + 4 / z;
        h = (scaledH + 16) / z;
        y = -8 / z;
        w = hh / z;
        break;
      }
    }
    return new import_editor.Group2d({
      children: [
        new import_editor.Rectangle2d({
          width: shape.props.w,
          height: shape.props.h,
          isFilled: false
        }),
        new import_editor.Rectangle2d({
          x,
          y,
          width: w,
          height: h,
          isFilled: true,
          isLabel: true
        })
      ]
    });
  }
  getText(shape) {
    return shape.props.name;
  }
  component(shape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
    const isCreating = (0, import_editor.useValue)(
      "is creating this shape",
      () => {
        const resizingState = this.editor.getStateDescendant("select.resizing");
        if (!resizingState) return false;
        if (!resizingState.getIsActive()) return false;
        const info = resizingState?.info;
        if (!info) return false;
        return info.isCreating && this.editor.getOnlySelectedShapeId() === shape.id;
      },
      [shape.id]
    );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.SVGContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          className: (0, import_classnames.default)("tl-frame__body", { "tl-frame__creating": isCreating }),
          width: bounds.width,
          height: bounds.height,
          fill: theme.solid,
          stroke: theme.text
        }
      ) }),
      isCreating ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_FrameHeading.FrameHeading,
        {
          id: shape.id,
          name: shape.props.name,
          width: bounds.width,
          height: bounds.height
        }
      )
    ] });
  }
  toSvg(shape, ctx) {
    const theme = (0, import_editor.getDefaultColorTheme)({ isDarkMode: ctx.isDarkMode });
    const labelSide = (0, import_frameHelpers.getFrameHeadingSide)(this.editor, shape);
    const labelTranslate = (0, import_frameHelpers.getFrameHeadingTranslation)(shape, labelSide, true);
    const opts = (0, import_frameHelpers.getFrameHeadingOpts)(shape, theme.text);
    const { box: labelBounds, spans } = (0, import_frameHelpers.getFrameHeadingInfo)(this.editor, shape, opts);
    const text = (0, import_createTextJsxFromSpans.createTextJsxFromSpans)(this.editor, spans, opts);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          width: shape.props.w,
          height: shape.props.h,
          fill: theme.solid,
          stroke: theme.black.solid,
          strokeWidth: 1,
          rx: 1,
          ry: 1
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { transform: labelTranslate, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "rect",
          {
            x: labelBounds.x - 8,
            y: labelBounds.y - 4,
            width: labelBounds.width + 20,
            height: labelBounds.height,
            fill: theme.background,
            rx: 4,
            ry: 4
          }
        ),
        text
      ] })
    ] });
  }
  indicator(shape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "rect",
      {
        width: (0, import_editor.toDomPrecision)(bounds.width),
        height: (0, import_editor.toDomPrecision)(bounds.height),
        className: `tl-frame-indicator`
      }
    );
  }
  canReceiveNewChildrenOfType(shape, _type) {
    return !shape.isLocked;
  }
  providesBackgroundForChildren() {
    return true;
  }
  canDropShapes(shape, _shapes) {
    return !shape.isLocked;
  }
  onDragShapesOver(frame, shapes) {
    if (!shapes.every((child) => child.parentId === frame.id)) {
      this.editor.reparentShapes(shapes, frame.id);
    }
  }
  onDragShapesOut(_shape, shapes) {
    const parent = this.editor.getShape(_shape.parentId);
    const isInGroup = parent && this.editor.isShapeOfType(parent, "group");
    if (isInGroup) {
      this.editor.reparentShapes(shapes, parent.id);
    } else {
      this.editor.reparentShapes(shapes, this.editor.getCurrentPageId());
    }
  }
  onResize(shape, info) {
    return (0, import_editor.resizeBox)(shape, info);
  }
  getInterpolatedProps(startShape, endShape, t) {
    return {
      ...t > 0.5 ? endShape.props : startShape.props,
      w: (0, import_editor.lerp)(startShape.props.w, endShape.props.w, t),
      h: (0, import_editor.lerp)(startShape.props.h, endShape.props.h, t)
    };
  }
}
//# sourceMappingURL=FrameShapeUtil.js.map
