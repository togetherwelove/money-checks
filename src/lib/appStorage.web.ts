import type { AppStorage } from "./appStorage.shared";

function getWebStorage(): Storage | null {
  return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
}

export const appStorage: AppStorage = {
  getItem: (key) => getWebStorage()?.getItem(key) ?? null,
  removeItem: (key) => {
    getWebStorage()?.removeItem(key);
  },
  setItem: (key, value) => {
    getWebStorage()?.setItem(key, value);
  },
};
