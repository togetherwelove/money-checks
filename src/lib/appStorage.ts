import type { AppStorage } from "./appStorage.shared";

const fallbackStorage = new Map<string, string>();

export const appStorage: AppStorage = {
  getItem: (key) => fallbackStorage.get(key) ?? null,
  removeItem: (key) => {
    fallbackStorage.delete(key);
  },
  setItem: (key, value) => {
    fallbackStorage.set(key, value);
  },
};
