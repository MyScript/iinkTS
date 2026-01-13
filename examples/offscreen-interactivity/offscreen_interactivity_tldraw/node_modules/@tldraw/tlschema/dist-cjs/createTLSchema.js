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
var createTLSchema_exports = {};
__export(createTLSchema_exports, {
  createTLSchema: () => createTLSchema,
  defaultBindingSchemas: () => defaultBindingSchemas,
  defaultShapeSchemas: () => defaultShapeSchemas
});
module.exports = __toCommonJS(createTLSchema_exports);
var import_store = require("@tldraw/store");
var import_utils = require("@tldraw/utils");
var import_TLStore = require("./TLStore");
var import_TLBookmarkAsset = require("./assets/TLBookmarkAsset");
var import_TLImageAsset = require("./assets/TLImageAsset");
var import_TLVideoAsset = require("./assets/TLVideoAsset");
var import_TLArrowBinding = require("./bindings/TLArrowBinding");
var import_TLAsset = require("./records/TLAsset");
var import_TLBinding = require("./records/TLBinding");
var import_TLCamera = require("./records/TLCamera");
var import_TLDocument = require("./records/TLDocument");
var import_TLInstance = require("./records/TLInstance");
var import_TLPage = require("./records/TLPage");
var import_TLPageState = require("./records/TLPageState");
var import_TLPointer = require("./records/TLPointer");
var import_TLPresence = require("./records/TLPresence");
var import_TLShape = require("./records/TLShape");
var import_recordsWithProps = require("./recordsWithProps");
var import_TLArrowShape = require("./shapes/TLArrowShape");
var import_TLBookmarkShape = require("./shapes/TLBookmarkShape");
var import_TLDrawShape = require("./shapes/TLDrawShape");
var import_TLEmbedShape = require("./shapes/TLEmbedShape");
var import_TLFrameShape = require("./shapes/TLFrameShape");
var import_TLGeoShape = require("./shapes/TLGeoShape");
var import_TLGroupShape = require("./shapes/TLGroupShape");
var import_TLHighlightShape = require("./shapes/TLHighlightShape");
var import_TLImageShape = require("./shapes/TLImageShape");
var import_TLLineShape = require("./shapes/TLLineShape");
var import_TLNoteShape = require("./shapes/TLNoteShape");
var import_TLTextShape = require("./shapes/TLTextShape");
var import_TLVideoShape = require("./shapes/TLVideoShape");
var import_store_migrations = require("./store-migrations");
const defaultShapeSchemas = {
  arrow: { migrations: import_TLArrowShape.arrowShapeMigrations, props: import_TLArrowShape.arrowShapeProps },
  bookmark: { migrations: import_TLBookmarkShape.bookmarkShapeMigrations, props: import_TLBookmarkShape.bookmarkShapeProps },
  draw: { migrations: import_TLDrawShape.drawShapeMigrations, props: import_TLDrawShape.drawShapeProps },
  embed: { migrations: import_TLEmbedShape.embedShapeMigrations, props: import_TLEmbedShape.embedShapeProps },
  frame: { migrations: import_TLFrameShape.frameShapeMigrations, props: import_TLFrameShape.frameShapeProps },
  geo: { migrations: import_TLGeoShape.geoShapeMigrations, props: import_TLGeoShape.geoShapeProps },
  group: { migrations: import_TLGroupShape.groupShapeMigrations, props: import_TLGroupShape.groupShapeProps },
  highlight: { migrations: import_TLHighlightShape.highlightShapeMigrations, props: import_TLHighlightShape.highlightShapeProps },
  image: { migrations: import_TLImageShape.imageShapeMigrations, props: import_TLImageShape.imageShapeProps },
  line: { migrations: import_TLLineShape.lineShapeMigrations, props: import_TLLineShape.lineShapeProps },
  note: { migrations: import_TLNoteShape.noteShapeMigrations, props: import_TLNoteShape.noteShapeProps },
  text: { migrations: import_TLTextShape.textShapeMigrations, props: import_TLTextShape.textShapeProps },
  video: { migrations: import_TLVideoShape.videoShapeMigrations, props: import_TLVideoShape.videoShapeProps }
};
const defaultBindingSchemas = {
  arrow: { migrations: import_TLArrowBinding.arrowBindingMigrations, props: import_TLArrowBinding.arrowBindingProps }
};
function createTLSchema({
  shapes = defaultShapeSchemas,
  bindings = defaultBindingSchemas,
  migrations
} = {}) {
  const stylesById = /* @__PURE__ */ new Map();
  for (const shape of (0, import_utils.objectMapValues)(shapes)) {
    for (const style of (0, import_TLShape.getShapePropKeysByStyle)(shape.props ?? {}).keys()) {
      if (stylesById.has(style.id) && stylesById.get(style.id) !== style) {
        throw new Error(`Multiple StyleProp instances with the same id: ${style.id}`);
      }
      stylesById.set(style.id, style);
    }
  }
  const ShapeRecordType = (0, import_TLShape.createShapeRecordType)(shapes);
  const BindingRecordType = (0, import_TLBinding.createBindingRecordType)(bindings);
  const InstanceRecordType = (0, import_TLInstance.createInstanceRecordType)(stylesById);
  return import_store.StoreSchema.create(
    {
      asset: import_TLAsset.AssetRecordType,
      binding: BindingRecordType,
      camera: import_TLCamera.CameraRecordType,
      document: import_TLDocument.DocumentRecordType,
      instance: InstanceRecordType,
      instance_page_state: import_TLPageState.InstancePageStateRecordType,
      page: import_TLPage.PageRecordType,
      instance_presence: import_TLPresence.InstancePresenceRecordType,
      pointer: import_TLPointer.PointerRecordType,
      shape: ShapeRecordType
    },
    {
      migrations: [
        import_store_migrations.storeMigrations,
        import_TLAsset.assetMigrations,
        import_TLCamera.cameraMigrations,
        import_TLDocument.documentMigrations,
        import_TLInstance.instanceMigrations,
        import_TLPageState.instancePageStateMigrations,
        import_TLPage.pageMigrations,
        import_TLPresence.instancePresenceMigrations,
        import_TLPointer.pointerMigrations,
        import_TLShape.rootShapeMigrations,
        import_TLBookmarkAsset.bookmarkAssetMigrations,
        import_TLImageAsset.imageAssetMigrations,
        import_TLVideoAsset.videoAssetMigrations,
        ...(0, import_recordsWithProps.processPropsMigrations)("shape", shapes),
        ...(0, import_recordsWithProps.processPropsMigrations)("binding", bindings),
        ...migrations ?? []
      ],
      onValidationFailure: import_TLStore.onValidationFailure,
      createIntegrityChecker: import_TLStore.createIntegrityChecker
    }
  );
}
//# sourceMappingURL=createTLSchema.js.map
