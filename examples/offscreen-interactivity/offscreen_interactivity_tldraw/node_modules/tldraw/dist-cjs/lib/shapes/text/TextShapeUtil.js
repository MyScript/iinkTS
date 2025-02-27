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
var TextShapeUtil_exports = {};
__export(TextShapeUtil_exports, {
  TextShapeUtil: () => TextShapeUtil
});
module.exports = __toCommonJS(TextShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_SvgTextLabel = require("../shared/SvgTextLabel");
var import_TextHelpers = require("../shared/TextHelpers");
var import_TextLabel = require("../shared/TextLabel");
var import_default_shape_constants = require("../shared/default-shape-constants");
var import_defaultStyleDefs = require("../shared/defaultStyleDefs");
var import_resizeScaled = require("../shared/resizeScaled");
var import_useDefaultColorTheme = require("../shared/useDefaultColorTheme");
const sizeCache = new import_editor.WeakCache();
class TextShapeUtil extends import_editor.ShapeUtil {
  static type = "text";
  static props = import_editor.textShapeProps;
  static migrations = import_editor.textShapeMigrations;
  getDefaultProps() {
    return {
      color: "black",
      size: "m",
      w: 8,
      text: "",
      font: "draw",
      textAlign: "start",
      autoSize: true,
      scale: 1
    };
  }
  getMinDimensions(shape) {
    return sizeCache.get(shape.props, (props) => getTextSize(this.editor, props));
  }
  getGeometry(shape) {
    const { scale } = shape.props;
    const { width, height } = this.getMinDimensions(shape);
    return new import_editor.Rectangle2d({
      width: width * scale,
      height: height * scale,
      isFilled: true,
      isLabel: true
    });
  }
  getText(shape) {
    return shape.props.text;
  }
  canEdit() {
    return true;
  }
  isAspectRatioLocked() {
    return true;
  }
  // WAIT NO THIS IS HARD CODED IN THE RESIZE HANDLER
  component(shape) {
    const {
      id,
      props: { font, size, text, color, scale, textAlign }
    } = shape;
    const { width, height } = this.getMinDimensions(shape);
    const isSelected = shape.id === this.editor.getOnlySelectedShapeId();
    const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
    const handleKeyDown = useTextShapeKeydownHandler(id);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TextLabel.TextLabel,
      {
        shapeId: id,
        classNamePrefix: "tl-text-shape",
        type: "text",
        font,
        fontSize: import_default_shape_constants.FONT_SIZES[size],
        lineHeight: import_default_shape_constants.TEXT_PROPS.lineHeight,
        align: textAlign,
        verticalAlign: "middle",
        text,
        labelColor: theme[color].solid,
        isSelected,
        textWidth: width,
        textHeight: height,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left"
        },
        wrap: true,
        onKeyDown: handleKeyDown
      }
    );
  }
  indicator(shape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const editor = (0, import_editor.useEditor)();
    if (shape.props.autoSize && editor.getEditingShapeId() === shape.id) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: (0, import_editor.toDomPrecision)(bounds.width), height: (0, import_editor.toDomPrecision)(bounds.height) });
  }
  toSvg(shape, ctx) {
    if (shape.props.text) ctx.addExportDef((0, import_defaultStyleDefs.getFontDefForExport)(shape.props.font));
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const width = bounds.width / (shape.props.scale ?? 1);
    const height = bounds.height / (shape.props.scale ?? 1);
    const theme = (0, import_editor.getDefaultColorTheme)(ctx);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_SvgTextLabel.SvgTextLabel,
      {
        fontSize: import_default_shape_constants.FONT_SIZES[shape.props.size],
        font: shape.props.font,
        align: shape.props.textAlign,
        verticalAlign: "middle",
        text: shape.props.text,
        labelColor: theme[shape.props.color].solid,
        bounds: new import_editor.Box(0, 0, width, height),
        padding: 0
      }
    );
  }
  onResize(shape, info) {
    const { newPoint, initialBounds, initialShape, scaleX, handle } = info;
    if (info.mode === "scale_shape" || handle !== "right" && handle !== "left") {
      return {
        id: shape.id,
        type: shape.type,
        ...(0, import_resizeScaled.resizeScaled)(shape, info)
      };
    } else {
      const nextWidth = Math.max(1, Math.abs(initialBounds.width * scaleX));
      const { x, y } = scaleX < 0 ? import_editor.Vec.Sub(newPoint, import_editor.Vec.FromAngle(shape.rotation).mul(nextWidth)) : newPoint;
      return {
        id: shape.id,
        type: shape.type,
        x,
        y,
        props: {
          w: nextWidth / initialShape.props.scale,
          autoSize: false
        }
      };
    }
  }
  onEditEnd(shape) {
    const {
      id,
      type,
      props: { text }
    } = shape;
    const trimmedText = shape.props.text.trimEnd();
    if (trimmedText.length === 0) {
      this.editor.deleteShapes([shape.id]);
    } else {
      if (trimmedText !== shape.props.text) {
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
  }
  onBeforeUpdate(prev, next) {
    if (!next.props.autoSize) return;
    const styleDidChange = prev.props.size !== next.props.size || prev.props.textAlign !== next.props.textAlign || prev.props.font !== next.props.font || prev.props.scale !== 1 && next.props.scale === 1;
    const textDidChange = prev.props.text !== next.props.text;
    if (!styleDidChange && !textDidChange) return;
    const boundsA = this.getMinDimensions(prev);
    const boundsB = getTextSize(this.editor, next.props);
    const wA = boundsA.width * prev.props.scale;
    const hA = boundsA.height * prev.props.scale;
    const wB = boundsB.width * next.props.scale;
    const hB = boundsB.height * next.props.scale;
    let delta;
    switch (next.props.textAlign) {
      case "middle": {
        delta = new import_editor.Vec((wB - wA) / 2, textDidChange ? 0 : (hB - hA) / 2);
        break;
      }
      case "end": {
        delta = new import_editor.Vec(wB - wA, textDidChange ? 0 : (hB - hA) / 2);
        break;
      }
      default: {
        if (textDidChange) break;
        delta = new import_editor.Vec(0, (hB - hA) / 2);
        break;
      }
    }
    if (delta) {
      delta.rot(next.rotation);
      const { x, y } = next;
      return {
        ...next,
        x: x - delta.x,
        y: y - delta.y,
        props: { ...next.props, w: wB }
      };
    } else {
      return {
        ...next,
        props: { ...next.props, w: wB }
      };
    }
  }
  // 	todo: The edge doubleclicking feels like a mistake more often than
  //  not, especially on multiline text. Removed June 16 2024
  // override onDoubleClickEdge = (shape: TLTextShape) => {
  // 	// If the shape has a fixed width, set it to autoSize.
  // 	if (!shape.props.autoSize) {
  // 		return {
  // 			id: shape.id,
  // 			type: shape.type,
  // 			props: {
  // 				autoSize: true,
  // 			},
  // 		}
  // 	}
  // 	// If the shape is scaled, reset the scale to 1.
  // 	if (shape.props.scale !== 1) {
  // 		return {
  // 			id: shape.id,
  // 			type: shape.type,
  // 			props: {
  // 				scale: 1,
  // 			},
  // 		}
  // 	}
  // }
}
function getTextSize(editor, props) {
  const { font, text, autoSize, size, w } = props;
  const minWidth = autoSize ? 16 : Math.max(16, w);
  const fontSize = import_default_shape_constants.FONT_SIZES[size];
  const cw = autoSize ? null : (
    // `measureText` floors the number so we need to do the same here to avoid issues.
    Math.floor(Math.max(minWidth, w))
  );
  const result = editor.textMeasure.measureText(text, {
    ...import_default_shape_constants.TEXT_PROPS,
    fontFamily: import_default_shape_constants.FONT_FAMILIES[font],
    fontSize,
    maxWidth: cw
  });
  if (autoSize) {
    result.w += 1;
  }
  return {
    width: Math.max(minWidth, result.w),
    height: Math.max(fontSize, result.h)
  };
}
function useTextShapeKeydownHandler(id) {
  const editor = (0, import_editor.useEditor)();
  return (0, import_react.useCallback)(
    (e) => {
      if (editor.getEditingShapeId() !== id) return;
      switch (e.key) {
        case "Enter": {
          if (e.ctrlKey || e.metaKey) {
            editor.complete();
          }
          break;
        }
        case "Tab": {
          (0, import_editor.preventDefault)(e);
          if (e.shiftKey) {
            import_TextHelpers.TextHelpers.unindent(e.currentTarget);
          } else {
            import_TextHelpers.TextHelpers.indent(e.currentTarget);
          }
          break;
        }
      }
    },
    [editor, id]
  );
}
//# sourceMappingURL=TextShapeUtil.js.map
