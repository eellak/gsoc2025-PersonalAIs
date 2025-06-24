import { MemoryCache } from "./memory-cache";
import { Cache } from "./cache.interface";

let serverCache: Cache;

declare global {
  // eslint-disable-next-line no-var
  var __server__cache__: Cache | undefined;
}

if (globalThis.__server__cache__) {
  serverCache = globalThis.__server__cache__;
} else {
  globalThis.__server__cache__ = new MemoryCache();
  serverCache = globalThis.__server__cache__;
}

export { serverCache };
