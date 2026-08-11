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
var LocalIndexedDb_exports = {};
__export(LocalIndexedDb_exports, {
  LocalIndexedDb: () => LocalIndexedDb,
  Table: () => Table,
  getAllIndexDbNames: () => getAllIndexDbNames
});
module.exports = __toCommonJS(LocalIndexedDb_exports);
var import_utils = require("@tldraw/utils");
var import_idb = require("idb");
const STORE_PREFIX = "TLDRAW_DOCUMENT_v2";
const LEGACY_ASSET_STORE_PREFIX = "TLDRAW_ASSET_STORE_v1";
const dbNameIndexKey = "TLDRAW_DB_NAME_INDEX_v2";
const Table = {
  Records: "records",
  Schema: "schema",
  SessionState: "session_state",
  Assets: "assets"
};
async function openLocalDb(persistenceKey) {
  const storeId = STORE_PREFIX + persistenceKey;
  addDbName(storeId);
  return await (0, import_idb.openDB)(storeId, 4, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(Table.Records)) {
        database.createObjectStore(Table.Records);
      }
      if (!database.objectStoreNames.contains(Table.Schema)) {
        database.createObjectStore(Table.Schema);
      }
      if (!database.objectStoreNames.contains(Table.SessionState)) {
        database.createObjectStore(Table.SessionState);
      }
      if (!database.objectStoreNames.contains(Table.Assets)) {
        database.createObjectStore(Table.Assets);
      }
    }
  });
}
async function migrateLegacyAssetDbIfNeeded(persistenceKey) {
  const databases = window.indexedDB.databases ? (await window.indexedDB.databases()).map((db) => db.name) : getAllIndexDbNames();
  const oldStoreId = LEGACY_ASSET_STORE_PREFIX + persistenceKey;
  const existing = databases.find((dbName) => dbName === oldStoreId);
  if (!existing) return;
  const oldAssetDb = await (0, import_idb.openDB)(oldStoreId, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("assets")) {
        database.createObjectStore("assets");
      }
    }
  });
  if (!oldAssetDb.objectStoreNames.contains("assets")) return;
  const oldTx = oldAssetDb.transaction(["assets"], "readonly");
  const oldAssetStore = oldTx.objectStore("assets");
  const oldAssetsKeys = await oldAssetStore.getAllKeys();
  const oldAssets = await Promise.all(
    oldAssetsKeys.map(async (key) => [key, await oldAssetStore.get(key)])
  );
  await oldTx.done;
  const newDb = await openLocalDb(persistenceKey);
  const newTx = newDb.transaction([Table.Assets], "readwrite");
  const newAssetTable = newTx.objectStore(Table.Assets);
  for (const [key, value] of oldAssets) {
    newAssetTable.put(value, key);
  }
  await newTx.done;
  oldAssetDb.close();
  newDb.close();
  await (0, import_idb.deleteDB)(oldStoreId);
}
class LocalIndexedDb {
  getDbPromise;
  isClosed = false;
  pendingTransactionSet = /* @__PURE__ */ new Set();
  /** @internal */
  static connectedInstances = /* @__PURE__ */ new Set();
  constructor(persistenceKey) {
    LocalIndexedDb.connectedInstances.add(this);
    this.getDbPromise = (async () => {
      await migrateLegacyAssetDbIfNeeded(persistenceKey);
      return await openLocalDb(persistenceKey);
    })();
  }
  getDb() {
    return this.getDbPromise;
  }
  /**
   * Wait for any pending transactions to be completed. Useful for tests.
   *
   * @internal
   */
  pending() {
    return Promise.allSettled([this.getDbPromise, ...this.pendingTransactionSet]).then(import_utils.noop);
  }
  async close() {
    if (this.isClosed) return;
    this.isClosed = true;
    await this.pending();
    (await this.getDb()).close();
    LocalIndexedDb.connectedInstances.delete(this);
  }
  tx(mode, names, cb) {
    const txPromise = (async () => {
      (0, import_utils.assert)(!this.isClosed, "db is closed");
      const db = await this.getDb();
      const tx = db.transaction(names, mode);
      const done = tx.done.catch((e) => {
        if (!this.isClosed) {
          throw e;
        }
      });
      try {
        return await cb(tx);
      } finally {
        if (!this.isClosed) {
          await done;
        } else {
          tx.abort();
        }
      }
    })();
    this.pendingTransactionSet.add(txPromise);
    txPromise.finally(() => this.pendingTransactionSet.delete(txPromise));
    return txPromise;
  }
  async load({ sessionId } = {}) {
    return await this.tx(
      "readonly",
      [Table.Records, Table.Schema, Table.SessionState],
      async (tx) => {
        const recordsStore = tx.objectStore(Table.Records);
        const schemaStore = tx.objectStore(Table.Schema);
        const sessionStateStore = tx.objectStore(Table.SessionState);
        let sessionStateSnapshot = sessionId ? (await sessionStateStore.get(sessionId))?.snapshot : null;
        if (!sessionStateSnapshot) {
          const all = await sessionStateStore.getAll();
          sessionStateSnapshot = all.sort((a, b) => a.updatedAt - b.updatedAt).pop()?.snapshot;
        }
        const result = {
          records: await recordsStore.getAll(),
          schema: await schemaStore.get(Table.Schema),
          sessionStateSnapshot
        };
        return result;
      }
    );
  }
  async storeChanges({
    schema,
    changes,
    sessionId,
    sessionStateSnapshot
  }) {
    await this.tx("readwrite", [Table.Records, Table.Schema, Table.SessionState], async (tx) => {
      const recordsStore = tx.objectStore(Table.Records);
      const schemaStore = tx.objectStore(Table.Schema);
      const sessionStateStore = tx.objectStore(Table.SessionState);
      for (const [id, record] of Object.entries(changes.added)) {
        await recordsStore.put(record, id);
      }
      for (const [_prev, updated] of Object.values(changes.updated)) {
        await recordsStore.put(updated, updated.id);
      }
      for (const id of Object.keys(changes.removed)) {
        await recordsStore.delete(id);
      }
      schemaStore.put(schema.serialize(), Table.Schema);
      if (sessionStateSnapshot && sessionId) {
        sessionStateStore.put(
          {
            snapshot: sessionStateSnapshot,
            updatedAt: Date.now(),
            id: sessionId
          },
          sessionId
        );
      } else if (sessionStateSnapshot || sessionId) {
        console.error("sessionStateSnapshot and instanceId must be provided together");
      }
    });
  }
  async storeSnapshot({
    schema,
    snapshot,
    sessionId,
    sessionStateSnapshot
  }) {
    await this.tx("readwrite", [Table.Records, Table.Schema, Table.SessionState], async (tx) => {
      const recordsStore = tx.objectStore(Table.Records);
      const schemaStore = tx.objectStore(Table.Schema);
      const sessionStateStore = tx.objectStore(Table.SessionState);
      await recordsStore.clear();
      for (const [id, record] of Object.entries(snapshot)) {
        await recordsStore.put(record, id);
      }
      schemaStore.put(schema.serialize(), Table.Schema);
      if (sessionStateSnapshot && sessionId) {
        sessionStateStore.put(
          {
            snapshot: sessionStateSnapshot,
            updatedAt: Date.now(),
            id: sessionId
          },
          sessionId
        );
      } else if (sessionStateSnapshot || sessionId) {
        console.error("sessionStateSnapshot and instanceId must be provided together");
      }
    });
  }
  async pruneSessions() {
    await this.tx("readwrite", [Table.SessionState], async (tx) => {
      const sessionStateStore = tx.objectStore(Table.SessionState);
      const all = (await sessionStateStore.getAll()).sort((a, b) => a.updatedAt - b.updatedAt);
      if (all.length < 10) {
        await tx.done;
        return;
      }
      const toDelete = all.slice(0, all.length - 10);
      for (const { id } of toDelete) {
        await sessionStateStore.delete(id);
      }
    });
  }
  async getAsset(assetId) {
    return await this.tx("readonly", [Table.Assets], async (tx) => {
      const assetsStore = tx.objectStore(Table.Assets);
      return await assetsStore.get(assetId);
    });
  }
  async storeAsset(assetId, blob) {
    await this.tx("readwrite", [Table.Assets], async (tx) => {
      const assetsStore = tx.objectStore(Table.Assets);
      await assetsStore.put(blob, assetId);
    });
  }
  async removeAssets(assetId) {
    await this.tx("readwrite", [Table.Assets], async (tx) => {
      const assetsStore = tx.objectStore(Table.Assets);
      for (const id of assetId) {
        await assetsStore.delete(id);
      }
    });
  }
}
function getAllIndexDbNames() {
  const result = JSON.parse((0, import_utils.getFromLocalStorage)(dbNameIndexKey) || "[]") ?? [];
  if (!Array.isArray(result)) {
    return [];
  }
  return result;
}
function addDbName(name) {
  const all = new Set(getAllIndexDbNames());
  all.add(name);
  (0, import_utils.setInLocalStorage)(dbNameIndexKey, JSON.stringify([...all]));
}
//# sourceMappingURL=LocalIndexedDb.js.map
