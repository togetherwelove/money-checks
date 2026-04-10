import { describe, expect, it } from "vitest";

import { AuthStorageConfig } from "../constants/authStorage";
import {
  buildChunkManifest,
  parseChunkManifest,
  resolveChunkStorageKey,
  splitSecureStoreValue,
} from "./secureStoreChunking";

describe("secureStoreChunking", () => {
  it("splits large values by configured chunk length", () => {
    const value = "a".repeat(AuthStorageConfig.chunkLength + 10);
    expect(splitSecureStoreValue(value)).toEqual([
      "a".repeat(AuthStorageConfig.chunkLength),
      "a".repeat(10),
    ]);
  });

  it("parses and formats chunk manifests", () => {
    expect(parseChunkManifest(buildChunkManifest(3))).toBe(3);
    expect(parseChunkManifest("plain-value")).toBeNull();
    expect(resolveChunkStorageKey("session", 2)).toBe("session__chunk__2");
  });
});
