import { StoreSchema } from "@tldraw/store";
import { objectMapValues } from "@tldraw/utils";
import { createIntegrityChecker, onValidationFailure } from "./TLStore.mjs";
import { bookmarkAssetMigrations } from "./assets/TLBookmarkAsset.mjs";
import { imageAssetMigrations } from "./assets/TLImageAsset.mjs";
import { videoAssetMigrations } from "./assets/TLVideoAsset.mjs";
import { arrowBindingMigrations, arrowBindingProps } from "./bindings/TLArrowBinding.mjs";
import { AssetRecordType, assetMigrations } from "./records/TLAsset.mjs";
import { createBindingRecordType } from "./records/TLBinding.mjs";
import { CameraRecordType, cameraMigrations } from "./records/TLCamera.mjs";
import { DocumentRecordType, documentMigrations } from "./records/TLDocument.mjs";
import { createInstanceRecordType, instanceMigrations } from "./records/TLInstance.mjs";
import { PageRecordType, pageMigrations } from "./records/TLPage.mjs";
import { InstancePageStateRecordType, instancePageStateMigrations } from "./records/TLPageState.mjs";
import { PointerRecordType, pointerMigrations } from "./records/TLPointer.mjs";
import { InstancePresenceRecordType, instancePresenceMigrations } from "./records/TLPresence.mjs";
import {
  createShapeRecordType,
  getShapePropKeysByStyle,
  rootShapeMigrations
} from "./records/TLShape.mjs";
import { processPropsMigrations } from "./recordsWithProps.mjs";
import { arrowShapeMigrations, arrowShapeProps } from "./shapes/TLArrowShape.mjs";
import { bookmarkShapeMigrations, bookmarkShapeProps } from "./shapes/TLBookmarkShape.mjs";
import { drawShapeMigrations, drawShapeProps } from "./shapes/TLDrawShape.mjs";
import { embedShapeMigrations, embedShapeProps } from "./shapes/TLEmbedShape.mjs";
import { frameShapeMigrations, frameShapeProps } from "./shapes/TLFrameShape.mjs";
import { geoShapeMigrations, geoShapeProps } from "./shapes/TLGeoShape.mjs";
import { groupShapeMigrations, groupShapeProps } from "./shapes/TLGroupShape.mjs";
import { highlightShapeMigrations, highlightShapeProps } from "./shapes/TLHighlightShape.mjs";
import { imageShapeMigrations, imageShapeProps } from "./shapes/TLImageShape.mjs";
import { lineShapeMigrations, lineShapeProps } from "./shapes/TLLineShape.mjs";
import { noteShapeMigrations, noteShapeProps } from "./shapes/TLNoteShape.mjs";
import { textShapeMigrations, textShapeProps } from "./shapes/TLTextShape.mjs";
import { videoShapeMigrations, videoShapeProps } from "./shapes/TLVideoShape.mjs";
import { storeMigrations } from "./store-migrations.mjs";
const defaultShapeSchemas = {
  arrow: { migrations: arrowShapeMigrations, props: arrowShapeProps },
  bookmark: { migrations: bookmarkShapeMigrations, props: bookmarkShapeProps },
  draw: { migrations: drawShapeMigrations, props: drawShapeProps },
  embed: { migrations: embedShapeMigrations, props: embedShapeProps },
  frame: { migrations: frameShapeMigrations, props: frameShapeProps },
  geo: { migrations: geoShapeMigrations, props: geoShapeProps },
  group: { migrations: groupShapeMigrations, props: groupShapeProps },
  highlight: { migrations: highlightShapeMigrations, props: highlightShapeProps },
  image: { migrations: imageShapeMigrations, props: imageShapeProps },
  line: { migrations: lineShapeMigrations, props: lineShapeProps },
  note: { migrations: noteShapeMigrations, props: noteShapeProps },
  text: { migrations: textShapeMigrations, props: textShapeProps },
  video: { migrations: videoShapeMigrations, props: videoShapeProps }
};
const defaultBindingSchemas = {
  arrow: { migrations: arrowBindingMigrations, props: arrowBindingProps }
};
function createTLSchema({
  shapes = defaultShapeSchemas,
  bindings = defaultBindingSchemas,
  migrations
} = {}) {
  const stylesById = /* @__PURE__ */ new Map();
  for (const shape of objectMapValues(shapes)) {
    for (const style of getShapePropKeysByStyle(shape.props ?? {}).keys()) {
      if (stylesById.has(style.id) && stylesById.get(style.id) !== style) {
        throw new Error(`Multiple StyleProp instances with the same id: ${style.id}`);
      }
      stylesById.set(style.id, style);
    }
  }
  const ShapeRecordType = createShapeRecordType(shapes);
  const BindingRecordType = createBindingRecordType(bindings);
  const InstanceRecordType = createInstanceRecordType(stylesById);
  return StoreSchema.create(
    {
      asset: AssetRecordType,
      binding: BindingRecordType,
      camera: CameraRecordType,
      document: DocumentRecordType,
      instance: InstanceRecordType,
      instance_page_state: InstancePageStateRecordType,
      page: PageRecordType,
      instance_presence: InstancePresenceRecordType,
      pointer: PointerRecordType,
      shape: ShapeRecordType
    },
    {
      migrations: [
        storeMigrations,
        assetMigrations,
        cameraMigrations,
        documentMigrations,
        instanceMigrations,
        instancePageStateMigrations,
        pageMigrations,
        instancePresenceMigrations,
        pointerMigrations,
        rootShapeMigrations,
        bookmarkAssetMigrations,
        imageAssetMigrations,
        videoAssetMigrations,
        ...processPropsMigrations("shape", shapes),
        ...processPropsMigrations("binding", bindings),
        ...(migrations ?? [])
      ],
      onValidationFailure,
      createIntegrityChecker
    }
  );
}
export {
  createTLSchema,
  defaultBindingSchemas,
  defaultShapeSchemas
};
//# sourceMappingURL=createTLSchema.mjs.map
