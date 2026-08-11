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
var TLShape_exports = {};
__export(TLShape_exports, {
  createShapeId: () => createShapeId,
  createShapePropsMigrationIds: () => createShapePropsMigrationIds,
  createShapePropsMigrationSequence: () => createShapePropsMigrationSequence,
  createShapeRecordType: () => createShapeRecordType,
  getShapePropKeysByStyle: () => getShapePropKeysByStyle,
  isShape: () => isShape,
  isShapeId: () => isShapeId,
  rootShapeMigrations: () => rootShapeMigrations,
  rootShapeVersions: () => rootShapeVersions
});
module.exports = __toCommonJS(TLShape_exports);
var import_store = require("@tldraw/store");
var import_utils = require("@tldraw/utils");
var import_validate = require("@tldraw/validate");
var import_TLBaseShape = require("../shapes/TLBaseShape");
var import_StyleProp = require("../styles/StyleProp");
const rootShapeVersions = (0, import_store.createMigrationIds)("com.tldraw.shape", {
  AddIsLocked: 1,
  HoistOpacity: 2,
  AddMeta: 3,
  AddWhite: 4
});
const rootShapeMigrations = (0, import_store.createRecordMigrationSequence)({
  sequenceId: "com.tldraw.shape",
  recordType: "shape",
  sequence: [
    {
      id: rootShapeVersions.AddIsLocked,
      up: (record) => {
        record.isLocked = false;
      },
      down: (record) => {
        delete record.isLocked;
      }
    },
    {
      id: rootShapeVersions.HoistOpacity,
      up: (record) => {
        record.opacity = Number(record.props.opacity ?? "1");
        delete record.props.opacity;
      },
      down: (record) => {
        const opacity = record.opacity;
        delete record.opacity;
        record.props.opacity = opacity < 0.175 ? "0.1" : opacity < 0.375 ? "0.25" : opacity < 0.625 ? "0.5" : opacity < 0.875 ? "0.75" : "1";
      }
    },
    {
      id: rootShapeVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    },
    {
      id: rootShapeVersions.AddWhite,
      up: (_record) => {
      },
      down: (record) => {
        if (record.props.color === "white") {
          record.props.color = "black";
        }
      }
    }
  ]
});
function isShape(record) {
  if (!record) return false;
  return record.typeName === "shape";
}
function isShapeId(id) {
  if (!id) return false;
  return id.startsWith("shape:");
}
function createShapeId(id) {
  return `shape:${id ?? (0, import_utils.uniqueId)()}`;
}
function getShapePropKeysByStyle(props) {
  const propKeysByStyle = /* @__PURE__ */ new Map();
  for (const [key, prop] of Object.entries(props)) {
    if (prop instanceof import_StyleProp.StyleProp) {
      if (propKeysByStyle.has(prop)) {
        throw new Error(
          `Duplicate style prop ${prop.id}. Each style prop can only be used once within a shape.`
        );
      }
      propKeysByStyle.set(prop, key);
    }
  }
  return propKeysByStyle;
}
function createShapePropsMigrationSequence(migrations) {
  return migrations;
}
function createShapePropsMigrationIds(shapeType, ids) {
  return (0, import_utils.mapObjectMapValues)(ids, (_k, v) => `com.tldraw.shape.${shapeType}/${v}`);
}
function createShapeRecordType(shapes) {
  return (0, import_store.createRecordType)("shape", {
    scope: "document",
    validator: import_validate.T.model(
      "shape",
      import_validate.T.union(
        "type",
        (0, import_utils.mapObjectMapValues)(
          shapes,
          (type, { props, meta }) => (0, import_TLBaseShape.createShapeValidator)(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    x: 0,
    y: 0,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta: {}
  }));
}
//# sourceMappingURL=TLShape.js.map
