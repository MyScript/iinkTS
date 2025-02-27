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
var storage_exports = {};
__export(storage_exports, {
  clearLocalStorage: () => clearLocalStorage,
  clearSessionStorage: () => clearSessionStorage,
  deleteFromLocalStorage: () => deleteFromLocalStorage,
  deleteFromSessionStorage: () => deleteFromSessionStorage,
  getFromLocalStorage: () => getFromLocalStorage,
  getFromSessionStorage: () => getFromSessionStorage,
  setInLocalStorage: () => setInLocalStorage,
  setInSessionStorage: () => setInSessionStorage
});
module.exports = __toCommonJS(storage_exports);
function getFromLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setInLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}
function deleteFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}
function clearLocalStorage() {
  try {
    localStorage.clear();
  } catch {
  }
}
function getFromSessionStorage(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function setInSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
  }
}
function deleteFromSessionStorage(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
  }
}
function clearSessionStorage() {
  try {
    sessionStorage.clear();
  } catch {
  }
}
//# sourceMappingURL=storage.js.map
