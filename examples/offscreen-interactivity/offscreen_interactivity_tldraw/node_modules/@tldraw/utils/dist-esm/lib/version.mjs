const TLDRAW_LIBRARY_VERSION_KEY = "__TLDRAW_LIBRARY_VERSIONS__";
function getLibraryVersions() {
  if (globalThis[TLDRAW_LIBRARY_VERSION_KEY]) {
    return globalThis[TLDRAW_LIBRARY_VERSION_KEY];
  }
  const info = {
    versions: [],
    didWarn: false,
    scheduledNotice: null
  };
  Object.defineProperty(globalThis, TLDRAW_LIBRARY_VERSION_KEY, {
    value: info,
    writable: false,
    configurable: false,
    enumerable: false
  });
  return info;
}
function clearRegisteredVersionsForTests() {
  const info = getLibraryVersions();
  info.versions = [];
  info.didWarn = false;
  if (info.scheduledNotice) {
    clearTimeout(info.scheduledNotice);
    info.scheduledNotice = null;
  }
}
function registerTldrawLibraryVersion(name, version, modules) {
  if (!name || !version || !modules) {
    if (true) {
      throw new Error("Missing name/version/module system in built version of tldraw library");
    }
    return;
  }
  const info = getLibraryVersions();
  info.versions.push({ name, version, modules });
  if (!info.scheduledNotice) {
    try {
      info.scheduledNotice = setTimeout(() => {
        info.scheduledNotice = null;
        checkLibraryVersions(info);
      }, 100);
    } catch {
      checkLibraryVersions(info);
    }
  }
}
function checkLibraryVersions(info) {
  if (!info.versions.length) return;
  if (info.didWarn) return;
  const sorted = info.versions.sort((a, b) => compareVersions(a.version, b.version));
  const latestVersion = sorted[sorted.length - 1].version;
  const matchingVersions = /* @__PURE__ */ new Set();
  const nonMatchingVersions = /* @__PURE__ */ new Map();
  for (const lib of sorted) {
    if (nonMatchingVersions.has(lib.name)) {
      matchingVersions.delete(lib.name);
      entry(nonMatchingVersions, lib.name, /* @__PURE__ */ new Set()).add(lib.version);
      continue;
    }
    if (lib.version === latestVersion) {
      matchingVersions.add(lib.name);
    } else {
      matchingVersions.delete(lib.name);
      entry(nonMatchingVersions, lib.name, /* @__PURE__ */ new Set()).add(lib.version);
    }
  }
  if (nonMatchingVersions.size > 0) {
    const message = [
      `${format("[tldraw]", ["bold", "bgRed", "textWhite"])} ${format("You have multiple versions of tldraw libraries installed. This can lead to bugs and unexpected behavior.", ["textRed", "bold"])}`,
      "",
      `The latest version you have installed is ${format(`v${latestVersion}`, ["bold", "textBlue"])}. The following libraries are on the latest version:`,
      ...Array.from(matchingVersions, (name) => `  \u2022 \u2705 ${format(name, ["bold"])}`),
      "",
      `The following libraries are not on the latest version, or have multiple versions installed:`,
      ...Array.from(nonMatchingVersions, ([name, versions]) => {
        const sortedVersions = Array.from(versions).sort(compareVersions).map((v) => format(`v${v}`, v === latestVersion ? ["textGreen"] : ["textRed"]));
        return `  \u2022 \u274C ${format(name, ["bold"])} (${sortedVersions.join(", ")})`;
      })
    ];
    console.log(message.join("\n"));
    info.didWarn = true;
    return;
  }
  const potentialDuplicates = /* @__PURE__ */ new Map();
  for (const lib of sorted) {
    entry(potentialDuplicates, lib.name, { version: lib.version, modules: [] }).modules.push(
      lib.modules
    );
  }
  const duplicates = /* @__PURE__ */ new Map();
  for (const [name, lib] of potentialDuplicates) {
    if (lib.modules.length > 1) duplicates.set(name, lib);
  }
  if (duplicates.size > 0) {
    const message = [
      `${format("[tldraw]", ["bold", "bgRed", "textWhite"])} ${format("You have multiple instances of some tldraw libraries active. This can lead to bugs and unexpected behavior. ", ["textRed", "bold"])}`,
      "",
      "This usually means that your bundler is misconfigured, and is importing the same library multiple times - usually once as an ES Module, and once as a CommonJS module.",
      "",
      "The following libraries have been imported multiple times:",
      ...Array.from(duplicates, ([name, lib]) => {
        const modules = lib.modules.map((m, i) => m === "esm" ? `      ${i + 1}. ES Modules` : `      ${i + 1}. CommonJS`).join("\n");
        return `  \u2022 \u274C ${format(name, ["bold"])} v${lib.version}: 
${modules}`;
      }),
      "",
      "You should configure your bundler to only import one version of each library."
    ];
    console.log(message.join("\n"));
    info.didWarn = true;
    return;
  }
}
function compareVersions(a, b) {
  const aMatch = a.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/);
  const bMatch = b.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/);
  if (!aMatch || !bMatch) return a.localeCompare(b);
  if (aMatch[1] !== bMatch[1]) return Number(aMatch[1]) - Number(bMatch[1]);
  if (aMatch[2] !== bMatch[2]) return Number(aMatch[2]) - Number(bMatch[2]);
  if (aMatch[3] !== bMatch[3]) return Number(aMatch[3]) - Number(bMatch[3]);
  if (aMatch[4] && bMatch[4]) return aMatch[4].localeCompare(bMatch[4]);
  if (aMatch[4]) return 1;
  if (bMatch[4]) return -1;
  return 0;
}
const formats = {
  bold: "1",
  textBlue: "94",
  textRed: "31",
  textGreen: "32",
  bgRed: "41",
  textWhite: "97"
};
function format(value, formatters = []) {
  return `\x1B[${formatters.map((f) => formats[f]).join(";")}m${value}\x1B[m`;
}
function entry(map, key, defaultValue) {
  if (map.has(key)) {
    return map.get(key);
  }
  map.set(key, defaultValue);
  return defaultValue;
}
export {
  clearRegisteredVersionsForTests,
  registerTldrawLibraryVersion
};
//# sourceMappingURL=version.mjs.map
