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
var ArrowShapeUtil_exports = {};
__export(ArrowShapeUtil_exports, {
  ArrowShapeUtil: () => ArrowShapeUtil,
  getArrowLength: () => getArrowLength
});
module.exports = __toCommonJS(ArrowShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_ArrowBindingUtil = require("../../bindings/arrow/ArrowBindingUtil");
var import_ShapeFill = require("../shared/ShapeFill");
var import_SvgTextLabel = require("../shared/SvgTextLabel");
var import_TextLabel = require("../shared/TextLabel");
var import_default_shape_constants = require("../shared/default-shape-constants");
var import_defaultStyleDefs = require("../shared/defaultStyleDefs");
var import_useDefaultColorTheme = require("../shared/useDefaultColorTheme");
var import_arrowLabel = require("./arrowLabel");
var import_arrowheads = require("./arrowheads");
var import_arrowpaths = require("./arrowpaths");
var import_shared = require("./shared");
var ARROW_HANDLES = /* @__PURE__ */ ((ARROW_HANDLES2) => {
  ARROW_HANDLES2["START"] = "start";
  ARROW_HANDLES2["MIDDLE"] = "middle";
  ARROW_HANDLES2["END"] = "end";
  return ARROW_HANDLES2;
})(ARROW_HANDLES || {});
class ArrowShapeUtil extends import_editor.ShapeUtil {
  static type = "arrow";
  static props = import_editor.arrowShapeProps;
  static migrations = import_editor.arrowShapeMigrations;
  canEdit() {
    return true;
  }
  canBind({ toShapeType }) {
    return toShapeType !== "arrow";
  }
  canSnap() {
    return false;
  }
  hideResizeHandles() {
    return true;
  }
  hideRotateHandle() {
    return true;
  }
  hideSelectionBoundsBg() {
    return true;
  }
  hideSelectionBoundsFg() {
    return true;
  }
  canBeLaidOut(shape) {
    const bindings = (0, import_shared.getArrowBindings)(this.editor, shape);
    return !bindings.start && !bindings.end;
  }
  getDefaultProps() {
    return {
      dash: "draw",
      size: "m",
      fill: "none",
      color: "black",
      labelColor: "black",
      bend: 0,
      start: { x: 0, y: 0 },
      end: { x: 2, y: 0 },
      arrowheadStart: "none",
      arrowheadEnd: "arrow",
      text: "",
      labelPosition: 0.5,
      font: "draw",
      scale: 1
    };
  }
  getGeometry(shape) {
    const info = (0, import_shared.getArrowInfo)(this.editor, shape);
    const debugGeom = [];
    const bodyGeom = info.isStraight ? new import_editor.Edge2d({
      start: import_editor.Vec.From(info.start.point),
      end: import_editor.Vec.From(info.end.point)
    }) : new import_editor.Arc2d({
      center: import_editor.Vec.Cast(info.handleArc.center),
      start: import_editor.Vec.Cast(info.start.point),
      end: import_editor.Vec.Cast(info.end.point),
      sweepFlag: info.bodyArc.sweepFlag,
      largeArcFlag: info.bodyArc.largeArcFlag
    });
    let labelGeom;
    if (shape.props.text.trim()) {
      const labelPosition = (0, import_arrowLabel.getArrowLabelPosition)(this.editor, shape);
      debugGeom.push(...labelPosition.debugGeom);
      labelGeom = new import_editor.Rectangle2d({
        x: labelPosition.box.x,
        y: labelPosition.box.y,
        width: labelPosition.box.w,
        height: labelPosition.box.h,
        isFilled: true,
        isLabel: true
      });
    }
    return new import_editor.Group2d({
      children: [...labelGeom ? [bodyGeom, labelGeom] : [bodyGeom], ...debugGeom]
    });
  }
  getHandles(shape) {
    const info = (0, import_shared.getArrowInfo)(this.editor, shape);
    return [
      {
        id: "start" /* START */,
        type: "vertex",
        index: "a0",
        x: info.start.handle.x,
        y: info.start.handle.y
      },
      {
        id: "middle" /* MIDDLE */,
        type: "virtual",
        index: "a2",
        x: info.middle.x,
        y: info.middle.y
      },
      {
        id: "end" /* END */,
        type: "vertex",
        index: "a3",
        x: info.end.handle.x,
        y: info.end.handle.y
      }
    ].filter(Boolean);
  }
  getText(shape) {
    return shape.props.text;
  }
  onHandleDrag(shape, { handle, isPrecise }) {
    const handleId = handle.id;
    const bindings = (0, import_shared.getArrowBindings)(this.editor, shape);
    if (handleId === "middle" /* MIDDLE */) {
      const { start, end } = (0, import_shared.getArrowTerminalsInArrowSpace)(this.editor, shape, bindings);
      const delta = import_editor.Vec.Sub(end, start);
      const v = import_editor.Vec.Per(delta);
      const med = import_editor.Vec.Med(end, start);
      const A = import_editor.Vec.Sub(med, v);
      const B = import_editor.Vec.Add(med, v);
      const point2 = import_editor.Vec.NearestPointOnLineSegment(A, B, handle, false);
      let bend = import_editor.Vec.Dist(point2, med);
      if (import_editor.Vec.Clockwise(point2, end, med)) bend *= -1;
      return { id: shape.id, type: shape.type, props: { bend } };
    }
    const update = { id: shape.id, type: "arrow", props: {} };
    const currentBinding = bindings[handleId];
    const otherHandleId = handleId === "start" /* START */ ? "end" /* END */ : "start" /* START */;
    const otherBinding = bindings[otherHandleId];
    if (this.editor.inputs.ctrlKey) {
      (0, import_shared.removeArrowBinding)(this.editor, shape, handleId);
      update.props[handleId] = {
        x: handle.x,
        y: handle.y
      };
      return update;
    }
    const point = this.editor.getShapePageTransform(shape.id).applyToPoint(handle);
    const target = this.editor.getShapeAtPoint(point, {
      hitInside: true,
      hitFrameInside: true,
      margin: 0,
      filter: (targetShape) => {
        return !targetShape.isLocked && this.editor.canBindShapes({ fromShape: shape, toShape: targetShape, binding: "arrow" });
      }
    });
    if (!target) {
      (0, import_shared.removeArrowBinding)(this.editor, shape, handleId);
      const newPoint = (0, import_editor.maybeSnapToGrid)(new import_editor.Vec(handle.x, handle.y), this.editor);
      update.props[handleId] = {
        x: newPoint.x,
        y: newPoint.y
      };
      return update;
    }
    const targetGeometry = this.editor.getShapeGeometry(target);
    const targetBounds = import_editor.Box.ZeroFix(targetGeometry.bounds);
    const pageTransform = this.editor.getShapePageTransform(update.id);
    const pointInPageSpace = pageTransform.applyToPoint(handle);
    const pointInTargetSpace = this.editor.getPointInShapeSpace(target, pointInPageSpace);
    let precise = isPrecise;
    if (!precise) {
      if (!currentBinding || currentBinding && target.id !== currentBinding.toId) {
        precise = this.editor.inputs.pointerVelocity.len() < 0.5;
      }
    }
    if (!isPrecise) {
      if (!targetGeometry.isClosed) {
        precise = true;
      }
      if (otherBinding && target.id === otherBinding.toId && otherBinding.props.isPrecise) {
        precise = true;
      }
    }
    const normalizedAnchor = {
      x: (pointInTargetSpace.x - targetBounds.minX) / targetBounds.width,
      y: (pointInTargetSpace.y - targetBounds.minY) / targetBounds.height
    };
    if (precise) {
      if (import_editor.Vec.Dist(pointInTargetSpace, targetBounds.center) < Math.max(4, Math.min(Math.min(targetBounds.width, targetBounds.height) * 0.15, 16)) / this.editor.getZoomLevel()) {
        normalizedAnchor.x = 0.5;
        normalizedAnchor.y = 0.5;
      }
    }
    const b = {
      terminal: handleId,
      normalizedAnchor,
      isPrecise: precise,
      isExact: this.editor.inputs.altKey
    };
    (0, import_shared.createOrUpdateArrowBinding)(this.editor, shape, target.id, b);
    this.editor.setHintingShapes([target.id]);
    const newBindings = (0, import_shared.getArrowBindings)(this.editor, shape);
    if (newBindings.start && newBindings.end && newBindings.start.toId === newBindings.end.toId) {
      if (import_editor.Vec.Equals(newBindings.start.props.normalizedAnchor, newBindings.end.props.normalizedAnchor)) {
        (0, import_shared.createOrUpdateArrowBinding)(this.editor, shape, newBindings.end.toId, {
          ...newBindings.end.props,
          normalizedAnchor: {
            x: newBindings.end.props.normalizedAnchor.x + 0.05,
            y: newBindings.end.props.normalizedAnchor.y
          }
        });
      }
    }
    return update;
  }
  onTranslateStart(shape) {
    const bindings = (0, import_shared.getArrowBindings)(this.editor, shape);
    const terminalsInArrowSpace = (0, import_shared.getArrowTerminalsInArrowSpace)(this.editor, shape, bindings);
    const shapePageTransform = this.editor.getShapePageTransform(shape.id);
    const selectedShapeIds = this.editor.getSelectedShapeIds();
    if (bindings.start && (selectedShapeIds.includes(bindings.start.toId) || this.editor.isAncestorSelected(bindings.start.toId)) || bindings.end && (selectedShapeIds.includes(bindings.end.toId) || this.editor.isAncestorSelected(bindings.end.toId))) {
      return;
    }
    shapeAtTranslationStart.set(shape, {
      pagePosition: shapePageTransform.applyToPoint(shape),
      terminalBindings: (0, import_editor.mapObjectMapValues)(terminalsInArrowSpace, (terminalName, point) => {
        const binding = bindings[terminalName];
        if (!binding) return null;
        return {
          binding,
          shapePosition: point,
          pagePosition: shapePageTransform.applyToPoint(point)
        };
      })
    });
    if (bindings.start) {
      (0, import_ArrowBindingUtil.updateArrowTerminal)({
        editor: this.editor,
        arrow: shape,
        terminal: "start",
        useHandle: true
      });
      shape = this.editor.getShape(shape.id);
    }
    if (bindings.end) {
      (0, import_ArrowBindingUtil.updateArrowTerminal)({
        editor: this.editor,
        arrow: shape,
        terminal: "end",
        useHandle: true
      });
    }
    for (const handleName of ["start" /* START */, "end" /* END */]) {
      const binding = bindings[handleName];
      if (!binding) continue;
      this.editor.updateBinding({
        ...binding,
        props: { ...binding.props, isPrecise: true }
      });
    }
    return;
  }
  onTranslate(initialShape, shape) {
    const atTranslationStart = shapeAtTranslationStart.get(initialShape);
    if (!atTranslationStart) return;
    const shapePageTransform = this.editor.getShapePageTransform(shape.id);
    const pageDelta = import_editor.Vec.Sub(
      shapePageTransform.applyToPoint(shape),
      atTranslationStart.pagePosition
    );
    for (const terminalBinding of Object.values(atTranslationStart.terminalBindings)) {
      if (!terminalBinding) continue;
      const newPagePoint = import_editor.Vec.Add(terminalBinding.pagePosition, import_editor.Vec.Mul(pageDelta, 0.5));
      const newTarget = this.editor.getShapeAtPoint(newPagePoint, {
        hitInside: true,
        hitFrameInside: true,
        margin: 0,
        filter: (targetShape) => {
          return !targetShape.isLocked && this.editor.canBindShapes({ fromShape: shape, toShape: targetShape, binding: "arrow" });
        }
      });
      if (newTarget?.id === terminalBinding.binding.toId) {
        const targetBounds = import_editor.Box.ZeroFix(this.editor.getShapeGeometry(newTarget).bounds);
        const pointInTargetSpace = this.editor.getPointInShapeSpace(newTarget, newPagePoint);
        const normalizedAnchor = {
          x: (pointInTargetSpace.x - targetBounds.minX) / targetBounds.width,
          y: (pointInTargetSpace.y - targetBounds.minY) / targetBounds.height
        };
        (0, import_shared.createOrUpdateArrowBinding)(this.editor, shape, newTarget.id, {
          ...terminalBinding.binding.props,
          normalizedAnchor,
          isPrecise: true
        });
      } else {
        (0, import_shared.removeArrowBinding)(this.editor, shape, terminalBinding.binding.props.terminal);
      }
    }
  }
  _resizeInitialBindings = new import_editor.WeakCache();
  onResize(shape, info) {
    const { scaleX, scaleY } = info;
    const bindings = this._resizeInitialBindings.get(
      shape,
      () => (0, import_shared.getArrowBindings)(this.editor, shape)
    );
    const terminals = (0, import_shared.getArrowTerminalsInArrowSpace)(this.editor, shape, bindings);
    const { start, end } = (0, import_editor.structuredClone)(shape.props);
    let { bend } = shape.props;
    if (!bindings.start) {
      start.x = terminals.start.x * scaleX;
      start.y = terminals.start.y * scaleY;
    }
    if (!bindings.end) {
      end.x = terminals.end.x * scaleX;
      end.y = terminals.end.y * scaleY;
    }
    const mx = Math.abs(scaleX);
    const my = Math.abs(scaleY);
    const startNormalizedAnchor = bindings?.start ? import_editor.Vec.From(bindings.start.props.normalizedAnchor) : null;
    const endNormalizedAnchor = bindings?.end ? import_editor.Vec.From(bindings.end.props.normalizedAnchor) : null;
    if (scaleX < 0 && scaleY >= 0) {
      if (bend !== 0) {
        bend *= -1;
        bend *= Math.max(mx, my);
      }
      if (startNormalizedAnchor) {
        startNormalizedAnchor.x = 1 - startNormalizedAnchor.x;
      }
      if (endNormalizedAnchor) {
        endNormalizedAnchor.x = 1 - endNormalizedAnchor.x;
      }
    } else if (scaleX >= 0 && scaleY < 0) {
      if (bend !== 0) {
        bend *= -1;
        bend *= Math.max(mx, my);
      }
      if (startNormalizedAnchor) {
        startNormalizedAnchor.y = 1 - startNormalizedAnchor.y;
      }
      if (endNormalizedAnchor) {
        endNormalizedAnchor.y = 1 - endNormalizedAnchor.y;
      }
    } else if (scaleX >= 0 && scaleY >= 0) {
      if (bend !== 0) {
        bend *= Math.max(mx, my);
      }
    } else if (scaleX < 0 && scaleY < 0) {
      if (bend !== 0) {
        bend *= Math.max(mx, my);
      }
      if (startNormalizedAnchor) {
        startNormalizedAnchor.x = 1 - startNormalizedAnchor.x;
        startNormalizedAnchor.y = 1 - startNormalizedAnchor.y;
      }
      if (endNormalizedAnchor) {
        endNormalizedAnchor.x = 1 - endNormalizedAnchor.x;
        endNormalizedAnchor.y = 1 - endNormalizedAnchor.y;
      }
    }
    if (bindings.start && startNormalizedAnchor) {
      (0, import_shared.createOrUpdateArrowBinding)(this.editor, shape, bindings.start.toId, {
        ...bindings.start.props,
        normalizedAnchor: startNormalizedAnchor.toJson()
      });
    }
    if (bindings.end && endNormalizedAnchor) {
      (0, import_shared.createOrUpdateArrowBinding)(this.editor, shape, bindings.end.toId, {
        ...bindings.end.props,
        normalizedAnchor: endNormalizedAnchor.toJson()
      });
    }
    const next = {
      props: {
        start,
        end,
        bend
      }
    };
    return next;
  }
  onDoubleClickHandle(shape, handle) {
    switch (handle.id) {
      case "start" /* START */: {
        return {
          id: shape.id,
          type: shape.type,
          props: {
            ...shape.props,
            arrowheadStart: shape.props.arrowheadStart === "none" ? "arrow" : "none"
          }
        };
      }
      case "end" /* END */: {
        return {
          id: shape.id,
          type: shape.type,
          props: {
            ...shape.props,
            arrowheadEnd: shape.props.arrowheadEnd === "none" ? "arrow" : "none"
          }
        };
      }
    }
  }
  component(shape) {
    const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
    const onlySelectedShape = this.editor.getOnlySelectedShape();
    const shouldDisplayHandles = this.editor.isInAny(
      "select.idle",
      "select.pointing_handle",
      "select.dragging_handle",
      "select.translating",
      "arrow.dragging"
    ) && !this.editor.getIsReadonly();
    const info = (0, import_shared.getArrowInfo)(this.editor, shape);
    if (!info?.isValid) return null;
    const labelPosition = (0, import_arrowLabel.getArrowLabelPosition)(this.editor, shape);
    const isSelected = shape.id === this.editor.getOnlySelectedShapeId();
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const showArrowLabel = isEditing || shape.props.text;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.SVGContainer, { style: { minWidth: 50, minHeight: 50 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ArrowSvg,
        {
          shape,
          shouldDisplayHandles: shouldDisplayHandles && onlySelectedShape?.id === shape.id
        }
      ) }),
      showArrowLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_TextLabel.TextLabel,
        {
          shapeId: shape.id,
          classNamePrefix: "tl-arrow",
          type: "arrow",
          font: shape.props.font,
          fontSize: (0, import_arrowLabel.getArrowLabelFontSize)(shape),
          lineHeight: import_default_shape_constants.TEXT_PROPS.lineHeight,
          align: "middle",
          verticalAlign: "middle",
          text: shape.props.text,
          labelColor: theme[shape.props.labelColor].solid,
          textWidth: labelPosition.box.w - import_default_shape_constants.ARROW_LABEL_PADDING * 2 * shape.props.scale,
          isSelected,
          padding: 0,
          style: {
            transform: `translate(${labelPosition.box.center.x}px, ${labelPosition.box.center.y}px)`
          }
        }
      )
    ] });
  }
  indicator(shape) {
    const isEditing = (0, import_editor.useIsEditing)(shape.id);
    const clipPathId = (0, import_editor.useSharedSafeId)(shape.id + "_clip");
    const info = (0, import_shared.getArrowInfo)(this.editor, shape);
    if (!info) return null;
    const { start, end } = (0, import_shared.getArrowTerminalsInArrowSpace)(this.editor, shape, info?.bindings);
    const geometry = this.editor.getShapeGeometry(shape);
    const bounds = geometry.bounds;
    const labelGeometry = shape.props.text.trim() ? geometry.children[1] : null;
    if (import_editor.Vec.Equals(start, end)) return null;
    const strokeWidth = import_default_shape_constants.STROKE_SIZES[shape.props.size] * shape.props.scale;
    const as = info.start.arrowhead && (0, import_arrowheads.getArrowheadPathForType)(info, "start", strokeWidth);
    const ae = info.end.arrowhead && (0, import_arrowheads.getArrowheadPathForType)(info, "end", strokeWidth);
    const path = info.isStraight ? (0, import_arrowpaths.getSolidStraightArrowPath)(info) : (0, import_arrowpaths.getSolidCurvedArrowPath)(info);
    const includeClipPath = as && info.start.arrowhead !== "arrow" || ae && info.end.arrowhead !== "arrow" || !!labelGeometry;
    if (isEditing && labelGeometry) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          x: (0, import_editor.toDomPrecision)(labelGeometry.x),
          y: (0, import_editor.toDomPrecision)(labelGeometry.y),
          width: labelGeometry.w,
          height: labelGeometry.h,
          rx: 3.5 * shape.props.scale,
          ry: 3.5 * shape.props.scale
        }
      );
    }
    const clipStartArrowhead = !(info.start.arrowhead === "none" || info.start.arrowhead === "arrow");
    const clipEndArrowhead = !(info.end.arrowhead === "none" || info.end.arrowhead === "arrow");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
      includeClipPath && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ArrowClipPath,
        {
          hasText: shape.props.text.trim().length > 0,
          bounds,
          labelBounds: labelGeometry ? labelGeometry.getBounds() : new import_editor.Box(0, 0, 0, 0),
          as: clipStartArrowhead && as ? as : "",
          ae: clipEndArrowhead && ae ? ae : ""
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "g",
        {
          style: {
            clipPath: includeClipPath ? `url(#${clipPathId})` : void 0,
            WebkitClipPath: includeClipPath ? `url(#${clipPathId})` : void 0
          },
          children: [
            includeClipPath && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "rect",
              {
                x: bounds.minX - 100,
                y: bounds.minY - 100,
                width: bounds.width + 200,
                height: bounds.height + 200,
                opacity: 0
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path })
          ]
        }
      ),
      as && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: as }),
      ae && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: ae }),
      labelGeometry && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "rect",
        {
          x: (0, import_editor.toDomPrecision)(labelGeometry.x),
          y: (0, import_editor.toDomPrecision)(labelGeometry.y),
          width: labelGeometry.w,
          height: labelGeometry.h,
          rx: 3.5,
          ry: 3.5
        }
      )
    ] });
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
  toSvg(shape, ctx) {
    ctx.addExportDef((0, import_defaultStyleDefs.getFillDefForExport)(shape.props.fill));
    if (shape.props.text) ctx.addExportDef((0, import_defaultStyleDefs.getFontDefForExport)(shape.props.font));
    const theme = (0, import_editor.getDefaultColorTheme)(ctx);
    const scaleFactor = 1 / shape.props.scale;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { transform: `scale(${scaleFactor})`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowSvg, { shape, shouldDisplayHandles: false }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_SvgTextLabel.SvgTextLabel,
        {
          fontSize: (0, import_arrowLabel.getArrowLabelFontSize)(shape),
          font: shape.props.font,
          align: "middle",
          verticalAlign: "middle",
          text: shape.props.text,
          labelColor: theme[shape.props.labelColor].solid,
          bounds: (0, import_arrowLabel.getArrowLabelPosition)(this.editor, shape).box.clone().expandBy(-import_default_shape_constants.ARROW_LABEL_PADDING * shape.props.scale),
          padding: 0
        }
      )
    ] });
  }
  getCanvasSvgDefs() {
    return [
      (0, import_defaultStyleDefs.getFillDefForCanvas)(),
      {
        key: `arrow:dot`,
        component: ArrowheadDotDef
      },
      {
        key: `arrow:cross`,
        component: ArrowheadCrossDef
      }
    ];
  }
  getInterpolatedProps(startShape, endShape, progress) {
    return {
      ...progress > 0.5 ? endShape.props : startShape.props,
      scale: (0, import_editor.lerp)(startShape.props.scale, endShape.props.scale, progress),
      start: {
        x: (0, import_editor.lerp)(startShape.props.start.x, endShape.props.start.x, progress),
        y: (0, import_editor.lerp)(startShape.props.start.y, endShape.props.start.y, progress)
      },
      end: {
        x: (0, import_editor.lerp)(startShape.props.end.x, endShape.props.end.x, progress),
        y: (0, import_editor.lerp)(startShape.props.end.y, endShape.props.end.y, progress)
      },
      bend: (0, import_editor.lerp)(startShape.props.bend, endShape.props.bend, progress),
      labelPosition: (0, import_editor.lerp)(startShape.props.labelPosition, endShape.props.labelPosition, progress)
    };
  }
}
function getArrowLength(editor, shape) {
  const info = (0, import_shared.getArrowInfo)(editor, shape);
  return info.isStraight ? import_editor.Vec.Dist(info.start.handle, info.end.handle) : Math.abs(info.handleArc.length);
}
const ArrowSvg = (0, import_editor.track)(function ArrowSvg2({
  shape,
  shouldDisplayHandles
}) {
  const editor = (0, import_editor.useEditor)();
  const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
  const info = (0, import_shared.getArrowInfo)(editor, shape);
  const bounds = import_editor.Box.ZeroFix(editor.getShapeGeometry(shape).bounds);
  const bindings = (0, import_shared.getArrowBindings)(editor, shape);
  const isForceSolid = (0, import_editor.useValue)(
    "force solid",
    () => {
      return editor.getZoomLevel() < 0.2;
    },
    [editor]
  );
  const clipPathId = (0, import_editor.useSharedSafeId)(shape.id + "_clip");
  const arrowheadDotId = (0, import_editor.useSharedSafeId)("arrowhead-dot");
  const arrowheadCrossId = (0, import_editor.useSharedSafeId)("arrowhead-cross");
  if (!info?.isValid) return null;
  const strokeWidth = import_default_shape_constants.STROKE_SIZES[shape.props.size] * shape.props.scale;
  const as = info.start.arrowhead && (0, import_arrowheads.getArrowheadPathForType)(info, "start", strokeWidth);
  const ae = info.end.arrowhead && (0, import_arrowheads.getArrowheadPathForType)(info, "end", strokeWidth);
  const path = info.isStraight ? (0, import_arrowpaths.getSolidStraightArrowPath)(info) : (0, import_arrowpaths.getSolidCurvedArrowPath)(info);
  let handlePath = null;
  if (shouldDisplayHandles) {
    const sw = 2 / editor.getZoomLevel();
    const { strokeDasharray: strokeDasharray2, strokeDashoffset: strokeDashoffset2 } = (0, import_editor.getPerfectDashProps)(
      getArrowLength(editor, shape),
      sw,
      {
        end: "skip",
        start: "skip",
        lengthRatio: 2.5
      }
    );
    handlePath = bindings.start || bindings.end ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        className: "tl-arrow-hint",
        d: info.isStraight ? (0, import_arrowpaths.getStraightArrowHandlePath)(info) : (0, import_arrowpaths.getCurvedArrowHandlePath)(info),
        strokeDasharray: strokeDasharray2,
        strokeDashoffset: strokeDashoffset2,
        strokeWidth: sw,
        markerStart: bindings.start ? bindings.start.props.isExact ? "" : bindings.start.props.isPrecise ? `url(#${arrowheadCrossId})` : `url(#${arrowheadDotId})` : "",
        markerEnd: bindings.end ? bindings.end.props.isExact ? "" : bindings.end.props.isPrecise ? `url(#${arrowheadCrossId})` : `url(#${arrowheadDotId})` : "",
        opacity: 0.16
      }
    ) : null;
  }
  const { strokeDasharray, strokeDashoffset } = (0, import_editor.getPerfectDashProps)(
    info.isStraight ? info.length : Math.abs(info.bodyArc.length),
    strokeWidth,
    {
      style: shape.props.dash,
      forceSolid: isForceSolid
    }
  );
  const labelPosition = (0, import_arrowLabel.getArrowLabelPosition)(editor, shape);
  const clipStartArrowhead = !(info.start.arrowhead === "none" || info.start.arrowhead === "arrow");
  const clipEndArrowhead = !(info.end.arrowhead === "none" || info.end.arrowhead === "arrow");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", { id: clipPathId, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ArrowClipPath,
      {
        hasText: shape.props.text.trim().length > 0,
        bounds,
        labelBounds: labelPosition.box,
        as: clipStartArrowhead && as ? as : "",
        ae: clipEndArrowhead && ae ? ae : ""
      }
    ) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "g",
      {
        fill: "none",
        stroke: theme[shape.props.color].solid,
        strokeWidth,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        pointerEvents: "none",
        children: [
          handlePath,
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "g",
            {
              style: {
                clipPath: `url(#${clipPathId})`,
                WebkitClipPath: `url(#${clipPathId})`
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "rect",
                  {
                    x: (0, import_editor.toDomPrecision)(bounds.minX - 100),
                    y: (0, import_editor.toDomPrecision)(bounds.minY - 100),
                    width: (0, import_editor.toDomPrecision)(bounds.width + 200),
                    height: (0, import_editor.toDomPrecision)(bounds.height + 200),
                    opacity: 0
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path, strokeDasharray, strokeDashoffset })
              ]
            }
          ),
          as && clipStartArrowhead && shape.props.fill !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_ShapeFill.ShapeFill,
            {
              theme,
              d: as,
              color: shape.props.color,
              fill: shape.props.fill,
              scale: shape.props.scale
            }
          ),
          ae && clipEndArrowhead && shape.props.fill !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_ShapeFill.ShapeFill,
            {
              theme,
              d: ae,
              color: shape.props.color,
              fill: shape.props.fill,
              scale: shape.props.scale
            }
          ),
          as && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: as }),
          ae && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: ae })
        ]
      }
    )
  ] });
});
function ArrowClipPath({
  hasText,
  bounds,
  labelBounds,
  as,
  ae
}) {
  const boundingBoxPath = `M${(0, import_editor.toDomPrecision)(bounds.minX - 100)},${(0, import_editor.toDomPrecision)(bounds.minY - 100)} h${bounds.width + 200} v${bounds.height + 200} h-${bounds.width + 200} Z`;
  const labelBoxPath = `M${(0, import_editor.toDomPrecision)(labelBounds.minX)},${(0, import_editor.toDomPrecision)(labelBounds.minY)} v${labelBounds.height} h${labelBounds.width} v-${labelBounds.height} Z`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `${boundingBoxPath}${hasText ? labelBoxPath : ""}${as}${ae}` });
}
const shapeAtTranslationStart = /* @__PURE__ */ new WeakMap();
function ArrowheadDotDef() {
  const id = (0, import_editor.useSharedSafeId)("arrowhead-dot");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("marker", { id, className: "tl-arrow-hint", refX: "3.0", refY: "3.0", orient: "0", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "3", cy: "3", r: "2", strokeDasharray: "100%" }) });
}
function ArrowheadCrossDef() {
  const id = (0, import_editor.useSharedSafeId)("arrowhead-cross");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("marker", { id, className: "tl-arrow-hint", refX: "3.0", refY: "3.0", orient: "auto", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "1.5", y1: "1.5", x2: "4.5", y2: "4.5", strokeDasharray: "100%" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "1.5", y1: "4.5", x2: "4.5", y2: "1.5", strokeDasharray: "100%" })
  ] });
}
//# sourceMappingURL=ArrowShapeUtil.js.map
