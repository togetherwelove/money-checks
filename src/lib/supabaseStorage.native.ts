import * as SecureStore from "expo-secure-store";

import {
  buildChunkManifest,
  parseChunkManifest,
  resolveChunkStorageKey,
  splitSecureStoreValue,
} from "./secureStoreChunking";
import type { SupabaseAuthStorage } from "./supabaseStorage.shared";

export const authStorage: SupabaseAuthStorage = {
  getItem: async (key) => {
    const storedValue = await SecureStore.getItemAsync(key);
    const chunkCount = parseChunkManifest(storedValue);
    if (chunkCount === null) {
      return storedValue;
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_value, index) =>
        SecureStore.getItemAsync(resolveChunkStorageKey(key, index)),
      ),
    );

    return chunks.every((chunk) => typeof chunk === "string") ? chunks.join("") : null;
  },
  removeItem: async (key) => {
    const storedValue = await SecureStore.getItemAsync(key);
    const chunkCount = parseChunkManifest(storedValue);

    await SecureStore.deleteItemAsync(key);

    if (chunkCount === null) {
      return;
    }

    await Promise.all(
      Array.from({ length: chunkCount }, (_value, index) =>
        SecureStore.deleteItemAsync(resolveChunkStorageKey(key, index)),
      ),
    );
  },
  setItem: async (key, value) => {
    const previousValue = await SecureStore.getItemAsync(key);
    const previousChunkCount = parseChunkManifest(previousValue);

    if (previousChunkCount !== null) {
      await Promise.all(
        Array.from({ length: previousChunkCount }, (_value, index) =>
          SecureStore.deleteItemAsync(resolveChunkStorageKey(key, index)),
        ),
      );
    }

    const chunks = splitSecureStoreValue(value);
    if (chunks.length === 1) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(resolveChunkStorageKey(key, index), chunk),
      ),
    );
    await SecureStore.setItemAsync(key, buildChunkManifest(chunks.length));
  },
};
