import { AuthStorageConfig } from "../constants/authStorage";

export function splitSecureStoreValue(value: string): string[] {
  const chunks: string[] = [];

  for (let start = 0; start < value.length; start += AuthStorageConfig.chunkLength) {
    chunks.push(value.slice(start, start + AuthStorageConfig.chunkLength));
  }

  return chunks;
}

export function buildChunkManifest(chunkCount: number): string {
  return `${AuthStorageConfig.chunkPrefix}${chunkCount}`;
}

export function parseChunkManifest(value: string | null): number | null {
  if (!value?.startsWith(AuthStorageConfig.chunkPrefix)) {
    return null;
  }

  const chunkCount = Number.parseInt(value.slice(AuthStorageConfig.chunkPrefix.length), 10);
  return Number.isFinite(chunkCount) ? chunkCount : null;
}

export function resolveChunkStorageKey(key: string, index: number): string {
  return `${key}${AuthStorageConfig.chunkSeparator}${index}`;
}
