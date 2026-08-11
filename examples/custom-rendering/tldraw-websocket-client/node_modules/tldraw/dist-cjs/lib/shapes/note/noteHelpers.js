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
var noteHelpers_exports = {};
__export(noteHelpers_exports, {
  CLONE_HANDLE_MARGIN: () => CLONE_HANDLE_MARGIN,
  NOTE_ADJACENT_POSITION_SNAP_RADIUS: () => NOTE_ADJACENT_POSITION_SNAP_RADIUS,
  NOTE_CENTER_OFFSET: () => NOTE_CENTER_OFFSET,
  NOTE_SIZE: () => NOTE_SIZE,
  getAvailableNoteAdjacentPositions: () => getAvailableNoteAdjacentPositions,
  getNoteAdjacentPositions: () => getNoteAdjacentPositions,
  getNoteShapeForAdjacentPosition: () => getNoteShapeForAdjacentPosition
});
module.exports = __toCommonJS(noteHelpers_exports);
var import_editor = require("@tldraw/editor");
const CLONE_HANDLE_MARGIN = 0;
const NOTE_SIZE = 200;
const NOTE_CENTER_OFFSET = new import_editor.Vec(NOTE_SIZE / 2, NOTE_SIZE / 2);
const NOTE_ADJACENT_POSITION_SNAP_RADIUS = 10;
const BASE_NOTE_POSITIONS = (editor) => [
  [
    ["a1"],
    new import_editor.Vec(NOTE_SIZE * 0.5, NOTE_SIZE * -0.5 - editor.options.adjacentShapeMargin)
  ],
  // t
  [
    ["a2"],
    new import_editor.Vec(NOTE_SIZE * 1.5 + editor.options.adjacentShapeMargin, NOTE_SIZE * 0.5)
  ],
  // r
  [
    ["a3"],
    new import_editor.Vec(NOTE_SIZE * 0.5, NOTE_SIZE * 1.5 + editor.options.adjacentShapeMargin)
  ],
  // b
  [
    ["a4"],
    new import_editor.Vec(NOTE_SIZE * -0.5 - editor.options.adjacentShapeMargin, NOTE_SIZE * 0.5)
  ]
  // l
];
function getBaseAdjacentNotePositions(editor, scale) {
  if (scale === 1) return BASE_NOTE_POSITIONS(editor);
  const s = NOTE_SIZE * scale;
  const m = editor.options.adjacentShapeMargin * scale;
  return [
    [["a1"], new import_editor.Vec(s * 0.5, s * -0.5 - m)],
    // t
    [["a2"], new import_editor.Vec(s * 1.5 + m, s * 0.5)],
    // r
    [["a3"], new import_editor.Vec(s * 0.5, s * 1.5 + m)],
    // b
    [["a4"], new import_editor.Vec(s * -0.5 - m, s * 0.5)]
    // l
  ];
}
function getNoteAdjacentPositions(editor, pagePoint, pageRotation, growY, extraHeight, scale) {
  return Object.fromEntries(
    getBaseAdjacentNotePositions(editor, scale).map(([id, v], i) => {
      const point = v.clone();
      if (i === 0 && extraHeight) {
        point.y -= extraHeight;
      } else if (i === 2 && growY) {
        point.y += growY;
      }
      return [id, point.rot(pageRotation).add(pagePoint)];
    })
  );
}
function getAvailableNoteAdjacentPositions(editor, rotation, scale, extraHeight) {
  const selectedShapeIds = new Set(editor.getSelectedShapeIds());
  const minSize = (NOTE_SIZE + editor.options.adjacentShapeMargin + extraHeight) ** 2;
  const allCenters = /* @__PURE__ */ new Map();
  const positions = [];
  for (const shape of editor.getCurrentPageShapes()) {
    if (!editor.isShapeOfType(shape, "note") || scale !== shape.props.scale || selectedShapeIds.has(shape.id)) {
      continue;
    }
    const transform = editor.getShapePageTransform(shape.id);
    if (rotation !== transform.rotation()) continue;
    allCenters.set(shape, editor.getShapePageBounds(shape).center);
    positions.push(
      ...Object.values(
        getNoteAdjacentPositions(
          editor,
          transform.point(),
          rotation,
          shape.props.growY,
          extraHeight,
          scale
        )
      )
    );
  }
  const len = positions.length;
  let position;
  for (const [shape, center] of allCenters) {
    for (let i = 0; i < len; i++) {
      position = positions[i];
      if (!position) continue;
      if (import_editor.Vec.Dist2(center, position) > minSize) continue;
      if (editor.isPointInShape(shape, position)) {
        positions[i] = void 0;
      }
    }
  }
  return (0, import_editor.compact)(positions);
}
function getNoteShapeForAdjacentPosition(editor, shape, center, pageRotation, forceNew = false) {
  let nextNote;
  const allShapesOnPage = editor.getCurrentPageShapesSorted();
  const minDistance = (NOTE_SIZE + editor.options.adjacentShapeMargin ** 2) ** shape.props.scale;
  for (let i = allShapesOnPage.length - 1; i >= 0; i--) {
    const otherNote = allShapesOnPage[i];
    if (otherNote.type === "note" && otherNote.id !== shape.id) {
      const otherBounds = editor.getShapePageBounds(otherNote);
      if (otherBounds && import_editor.Vec.Dist2(otherBounds.center, center) < minDistance && editor.isPointInShape(otherNote, center)) {
        nextNote = otherNote;
        break;
      }
    }
  }
  editor.complete();
  if (!nextNote || forceNew) {
    editor.markHistoryStoppingPoint("creating note shape");
    const id = (0, import_editor.createShapeId)();
    editor.createShape({
      id,
      type: "note",
      x: center.x,
      y: center.y,
      rotation: pageRotation,
      opacity: shape.opacity,
      props: {
        // Use the props of the shape we're cloning
        ...shape.props,
        richText: (0, import_editor.toRichText)(""),
        growY: 0,
        fontSizeAdjustment: 0,
        url: ""
      }
    });
    const createdShape = editor.getShape(id);
    if (!createdShape) return;
    const topLeft = editor.getPointInParentSpace(
      createdShape,
      import_editor.Vec.Sub(
        center,
        import_editor.Vec.Rot(NOTE_CENTER_OFFSET.clone().mul(createdShape.props.scale), pageRotation)
      )
    );
    editor.updateShape({
      id,
      type: "note",
      x: topLeft.x,
      y: topLeft.y
    });
    nextNote = editor.getShape(id);
  }
  editor.zoomToSelectionIfOffscreen(16, {
    animation: {
      duration: editor.options.animationMediumMs
    },
    inset: 0
  });
  return nextNote;
}
//# sourceMappingURL=noteHelpers.js.map
