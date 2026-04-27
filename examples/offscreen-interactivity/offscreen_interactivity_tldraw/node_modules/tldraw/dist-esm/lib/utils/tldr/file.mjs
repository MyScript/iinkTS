import {
  FileHelpers,
  MigrationFailureReason,
  Result,
  T,
  createTLStore,
  exhaustiveSwitchError,
  fetch,
  transact
} from "@tldraw/editor";
import { buildFromV1Document } from "../tldr/buildFromV1Document.mjs";
const TLDRAW_FILE_MIMETYPE = "application/vnd.tldraw+json";
const TLDRAW_FILE_EXTENSION = ".tldr";
const LATEST_TLDRAW_FILE_FORMAT_VERSION = 1;
const schemaV1 = T.object({
  schemaVersion: T.literal(1),
  storeVersion: T.positiveInteger,
  recordVersions: T.dict(
    T.string,
    T.object({
      version: T.positiveInteger,
      subTypeVersions: T.dict(T.string, T.positiveInteger).optional(),
      subTypeKey: T.string.optional()
    })
  )
});
const schemaV2 = T.object({
  schemaVersion: T.literal(2),
  sequences: T.dict(T.string, T.positiveInteger)
});
const tldrawFileValidator = T.object({
  tldrawFileFormatVersion: T.nonZeroInteger,
  schema: T.numberUnion("schemaVersion", {
    1: schemaV1,
    2: schemaV2
  }),
  records: T.arrayOf(
    T.object({
      id: T.string,
      typeName: T.string
    }).allowUnknownProperties()
  )
});
function isV1File(data) {
  try {
    if (data.document?.version) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
function parseTldrawJsonFile({
  json,
  schema
}) {
  let data;
  try {
    data = tldrawFileValidator.validate(JSON.parse(json));
  } catch (e) {
    try {
      data = JSON.parse(json);
      if (isV1File(data)) {
        return Result.err({ type: "v1File", data });
      }
    } catch {
    }
    return Result.err({ type: "notATldrawFile", cause: e });
  }
  if (data.tldrawFileFormatVersion > LATEST_TLDRAW_FILE_FORMAT_VERSION) {
    return Result.err({
      type: "fileFormatVersionTooNew",
      version: data.tldrawFileFormatVersion
    });
  }
  let migrationResult;
  let storeSnapshot;
  try {
    const records = pruneUnusedAssets(data.records);
    storeSnapshot = Object.fromEntries(records.map((r) => [r.id, r]));
    migrationResult = schema.migrateStoreSnapshot({ store: storeSnapshot, schema: data.schema });
  } catch (e) {
    return Result.err({ type: "invalidRecords", cause: e });
  }
  if (migrationResult.type === "error") {
    return Result.err({ type: "migrationFailed", reason: migrationResult.reason });
  }
  try {
    return Result.ok(
      createTLStore({
        snapshot: { store: storeSnapshot, schema: data.schema },
        schema
      })
    );
  } catch (e) {
    return Result.err({ type: "invalidRecords", cause: e });
  }
}
function pruneUnusedAssets(records) {
  const usedAssets = /* @__PURE__ */ new Set();
  for (const record of records) {
    if (record.typeName === "shape" && "assetId" in record.props && record.props.assetId) {
      usedAssets.add(record.props.assetId);
    }
  }
  return records.filter((r) => r.typeName !== "asset" || usedAssets.has(r.id));
}
async function serializeTldrawJson(editor) {
  const records = [];
  for (const record of editor.store.allRecords()) {
    switch (record.typeName) {
      case "asset":
        if (record.type !== "bookmark" && record.props.src && !record.props.src.startsWith("data:")) {
          let assetSrcToSave;
          try {
            let src = record.props.src;
            if (!src.startsWith("http")) {
              src = (await editor.resolveAssetUrl(record.id, { shouldResolveToOriginal: true })) || "";
            }
            assetSrcToSave = await FileHelpers.blobToDataUrl(await (await fetch(src)).blob());
          } catch {
            assetSrcToSave = record.props.src;
          }
          records.push({
            ...record,
            props: {
              ...record.props,
              src: assetSrcToSave
            }
          });
        } else {
          records.push(record);
        }
        break;
      default:
        records.push(record);
        break;
    }
  }
  return JSON.stringify({
    tldrawFileFormatVersion: LATEST_TLDRAW_FILE_FORMAT_VERSION,
    schema: editor.store.schema.serialize(),
    records: pruneUnusedAssets(records)
  });
}
async function serializeTldrawJsonBlob(editor) {
  return new Blob([await serializeTldrawJson(editor)], { type: TLDRAW_FILE_MIMETYPE });
}
async function parseAndLoadDocument(editor, document, msg, addToast, onV1FileLoad, forceDarkMode) {
  const parseFileResult = parseTldrawJsonFile({
    schema: editor.store.schema,
    json: document
  });
  if (!parseFileResult.ok) {
    let description;
    switch (parseFileResult.error.type) {
      case "notATldrawFile":
        editor.annotateError(parseFileResult.error.cause, {
          origin: "file-system.open.parse",
          willCrashApp: false,
          tags: { parseErrorType: parseFileResult.error.type }
        });
        reportError(parseFileResult.error.cause);
        description = msg("file-system.file-open-error.not-a-tldraw-file");
        break;
      case "fileFormatVersionTooNew":
        description = msg("file-system.file-open-error.file-format-version-too-new");
        break;
      case "migrationFailed":
        if (parseFileResult.error.reason === MigrationFailureReason.TargetVersionTooNew) {
          description = msg("file-system.file-open-error.file-format-version-too-new");
        } else {
          description = msg("file-system.file-open-error.generic-corrupted-file");
        }
        break;
      case "invalidRecords":
        editor.annotateError(parseFileResult.error.cause, {
          origin: "file-system.open.parse",
          willCrashApp: false,
          tags: { parseErrorType: parseFileResult.error.type }
        });
        reportError(parseFileResult.error.cause);
        description = msg("file-system.file-open-error.generic-corrupted-file");
        break;
      case "v1File": {
        buildFromV1Document(editor, parseFileResult.error.data.document);
        onV1FileLoad?.();
        return;
      }
      default:
        exhaustiveSwitchError(parseFileResult.error, "type");
    }
    addToast({
      title: msg("file-system.file-open-error.title"),
      description,
      severity: "error"
    });
    return;
  }
  transact(() => {
    const snapshot = parseFileResult.value.getStoreSnapshot();
    editor.loadSnapshot(snapshot);
    editor.clearHistory();
    extractAssets(editor, snapshot, msg, addToast);
    const bounds = editor.getCurrentPageBounds();
    if (bounds) {
      editor.zoomToBounds(bounds, { targetZoom: 1, immediate: true });
    }
  });
  if (forceDarkMode) editor.user.updateUserPreferences({ colorScheme: "dark" });
}
async function extractAssets(editor, snapshot, msg, addToast) {
  const mediaAssets = /* @__PURE__ */ new Map();
  for (const record of Object.values(snapshot.store)) {
    if (record.typeName === "asset" && record.props.src && record.props.src.startsWith("data:") && (record.type === "image" || record.type === "video")) {
      mediaAssets.set(record.id, record);
    }
  }
  Promise.allSettled(
    [...mediaAssets].map(async ([id, asset]) => {
      try {
        const blob = await fetch(asset.props.src).then((r) => r.blob());
        const file = new File([blob], asset.props.name, {
          type: asset.props.mimeType
        });
        const newAsset = await editor.getAssetForExternalContent({
          type: "file",
          file
        });
        if (!newAsset) {
          throw Error("Could not create an asset");
        }
        editor.updateAssets([{ ...newAsset, id }]);
      } catch (error) {
        addToast({
          title: msg("assets.files.upload-failed"),
          severity: "error"
        });
        console.error(error);
        return;
      }
    })
  );
}
export {
  TLDRAW_FILE_EXTENSION,
  TLDRAW_FILE_MIMETYPE,
  isV1File,
  parseAndLoadDocument,
  parseTldrawJsonFile,
  serializeTldrawJson,
  serializeTldrawJsonBlob
};
//# sourceMappingURL=file.mjs.map
