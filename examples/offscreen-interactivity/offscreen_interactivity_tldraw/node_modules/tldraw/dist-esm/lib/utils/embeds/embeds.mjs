import { safeParseUrl } from "@tldraw/editor";
function escapeStringRegexp(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function matchEmbedUrl(definitions, url) {
  const parsed = safeParseUrl(url);
  if (!parsed) return;
  const host = parsed.host.replace("www.", "");
  for (const localEmbedDef of definitions) {
    if (checkHostnames(localEmbedDef.hostnames, host)) {
      const originalUrl = localEmbedDef.fromEmbedUrl(url);
      if (originalUrl) {
        return {
          definition: localEmbedDef,
          url: originalUrl,
          embedUrl: url
        };
      }
    }
  }
}
const globlikeRegExp = (input) => {
  return input.split("*").map((str) => escapeStringRegexp(str)).join(".+");
};
const checkHostnames = (hostnames, targetHostname) => {
  return !!hostnames.find((hostname) => {
    const re = new RegExp(globlikeRegExp(hostname));
    return targetHostname.match(re);
  });
};
function matchUrl(definitions, url) {
  const parsed = safeParseUrl(url);
  if (!parsed) return;
  const host = parsed.host.replace("www.", "");
  for (const localEmbedDef of definitions) {
    if (checkHostnames(localEmbedDef.hostnames, host)) {
      const embedUrl = localEmbedDef.toEmbedUrl(url);
      if (embedUrl) {
        return {
          definition: localEmbedDef,
          embedUrl,
          url
        };
      }
    }
  }
}
function getEmbedInfo(definitions, inputUrl) {
  try {
    return matchUrl(definitions, inputUrl) ?? matchEmbedUrl(definitions, inputUrl);
  } catch {
    return void 0;
  }
}
export {
  getEmbedInfo,
  matchEmbedUrl,
  matchUrl
};
//# sourceMappingURL=embeds.mjs.map
