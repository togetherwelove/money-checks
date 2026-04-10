import type { SupabaseAuthStorage } from "./supabaseStorage.shared";

function getWebStorage(): Storage | null {
  return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
}

export const authStorage: SupabaseAuthStorage = {
  getItem: async (key) => getWebStorage()?.getItem(key) ?? null,
  removeItem: async (key) => {
    getWebStorage()?.removeItem(key);
  },
  setItem: async (key, value) => {
    getWebStorage()?.setItem(key, value);
  },
};
