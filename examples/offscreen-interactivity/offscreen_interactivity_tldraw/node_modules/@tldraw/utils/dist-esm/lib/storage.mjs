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
export {
  clearLocalStorage,
  clearSessionStorage,
  deleteFromLocalStorage,
  deleteFromSessionStorage,
  getFromLocalStorage,
  getFromSessionStorage,
  setInLocalStorage,
  setInSessionStorage
};
//# sourceMappingURL=storage.mjs.map
